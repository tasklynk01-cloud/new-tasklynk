/**
 * Secure Logout API Route
 * 
 * Clears session cookie and invalidates the session
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getRequestSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get current session (optional - just for logging)
    const session = getRequestSession(request);
    
    if (session) {
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear session cookie
    clearSessionCookie(response);

    return response;

  } catch (error) {
    console.error('[Logout] Error:', error);
    
    // Still clear cookie even on error
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    
    clearSessionCookie(response);
    
    return response;
  }
}

