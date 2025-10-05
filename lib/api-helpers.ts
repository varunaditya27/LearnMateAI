/**
 * API Route Helper Utilities
 * Provides consistent patterns for auth, error handling, and responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth-middleware';

export interface AuthenticatedRequest {
  uid: string;
}

/**
 * Wrap an API route handler with authentication
 * Returns 401 if auth fails, otherwise calls handler with uid
 */
export function withAuth(
  handler: (request: NextRequest, auth: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAuth(request);
    
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      return await handler(request, { uid: authResult.uid });
    } catch (error) {
      console.error('[API Error]', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap an API route handler with optional authentication
 * Calls handler with uid if authenticated, otherwise null
 */
export function withOptionalAuth(
  handler: (request: NextRequest, auth: AuthenticatedRequest | null) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAuth(request);
    
    try {
      return await handler(request, authResult);
    } catch (error) {
      console.error('[API Error]', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta })
  });
}

/**
 * Standard error response
 */
export function errorResponse(error: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}
