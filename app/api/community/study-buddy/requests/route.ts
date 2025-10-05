/**
 * Study Buddy Requests API
 * 
 * Create and manage study buddy search profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// POST - Create a study buddy request (user is looking for a buddy)
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { topic, timezone, pace, skillLevel, description, availability } = body;

    if (!topic || !timezone || !pace || !skillLevel) {
      return NextResponse.json(
        { success: false, error: 'Topic, timezone, pace, and skill level are required' },
        { status: 400 }
      );
    }

    // Get user info
    const userRef = doc(db, 'users', auth.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Check if user already has an active request
    const requestsRef = collection(db, 'studyBuddyRequests');
    const existingQuery = query(
      requestsRef,
      where('userId', '==', auth.uid),
      where('status', '==', 'active')
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'You already have an active study buddy request. Please cancel it first.' },
        { status: 409 }
      );
    }

    // Create study buddy request
    const docRef = await addDoc(requestsRef, {
      userId: auth.uid,
      userName: userData?.displayName || 'Anonymous',
      userEmail: userData?.email || null,
      userPhotoURL: userData?.photoURL || null,
      topic,
      timezone,
      pace,
      skillLevel,
      description: description || '',
      availability: availability || [],
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        userId: auth.uid,
        userName: userData?.displayName || 'Anonymous',
        userEmail: userData?.email || null,
        userPhotoURL: userData?.photoURL || null,
        topic,
        timezone,
        pace,
        skillLevel,
        description: description || '',
        availability: availability || [],
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      message: 'Study buddy request created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create study buddy request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create study buddy request' },
      { status: 500 }
    );
  }
});

// GET - Get all active study buddy requests (browse available buddies)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const pace = searchParams.get('pace');
    const skillLevel = searchParams.get('skillLevel');
    const maxResults = parseInt(searchParams.get('limit') || '20');

    const requestsRef = collection(db, 'studyBuddyRequests');
    const q = query(
      requestsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    // Note: Additional filtering by topic, pace, skillLevel would require composite indexes
    // For now, we'll fetch all and filter client-side or add indexes later

    const querySnapshot = await getDocs(q);

    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhotoURL: data.userPhotoURL,
        topic: data.topic,
        timezone: data.timezone,
        pace: data.pace,
        skillLevel: data.skillLevel,
        description: data.description,
        availability: data.availability || [],
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    // Client-side filtering
    let filteredRequests = requests;
    if (topic) {
      filteredRequests = filteredRequests.filter(r => r.topic.toLowerCase() === topic.toLowerCase());
    }
    if (pace) {
      filteredRequests = filteredRequests.filter(r => r.pace.toLowerCase() === pace.toLowerCase());
    }
    if (skillLevel) {
      filteredRequests = filteredRequests.filter(r => r.skillLevel.toLowerCase() === skillLevel.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: filteredRequests,
      meta: {
        total: filteredRequests.length,
        filters: { topic, pace, skillLevel },
      },
    });
  } catch (error) {
    console.error('Get study buddy requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study buddy requests' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel my study buddy request
export const DELETE = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get request and verify ownership
    const requestRef = doc(db, 'studyBuddyRequests', requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    if (requestData.userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the request
    await deleteDoc(requestRef);

    return NextResponse.json({
      success: true,
      message: 'Study buddy request cancelled successfully',
    });
  } catch (error) {
    console.error('Delete study buddy request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel study buddy request' },
      { status: 500 }
    );
  }
});
