/**
 * Discussion Board API
 * 
 * Community knowledge sharing and discussions with full Firestore integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// GET - List discussions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const limitParam = parseInt(searchParams.get('limit') || '20');

    const discussionsRef = collection(db, 'discussions');
    let discussions: Array<{ id: string; [key: string]: unknown }> = [];

    try {
      let q;
      if (topic) {
        q = query(
          discussionsRef,
          where('topic', '==', topic),
          orderBy('createdAt', 'desc'),
          limit(limitParam)
        );
      } else {
        q = query(
          discussionsRef,
          orderBy('createdAt', 'desc'),
          limit(limitParam)
        );
      }

      const querySnapshot = await getDocs(q);

      discussions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          topic: data.topic,
          author: data.author,
          replies: data.replies || 0,
          likes: data.likes || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          tags: data.tags || [],
        };
      });
    } catch (err: unknown) {
      // Fallback if index is missing
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'failed-precondition') {
        console.warn('[discussions] Missing index, using fallback query');
        
        let fallbackQuery;
        if (topic) {
          fallbackQuery = query(discussionsRef, where('topic', '==', topic));
        } else {
          fallbackQuery = query(discussionsRef);
        }

        const querySnapshot = await getDocs(fallbackQuery);

        discussions = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              content: data.content,
              topic: data.topic,
              author: data.author,
              replies: data.replies || 0,
              likes: data.likes || 0,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              tags: data.tags || [],
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.createdAt as string).getTime();
            const dateB = new Date(b.createdAt as string).getTime();
            return dateB - dateA;
          })
          .slice(0, limitParam);
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      data: discussions,
      meta: {
        total: discussions.length,
        topic,
        limit: limitParam,
      },
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

// POST - Create new discussion
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { title, content, topic, tags } = body;

    if (!title || !content || !topic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, topic' },
        { status: 400 }
      );
    }

    // Get user info from users collection
    const userRef = doc(db, 'users', auth.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    const discussionsRef = collection(db, 'discussions');
    const docRef = await addDoc(discussionsRef, {
      title,
      content,
      topic,
      author: {
        userId: auth.uid,
        displayName: userData?.displayName || 'Anonymous',
        photoURL: userData?.photoURL || null,
      },
      replies: 0,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      tags: tags || [],
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        title,
        content,
        topic,
        author: {
          userId: auth.uid,
          displayName: userData?.displayName || 'Anonymous',
          photoURL: userData?.photoURL || null,
        },
        replies: 0,
        likes: 0,
        createdAt: new Date().toISOString(),
        tags: tags || [],
      },
      message: 'Discussion created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create discussion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
});
