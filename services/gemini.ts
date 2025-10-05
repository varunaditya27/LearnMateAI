/**
 * Gemini AI Service
 * 
 * Centralized service for all Gemini AI interactions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LearningPath, LearningStep } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Generate a comprehensive personalized learning path
 */
export async function generateLearningPath(params: {
  userId: string;
  domain: string;
  subdomain: string;
  topic: string;
  userLevel?: string;
  learningStyle?: string;
  timeCommitment?: number;
}): Promise<LearningPath> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
  const systemPrompt = `You are an expert learning path architect specializing in creating personalized, structured learning journeys.

TASK: Create a comprehensive, step-by-step learning path for the topic: "${params.topic}" in the domain: "${params.domain} - ${params.subdomain}"

USER CONTEXT:
- Experience Level: ${params.userLevel || 'beginner'}
- Learning Style: ${params.learningStyle || 'balanced'}
- Time Commitment: ${params.timeCommitment || 30} minutes/day

REQUIREMENTS:
1. Generate 5-8 progressive learning steps that build on each other
2. Each step should have 2-4 high-quality, real resources (videos, articles, interactive tutorials)
3. Include accurate YouTube video IDs or article URLs where possible
4. Estimate realistic time commitments for each resource
5. Provide clear learning objectives for each step
6. Include tags for better resource categorization

IMPORTANT GUIDELINES:
- Focus on FREE, accessible content from reputable sources (YouTube, freeCodeCamp, MDN, official docs, etc.)
- For YouTube videos: Use real, popular educational channels when possible
- Progress from fundamentals to advanced concepts logically
- Include a mix of video tutorials, written documentation, and practical exercises
- Each step should be completable within 1-3 hours
- Total path should be achievable in 2-4 weeks with consistent effort

RESPOND WITH VALID JSON ONLY (no markdown, no explanations):
{
  "pathName": "Complete ${params.topic} Learning Path",
  "description": "A comprehensive journey from basics to proficiency in ${params.topic}",
  "estimatedTotalHours": 25,
  "difficulty": "beginner|intermediate|advanced",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "outcomes": ["outcome1", "outcome2", "outcome3"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title (Clear and Actionable)",
      "description": "What you'll learn and why it matters",
      "objectives": ["Learn X", "Understand Y", "Build Z"],
      "estimatedMinutes": 90,
      "resources": [
        {
          "title": "Resource Title",
          "description": "Brief description of what this resource covers",
          "type": "video|article|interactive|documentation",
          "url": "https://actual-url-here.com",
          "provider": "YouTube|freeCodeCamp|MDN|etc",
          "duration": 25,
          "difficulty": "beginner",
          "thumbnailUrl": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
          "tags": ["tag1", "tag2", "tag3"],
          "estimatedTime": 25
        }
      ]
    }
  ]
}`;

  try {
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Transform the AI response into our LearningPath type
    const steps: LearningStep[] = parsedData.steps.map((step: { 
      stepNumber: number;
      title: string;
      description: string;
      objectives?: string[];
      estimatedMinutes: number;
      resources: Array<{
        title: string;
        description: string;
        type: string;
        url: string;
        thumbnailUrl?: string;
        duration: number;
        provider: string;
        tags?: string[];
        difficulty: string;
        estimatedTime: number;
      }>;
    }, index: number) => ({
      id: `step-${index + 1}`,
      conceptId: `${params.topic}-concept-${index + 1}`,
      order: step.stepNumber,
      title: step.title,
      description: step.description,
      objectives: step.objectives || [],
      status: index === 0 ? 'available' : 'locked',
      resources: step.resources.map((res: {
        title: string;
        description: string;
        type: string;
        url: string;
        thumbnailUrl?: string;
        duration: number;
        provider: string;
        tags?: string[];
        difficulty: string;
        estimatedTime: number;
      }, resIndex: number) => ({
        id: `res-${index + 1}-${resIndex + 1}`,
        title: res.title,
        description: res.description,
        type: res.type,
        url: res.url,
        thumbnailUrl: res.thumbnailUrl,
        duration: res.duration,
        provider: res.provider,
        tags: res.tags || [],
        difficulty: res.difficulty,
        estimatedTime: res.estimatedTime,
      })),
    }));

    const learningPath: LearningPath = {
      id: '', // Will be set by Firestore
      userId: params.userId,
      name: parsedData.pathName || `${params.topic} Learning Path`,
      description: parsedData.description || `Master ${params.topic} with this personalized path`,
      domainId: params.domain,
      subdomainId: params.subdomain,
      topicId: params.topic,
      steps,
      status: 'active',
      progress: 0,
      estimatedTotalHours: parsedData.estimatedTotalHours || 20,
      difficulty: parsedData.difficulty || 'beginner',
      prerequisites: parsedData.prerequisites || [],
      outcomes: parsedData.outcomes || [],
      startedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    return learningPath;
  } catch (error) {
    console.error('[Gemini] Error generating learning path:', error);
    throw new Error('Failed to generate learning path with AI');
  }
}

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
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
  generateLearningPath,
  generateMotivationBoost,
  generateCareerRoadmap,
  generateQuiz,
  generateResourceRecommendations,
  generateLearningBranches,
  generateMatchReasons,
};

export default geminiService;
