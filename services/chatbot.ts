/**
 * Chatbot Service - Gemini API Integration
 * 
 * This service provides doubt clarification functionality using Google's Gemini API.
 * It handles conversation context, API calls, and response formatting.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '@/types';

// Initialize Gemini API
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not found. Chatbot functionality will be limited.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Send a message to the Gemini API and get a response
 * @param message - User's message
 * @param conversationHistory - Previous messages for context
 * @param learningContext - Optional context about what the user is learning
 * @returns Promise<string> - AI-generated response
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  learningContext?: string
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please check your API key.');
  }

  try {
    // Use Gemini-2.0-Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build the prompt with context and conversation history
    const prompt = buildPrompt(message, conversationHistory, learningContext);

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  }
}

/**
 * Build a comprehensive prompt with context and history
 */
function buildPrompt(
  message: string,
  conversationHistory: ChatMessage[],
  learningContext?: string
): string {
  let prompt = `You are LearnMate AI, an intelligent and friendly educational assistant designed to help students with doubt clarification and learning support. Your goal is to provide clear, accurate, and helpful explanations while encouraging active learning.

Guidelines:
- Be concise but thorough in your explanations
- Use examples and analogies when helpful
- Break down complex topics into simpler concepts
- Encourage critical thinking by asking follow-up questions
- Be supportive and motivating
- If you're unsure, admit it and suggest resources
- Format your responses with clear structure (use markdown when appropriate)

`;

  // Add learning context if provided
  if (learningContext) {
    prompt += `Current Learning Context: ${learningContext}\n\n`;
  }

  // Add conversation history for context
  if (conversationHistory.length > 0) {
    prompt += 'Conversation History:\n';
    // Include last 5 messages for context (to avoid token limits)
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach((msg) => {
      const role = msg.role === 'user' ? 'Student' : 'LearnMate AI';
      prompt += `${role}: ${msg.content}\n`;
    });
    prompt += '\n';
  }

  // Add current message
  prompt += `Student: ${message}\n\nLearnMate AI:`;

  return prompt;
}

/**
 * Get a quick suggestion/hint without full conversation context
 * Useful for inline help or quick tips
 */
export async function getQuickHelp(topic: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Provide a brief, helpful tip or suggestion about: ${topic}

Keep it concise (2-3 sentences) and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error getting quick help:', error);
    throw new Error('Failed to get help. Please try again.');
  }
}

/**
 * Generate a study plan based on user's goals
 */
export async function generateStudyPlan(
  topic: string,
  duration: string,
  currentLevel: string
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create a structured study plan for learning ${topic}.

Duration: ${duration}
Current Level: ${currentLevel}

Please provide:
1. Learning objectives
2. Week-by-week breakdown
3. Recommended resources and activities
4. Milestones to track progress

Format the response in a clear, organized manner.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw new Error('Failed to generate study plan. Please try again.');
  }
}

/**
 * Explain a concept in simple terms
 */
export async function explainConcept(
  concept: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const levelDescription = {
      beginner: 'Explain as if to someone with no prior knowledge',
      intermediate: 'Explain assuming basic understanding of the field',
      advanced: 'Provide a detailed technical explanation',
    };

    const prompt = `Explain the concept of "${concept}" for a ${difficulty} level student.

${levelDescription[difficulty]}

Include:
- A clear definition
- Why it matters
- A simple example or analogy
- Common misconceptions (if any)

Keep it engaging and easy to understand.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error explaining concept:', error);
    throw new Error('Failed to explain concept. Please try again.');
  }
}
