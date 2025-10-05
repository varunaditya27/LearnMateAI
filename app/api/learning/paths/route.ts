/**
 * Learning API - Paths Route
 * GET /api/learning/paths
 * POST /api/learning/paths
 * 
 * Get user's learning paths and create new ones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const pathsRef = collection(db, 'learningPaths');
    const q = query(pathsRef, where('userId', '==', auth.uid));
    const querySnapshot = await getDocs(q);

    const paths = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const pathId = doc.id;
      
      console.log('[API] Processing path with ID:', pathId); // Debug log
      
      // Convert Firestore Timestamps to serializable format
      const serializedPath = {
        id: pathId, // Explicitly assign the ID first
        userId: data.userId,
        name: data.name,
        description: data.description,
        domainId: data.domainId,
        subdomainId: data.subdomainId,
        topicId: data.topicId,
        status: data.status,
        progress: data.progress,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        steps: data.steps?.map((step: { completedAt?: { toDate?: () => Date } }) => ({
          ...step,
          completedAt: step.completedAt?.toDate?.()?.toISOString() || step.completedAt,
        })) || [],
      };
      
      console.log('[API] Serialized path:', { id: serializedPath.id, name: serializedPath.name }); // Debug log
      
      return serializedPath;
    });

    console.log('[API] Returning paths count:', paths.length); // Debug log
    console.log('[API] All path IDs:', paths.map(p => p.id)); // Debug log

    return NextResponse.json({
      success: true,
      data: paths,
    });
  } catch (error) {
    console.error('Get learning paths error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get learning paths' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { name, description, domainId, subdomainId, topicId, steps } = body;

    if (!name || !domainId || !subdomainId || !topicId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pathsRef = collection(db, 'learningPaths');
    const docRef = await addDoc(pathsRef, {
      userId: auth.uid,
      name,
      description: description || '',
      domainId,
      subdomainId,
      topicId,
      steps: steps || [],
      status: 'active',
      progress: 0,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        userId: auth.uid,
        name,
        description,
        domainId,
        subdomainId,
        topicId,
        steps,
        status: 'active',
        progress: 0,
      },
    });
  } catch (error) {
    console.error('Create learning path error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
});
