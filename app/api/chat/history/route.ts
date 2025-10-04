/**
 * Chat API - History Route
 * GET /api/chat/history
 * 
 * Get user's chat conversation history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '50');

    const conversationsRef = collection(db, 'chatConversations');
    const q = query(
      conversationsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}
