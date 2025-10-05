import { NextRequest } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getRequiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

// Only initialize once
if (getApps().length === 0) {
	try {
		const projectId = getRequiredEnv('FIREBASE_PROJECT_ID');
		const clientEmail = getRequiredEnv('FIREBASE_CLIENT_EMAIL');
		const rawKey = getRequiredEnv('FIREBASE_PRIVATE_KEY');
		const privateKey = rawKey.replace(/\\n/g, '\n');
		initializeApp({
			credential: cert({
				projectId,
				clientEmail,
				privateKey,
			}),
		});
	} catch (e) {
		console.error('[Auth Middleware] Firebase Admin init failed:', e);
	}
}

export async function verifyAuth(request: NextRequest): Promise<{ uid: string } | null> {
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	const idToken = authHeader.split('Bearer ')[1];
	try {
		const decodedToken = await getAuth().verifyIdToken(idToken);
		return { uid: decodedToken.uid };
	} catch (error) {
		console.error('Firebase token verification failed:', error);
		return null;
	}
}
