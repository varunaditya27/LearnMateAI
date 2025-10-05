/**
 * Discussion Replies API
 * 
 * Post and retrieve replies to discussions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, increment, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// GET - Get replies for a discussion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    const repliesRef = collection(db, 'discussionReplies');
    const q = query(
      repliesRef,
      where('discussionId', '==', discussionId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);

    const replies = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        discussionId: data.discussionId,
        content: data.content,
        author: data.author,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: replies,
      meta: {
        total: replies.length,
        discussionId,
      },
    });
  } catch (error) {
    console.error('Get replies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}

// POST - Add a reply to a discussion
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { discussionId, content } = body;

    if (!discussionId || !content) {
      return NextResponse.json(
        { success: false, error: 'Discussion ID and content are required' },
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

    // Get user info
    const userRef = doc(db, 'users', auth.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Create reply
    const repliesRef = collection(db, 'discussionReplies');
    const docRef = await addDoc(repliesRef, {
      discussionId,
      content,
      author: {
        userId: auth.uid,
        displayName: userData?.displayName || 'Anonymous',
        photoURL: userData?.photoURL || null,
      },
      createdAt: serverTimestamp(),
    });

    // Increment reply count
    await updateDoc(discussionRef, {
      replies: increment(1),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        discussionId,
        content,
        author: {
          userId: auth.uid,
          displayName: userData?.displayName || 'Anonymous',
          photoURL: userData?.photoURL || null,
        },
        createdAt: new Date().toISOString(),
      },
      message: 'Reply posted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to post reply' },
      { status: 500 }
    );
  }
});
