import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth-tokens';
import { createSuccessResponse } from '@/lib/api-helpers';

export async function POST() {
  const response = createSuccessResponse({ message: 'Logout successful' });
  clearAuthCookie(response);
  return response;
}

