/**
 * Discussion Like API
 * 
 * Like/unlike discussions with Firestore integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, increment, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// POST - Like/unlike a discussion
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { discussionId } = body;

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    // Check if discussion exists
    const discussionRef = doc(db, 'discussions', discussionId);
    const discussionDoc = await getDoc(discussionRef);

    if (!discussionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // Check if user already liked
    const likesRef = collection(db, 'discussionLikes');
    const existingLikeQuery = query(
      likesRef,
      where('discussionId', '==', discussionId),
      where('userId', '==', auth.uid)
    );
    const existingLikeSnapshot = await getDocs(existingLikeQuery);

    if (!existingLikeSnapshot.empty) {
      // Unlike - remove the like
      const likeDoc = existingLikeSnapshot.docs[0];
      await deleteDoc(doc(db, 'discussionLikes', likeDoc.id));
      
      // Decrement like count
      await updateDoc(discussionRef, {
        likes: increment(-1),
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          discussionId,
          userId: auth.uid,
        },
        message: 'Discussion unliked',
      });
    } else {
      // Like - add the like
      await addDoc(likesRef, {
        discussionId,
        userId: auth.uid,
        createdAt: serverTimestamp(),
      });

      // Increment like count
      await updateDoc(discussionRef, {
        likes: increment(1),
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          discussionId,
          userId: auth.uid,
        },
        message: 'Discussion liked',
      });
    }
  } catch (error) {
    console.error('Like discussion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like/unlike discussion' },
      { status: 500 }
    );
  }
});
