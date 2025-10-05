/**
 * Study Buddy Matching API
 * 
 * AI-powered matching algorithm for finding study partners with real Firestore integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { topic, skillLevel, timezone, pace, studyPreferences } = body;

    if (!topic || !skillLevel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: topic, skillLevel' },
        { status: 400 }
      );
    }

    // Combine legacy fields (timezone, pace) with studyPreferences object
    const preferences = {
      ...studyPreferences,
      timezone: timezone || studyPreferences?.timezone,
      pace: pace || studyPreferences?.pace,
    };

    // Save user's study buddy preferences
    const preferencesRef = doc(db, 'studyBuddyPreferences', auth.uid);
    await setDoc(preferencesRef, {
      userId: auth.uid,
      topic,
      skillLevel,
      studyPreferences: preferences,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Get current user info
    const userRef = doc(db, 'users', auth.uid);
    const userDoc = await getDoc(userRef);
    const currentUserData = userDoc.exists() ? userDoc.data() : null;

    // Query for potential matches
    const preferencesCollection = collection(db, 'studyBuddyPreferences');
    let potentialMatches: Array<{ id: string; [key: string]: unknown }> = [];

    try {
      // Try to find users with same topic and skill level
      const q = query(
        preferencesCollection,
        where('topic', '==', topic),
        where('skillLevel', '==', skillLevel)
      );

      const querySnapshot = await getDocs(q);
      
      // Fetch user details for each match
      const matchPromises = querySnapshot.docs
        .filter(doc => doc.id !== auth.uid) // Exclude current user
        .slice(0, 10) // Limit to 10 potential matches
        .map(async (prefDoc) => {
          const prefData = prefDoc.data();
          const matchUserRef = doc(db, 'users', prefDoc.id);
          const matchUserDoc = await getDoc(matchUserRef);
          const matchUserData = matchUserDoc.exists() ? matchUserDoc.data() : null;

          return {
            id: prefDoc.id,
            displayName: matchUserData?.displayName || 'Anonymous User',
            email: matchUserData?.email || null,
            photoURL: matchUserData?.photoURL || null,
            topic: prefData.topic,
            skillLevel: prefData.skillLevel,
            studyPreferences: prefData.studyPreferences || {},
            updatedAt: prefData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });

      potentialMatches = await Promise.all(matchPromises);
    } catch (err: unknown) {
      console.warn('[study-buddy] Error finding matches:', err);
      
      // Fallback: Get all preferences and filter client-side
      const fallbackQuery = query(preferencesCollection);
      const querySnapshot = await getDocs(fallbackQuery);
      
      const matchPromises = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return doc.id !== auth.uid && data.topic === topic && data.skillLevel === skillLevel;
        })
        .slice(0, 10)
        .map(async (prefDoc) => {
          const prefData = prefDoc.data();
          const matchUserRef = doc(db, 'users', prefDoc.id);
          const matchUserDoc = await getDoc(matchUserRef);
          const matchUserData = matchUserDoc.exists() ? matchUserDoc.data() : null;

          return {
            id: prefDoc.id,
            displayName: matchUserData?.displayName || 'Anonymous User',
            email: matchUserData?.email || null,
            photoURL: matchUserData?.photoURL || null,
            topic: prefData.topic,
            skillLevel: prefData.skillLevel,
            studyPreferences: prefData.studyPreferences || {},
            updatedAt: prefData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });

      potentialMatches = await Promise.all(matchPromises);
    }

    if (potentialMatches.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          matches: [],
          totalMatches: 0
        },
        message: 'No matching study buddies found at this time. Try adjusting your preferences or checking back later.',
      });
    }

    // Generate AI-powered match reasons for top matches
    const topMatches = potentialMatches.slice(0, 5);
    
    let enhancedMatches;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a study buddy matching assistant. Generate brief, encouraging match reasons for these potential study partners.

Current User: ${currentUserData?.displayName || 'Student'}
- Topic: ${topic}
- Skill Level: ${skillLevel}
- Preferences: ${JSON.stringify(preferences)}

Potential Matches:
${topMatches.map((match, idx) => `${idx + 1}. ${match.displayName} (${match.skillLevel} level, ${match.topic})`).join('\n')}

For each match, provide:
1. A match score (0-100) based on compatibility
2. A brief, friendly reason why they'd be a good study partner (1 sentence, max 80 chars)

Respond in JSON format:
{
  "matches": [
    {"userId": "id", "matchScore": 85, "matchReason": "reason here"},
    ...
  ]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const aiResponse = JSON.parse(jsonMatch[0]);
        
        enhancedMatches = topMatches.map((match, idx) => {
          const aiMatch = aiResponse.matches?.find((m: { userId: string }) => m.userId === match.id) 
            || aiResponse.matches?.[idx];
          
          return {
            userId: match.id,
            displayName: match.displayName,
            photoURL: match.photoURL,
            topic: match.topic,
            skillLevel: match.skillLevel,
            studyPreferences: match.studyPreferences,
            matchScore: aiMatch?.matchScore || 75,
            matchReason: aiMatch?.matchReason || 'Similar learning interests and skill level',
          };
        });
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (aiError) {
      console.warn('[study-buddy] AI generation failed, using fallback:', aiError);
      
      // Fallback: Simple scoring based on preferences
      enhancedMatches = topMatches.map(match => {
        const baseScore = 70;
        const prefMatch = JSON.stringify(match.studyPreferences) === JSON.stringify(preferences) ? 20 : 10;
        
        return {
          userId: match.id,
          displayName: match.displayName,
          photoURL: match.photoURL,
          topic: match.topic,
          skillLevel: match.skillLevel,
          studyPreferences: match.studyPreferences,
          matchScore: baseScore + prefMatch,
          matchReason: `Shares interest in ${topic} at ${skillLevel} level`,
        };
      });
    }

    // Sort by match score
    enhancedMatches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      data: {
        matches: enhancedMatches,
        totalMatches: potentialMatches.length
      },
      message: `Found ${enhancedMatches.length} compatible study ${enhancedMatches.length === 1 ? 'buddy' : 'buddies'}!`,
    });
  } catch (error) {
    console.error('Study buddy matching error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find study buddy matches' },
      { status: 500 }
    );
  }
});
