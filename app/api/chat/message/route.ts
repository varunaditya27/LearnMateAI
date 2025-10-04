/**
 * Chat API - Messages Route
 * POST /api/chat/message
 * 
 * Send a message to the AI chatbot and get a response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { sendChatMessage } from '@/services/chatbot';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory, learningContext } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert history to proper format if needed
    const history: ChatMessage[] = Array.isArray(conversationHistory) ? conversationHistory : [];

    // Get AI response
    const response = await sendChatMessage(message, history, learningContext);

    // Store the conversation in Firestore for history
    const conversationsRef = collection(db, 'chatConversations');
    await addDoc(conversationsRef, {
      userId: user.uid,
      userMessage: message,
      aiResponse: response,
      learningContext: learningContext || null,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Chat message error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process message';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
