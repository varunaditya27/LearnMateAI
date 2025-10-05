/**
 * Study Buddy Connections API
 * 
 * Send connection requests and manage study buddy connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// POST - Send a connection request to a study buddy
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { recipientId, message } = body;

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    if (recipientId === auth.uid) {
      return NextResponse.json(
        { success: false, error: 'You cannot send a connection request to yourself' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const connectionsRef = collection(db, 'studyBuddyConnections');
    const existingQuery = query(
      connectionsRef,
      where('senderId', '==', auth.uid),
      where('recipientId', '==', recipientId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const existingConnection = existingSnapshot.docs[0].data();
      if (existingConnection.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Connection request already sent' },
          { status: 409 }
        );
      } else if (existingConnection.status === 'accepted') {
        return NextResponse.json(
          { success: false, error: 'You are already connected with this user' },
          { status: 409 }
        );
      }
    }

    // Check reverse connection (recipient sent to sender)
    const reverseQuery = query(
      connectionsRef,
      where('senderId', '==', recipientId),
      where('recipientId', '==', auth.uid)
    );
    const reverseSnapshot = await getDocs(reverseQuery);

    if (!reverseSnapshot.empty) {
      const reverseConnection = reverseSnapshot.docs[0].data();
      if (reverseConnection.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'This user has already sent you a connection request. Please check your inbox.' },
          { status: 409 }
        );
      } else if (reverseConnection.status === 'accepted') {
        return NextResponse.json(
          { success: false, error: 'You are already connected with this user' },
          { status: 409 }
        );
      }
    }

    // Get user info
    const senderRef = doc(db, 'users', auth.uid);
    const senderDoc = await getDoc(senderRef);
    const senderData = senderDoc.exists() ? senderDoc.data() : null;

    const recipientRef = doc(db, 'users', recipientId);
    const recipientDoc = await getDoc(recipientRef);
    const recipientData = recipientDoc.exists() ? recipientDoc.data() : null;

    if (!recipientDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Recipient user not found' },
        { status: 404 }
      );
    }

    // Create connection request
    const docRef = await addDoc(connectionsRef, {
      senderId: auth.uid,
      senderName: senderData?.displayName || 'Anonymous',
      senderEmail: senderData?.email || null,
      senderPhotoURL: senderData?.photoURL || null,
      recipientId,
      recipientName: recipientData?.displayName || 'Anonymous',
      recipientEmail: recipientData?.email || null,
      recipientPhotoURL: recipientData?.photoURL || null,
      message: message || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        senderId: auth.uid,
        recipientId,
        message: message || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      message: 'Connection request sent successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Send connection request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
});

// GET - Get my connection requests (incoming and outgoing)
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'incoming', 'outgoing', 'all'
    const status = searchParams.get('status') || 'all'; // 'pending', 'accepted', 'rejected', 'all'

    const connectionsRef = collection(db, 'studyBuddyConnections');
    
    let incomingConnections: Array<Record<string, unknown>> = [];
    let outgoingConnections: Array<Record<string, unknown>> = [];

    // Fetch incoming requests
    if (type === 'incoming' || type === 'all') {
      const incomingQuery = query(
        connectionsRef,
        where('recipientId', '==', auth.uid),
        orderBy('createdAt', 'desc')
      );
      const incomingSnapshot = await getDocs(incomingQuery);
      incomingConnections = incomingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'incoming',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      }));
    }

    // Fetch outgoing requests
    if (type === 'outgoing' || type === 'all') {
      const outgoingQuery = query(
        connectionsRef,
        where('senderId', '==', auth.uid),
        orderBy('createdAt', 'desc')
      );
      const outgoingSnapshot = await getDocs(outgoingQuery);
      outgoingConnections = outgoingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'outgoing',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      }));
    }

    // Combine and filter by status
    let allConnections = [...incomingConnections, ...outgoingConnections];
    if (status !== 'all') {
      allConnections = allConnections.filter(conn => conn.status === status);
    }

    // Sort by createdAt descending
    allConnections.sort((a, b) => {
      const dateA = new Date(a.createdAt as string | number | Date).getTime();
      const dateB = new Date(b.createdAt as string | number | Date).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: allConnections,
      meta: {
        total: allConnections.length,
        incoming: incomingConnections.length,
        outgoing: outgoingConnections.length,
        filters: { type, status },
      },
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
});

// PATCH - Accept or reject a connection request
export const PATCH = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { connectionId, action } = body; // action: 'accept' or 'reject'

    if (!connectionId || !action) {
      return NextResponse.json(
        { success: false, error: 'Connection ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get connection and verify recipient
    const connectionRef = doc(db, 'studyBuddyConnections', connectionId);
    const connectionDoc = await getDoc(connectionRef);

    if (!connectionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Connection request not found' },
        { status: 404 }
      );
    }

    const connectionData = connectionDoc.data();

    if (connectionData.recipientId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: 'You can only accept/reject requests sent to you' },
        { status: 403 }
      );
    }

    if (connectionData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This connection request has already been processed' },
        { status: 409 }
      );
    }

    // Update connection status
    await updateDoc(connectionRef, {
      status: action === 'accept' ? 'accepted' : 'rejected',
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: connectionId,
        status: action === 'accept' ? 'accepted' : 'rejected',
      },
      message: action === 'accept' ? 'Connection request accepted' : 'Connection request rejected',
    });
  } catch (error) {
    console.error('Update connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update connection request' },
      { status: 500 }
    );
  }
});
