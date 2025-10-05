/**
 * My Study Buddies API
 * 
 * Get all accepted study buddy connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const connectionsRef = collection(db, 'studyBuddyConnections');
    
    // Get connections where user is sender AND status is accepted
    const senderQuery = query(
      connectionsRef,
      where('senderId', '==', auth.uid),
      where('status', '==', 'accepted')
    );

    // Get connections where user is recipient AND status is accepted
    const recipientQuery = query(
      connectionsRef,
      where('recipientId', '==', auth.uid),
      where('status', '==', 'accepted')
    );

    const [senderSnapshot, recipientSnapshot] = await Promise.all([
      getDocs(senderQuery),
      getDocs(recipientQuery)
    ]);

    const buddies: Array<{
      connectionId: string;
      buddyId: string;
      buddyName: string;
      buddyEmail: string | null;
      buddyPhotoURL: string | null;
      connectedAt: string;
      message: string;
    }> = [];

    // Process sender connections
    senderSnapshot.docs.forEach(doc => {
      const data = doc.data();
      buddies.push({
        connectionId: doc.id,
        buddyId: data.recipientId,
        buddyName: data.recipientName,
        buddyEmail: data.recipientEmail,
        buddyPhotoURL: data.recipientPhotoURL,
        connectedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        message: data.message || '',
      });
    });

    // Process recipient connections
    recipientSnapshot.docs.forEach(doc => {
      const data = doc.data();
      buddies.push({
        connectionId: doc.id,
        buddyId: data.senderId,
        buddyName: data.senderName,
        buddyEmail: data.senderEmail,
        buddyPhotoURL: data.senderPhotoURL,
        connectedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        message: data.message || '',
      });
    });

    return NextResponse.json({
      success: true,
      data: buddies,
      meta: {
        total: buddies.length,
        userId: auth.uid,
      },
    });
  } catch (error) {
    console.error('Get my study buddies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study buddies' },
      { status: 500 }
    );
  }
});
