import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase Auth] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get the Google OAuth sign-in URL
 * Call this from the client to redirect to Google
 */
export function getGoogleAuthUrl(redirectTo: string = '/api/auth/callback') {
  return supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectTo}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

/**
 * Exchange authorization code for session (server-side)
 */
export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return session;
}
