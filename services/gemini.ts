/**
 * Gemini AI Service
 * 
 * Centralized service for all Gemini AI interactions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate personalized motivation message
 */
export async function generateMotivationBoost(userContext: {
  currentStreak: number;
  totalPoints: number;
  level: number;
  recentActivity: string;
  strugglingWith?: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an enthusiastic and supportive learning coach. Generate a short, motivating message (2-3 sentences).

User Context:
- Current streak: ${userContext.currentStreak} days
- Total points: ${userContext.totalPoints}
- Level: ${userContext.level}
- Recent activity: ${userContext.recentActivity}
${userContext.strugglingWith ? `- Currently struggling with: ${userContext.strugglingWith}` : ''}

Create a genuine, uplifting message that:
1. Acknowledges their progress
2. Encourages them to keep going
3. Is specific to their situation
4. Uses emojis appropriately

Keep it genuine and actionable.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate career roadmap
 */
export async function generateCareerRoadmap(params: {
  careerGoal: string;
  currentSkills?: string[];
  experienceLevel?: string;
  timeframe?: string;
}): Promise<unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an expert career counselor. Generate a comprehensive career roadmap in JSON format.

Career Goal: ${params.careerGoal}
Current Skills: ${params.currentSkills?.join(', ') || 'None'}
Experience Level: ${params.experienceLevel || 'beginner'}
Timeframe: ${params.timeframe || '6 months'}

Create a roadmap with phases, skills, milestones, and actionable steps. Respond ONLY with valid JSON.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
  return JSON.parse(jsonMatch[0]) as unknown;
  }
  throw new Error('Failed to parse roadmap response');
}

/**
 * Generate quiz questions
 */
export async function generateQuiz(params: {
  topic: string;
  difficulty: string;
  questionCount: number;
  questionTypes: string[];
}): Promise<unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an expert educator. Generate a quiz to test understanding of: ${params.topic}

Requirements:
- Difficulty: ${params.difficulty}
- Questions: ${params.questionCount}
- Types: ${params.questionTypes.join(', ')}

Create practical questions with clear explanations. Respond ONLY with valid JSON matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B",
      "explanation": "Why this is correct",
      "points": 10
    }
  ],
  "totalPoints": 50,
  "passingScore": 70
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
  return JSON.parse(jsonMatch[0]) as unknown;
  }
  throw new Error('Failed to parse quiz response');
}

/**
 * Generate resource recommendations
 */
export async function generateResourceRecommendations(params: {
  topic: string;
  difficulty: string;
  learningStyle: string;
  preferredFormats: string[];
}): Promise<unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are a learning resource curator. Recommend 5-7 high-quality resources for learning: ${params.topic}

Context:
- Difficulty: ${params.difficulty}
- Learning style: ${params.learningStyle}
- Preferred formats: ${params.preferredFormats.join(', ')}

Focus on free, accessible content. Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "title": "Resource name",
      "type": "video|article|interactive|course",
      "description": "Why valuable",
      "difficulty": "beginner",
      "estimatedMinutes": 30,
      "platform": "Platform name",
      "tags": ["tag1", "tag2"],
      "matchScore": 95,
      "matchReason": "Perfect for X learners"
    }
  ],
  "learningPath": ["Step 1", "Step 2"],
  "additionalTips": ["Tip 1", "Tip 2"]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
  return JSON.parse(jsonMatch[0]) as unknown;
  }
  throw new Error('Failed to parse recommendations response');
}

/**
 * Generate learning branches
 */
export async function generateLearningBranches(params: {
  pathName: string;
  topic: string;
  currentStep: number;
  branchOption?: string;
  userPreference?: string;
}): Promise<unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an adaptive learning path designer. Create alternate learning branches.

Path: ${params.pathName}
Topic: ${params.topic}
Current Step: ${params.currentStep}
Branch Option: ${params.branchOption || 'balanced'}
Preference: ${params.userPreference || 'balanced'}

Valid options: project-based, theory-heavy, fast-track, comprehensive

Generate 2-3 distinct branches with 3-5 steps each. Respond ONLY with valid JSON:
{
  "branches": [
    {
      "id": "branch_1",
      "name": "Branch Name",
      "type": "project-based",
      "description": "How this path differs",
      "difficulty": "intermediate",
      "estimatedHours": 20,
      "steps": [
        {
          "stepNumber": 1,
          "title": "Step title",
          "description": "What you'll learn",
          "type": "project|video|reading",
          "estimatedMinutes": 30
        }
      ],
      "outcomes": ["Outcome 1", "Outcome 2"]
    }
  ],
  "recommendation": "Which branch to choose"
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
  return JSON.parse(jsonMatch[0]) as unknown;
  }
  throw new Error('Failed to parse branches response');
}

/**
 * Generate study buddy match reasons
 */
export async function generateMatchReasons(
  topic: string,
  matches: Array<{ userId: string; displayName: string; pace: string; timezone: string; interests: string[] }>
): Promise<Array<{ userId: string; reason: string }>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are a study buddy matching assistant. For each potential match, provide a compelling one-sentence reason why they'd be a good study partner.

Topic: ${topic}
Matches:
${matches.map((m, i) => `${i + 1}. ${m.displayName} - ${m.pace} pace, ${m.timezone}, interests: ${m.interests.join(', ')}`).join('\n')}

Respond ONLY with valid JSON array:
[{"userId": "user_id", "reason": "..."}, ...]`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}

const geminiService = {
  generateMotivationBoost,
  generateCareerRoadmap,
  generateQuiz,
  generateResourceRecommendations,
  generateLearningBranches,
  generateMatchReasons,
};

export default geminiService;
