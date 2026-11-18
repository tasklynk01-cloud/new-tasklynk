"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AuthShell, AuthLegalNote } from '@/components/auth/auth-shell';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context-v2';
import { safeApiFetch } from '@/lib/client-api-helpers';

/**
 * Secure Login Page
 * 
 * Features:
 * - Clean, professional UI
 * - Comprehensive error handling
 * - Remember me functionality
 * - Automatic redirect after login
 * - Loading states
 * - Secure password visibility toggle
 */

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Track whether hash-fragment tokens were present at mount time.
  // This survives the async hash-session fetch that may clear the URL hash
  // via replaceState before the error useEffect reads window.location.hash.
  const hasHashTokens = useRef(false);
  
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [reason]);

  // ── Handle implicit-flow tokens from Google OAuth hash fragment ────────
  // When Supabase returns tokens via the URL hash (#access_token=…&refresh_token=…)
  // instead of a ?code= query parameter, the server-side /api/auth/callback cannot
  // see them. This useEffect detects those tokens and exchanges them for an app
  // session via the /api/auth/hash-session endpoint.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    hasHashTokens.current = true;

    const params = new URLSearchParams(hash.substring(1)); // strip leading '#'
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return;

    // Prevent infinite loops – only process once
    if (sessionStorage.getItem('hash_session_processing')) return;
    sessionStorage.setItem('hash_session_processing', 'true');

    // Clear the error that the auth_no_code redirect may have set
    setError('');
    setLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/auth/hash-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        });

        const data = await res.json();

        // Clean up the hash so a page refresh won't re-trigger
        window.history.replaceState({}, '', window.location.pathname + window.location.search);

        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else if (data.redirectUrl) {
          // New user – redirect to registration
          window.location.href = data.redirectUrl;
        } else {
          setError('Google sign-in could not be completed. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('[Login] Hash session error:', err);
        // Clean up hash even on failure
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        setError('Google sign-in could not be completed. Please try again.');
        setLoading(false);
      } finally {
        sessionStorage.removeItem('hash_session_processing');
      }
    })();
  }, []); // intentionally runs once on mount

  useEffect(() => {
    const authError = searchParams.get('error');
    if (!authError) return;
    // Skip the "auth_no_code" error display if hash tokens were present at
    // mount time – the useEffect above will handle them. We use a ref instead
    // of re-reading window.location.hash because the hash-processing useEffect
    // may have already cleaned it up via replaceState.
    if (authError === 'auth_no_code' && hasHashTokens.current) return;
    const messages: Record<string, string> = {
      auth_no_code: 'Google sign-in did not complete. Please try again.',
      auth_exchange_failed: 'Google sign-in failed to verify. Please try again.',
      no_user_data: 'Google did not return account details. Please try again.',
      callback_failed: 'Something went wrong during Google sign-in. Please try again.',
    };
    setError(messages[authError] || 'Google sign-in failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading) {
      const dashboards: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        client: '/client/dashboard',
        account_owner: '/client/dashboard',
        freelancer: '/freelancer/dashboard',
        writer: '/freelancer/dashboard',
        editor: '/editor/dashboard',
      };
      
      const userRole = user.role;
      const targetPath = redirect || dashboards[userRole] || '/client/dashboard';
      
      router.replace(targetPath);
    }
  }, [user, loading, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }


      await login(email, password, rememberMe);
      
      setSuccess('Login successful! Redirecting...');

      setTimeout(async () => {
        try {
          const sessionResponse = await safeApiFetch('/api/v2/auth/session', {
            credentials: 'include',
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            
            if (sessionData.success && sessionData.user) {
              const dashboards: Record<string, string> = {
                admin: '/admin/dashboard',
                manager: '/manager/dashboard',
                client: '/client/dashboard',
                account_owner: '/client/dashboard',
                freelancer: '/freelancer/dashboard',
                writer: '/freelancer/dashboard',
                editor: '/editor/dashboard',
              };
              
              const userRole = sessionData.user.role;
              const targetPath = redirect || dashboards[userRole] || '/client/dashboard';
              
              
              window.location.href = targetPath;
            } else {
              console.error('[Login Page] Session data invalid:', sessionData);
              window.location.href = redirect || '/client/dashboard';
            }
          } else {
            console.error('[Login Page] Session fetch failed with status:', sessionResponse.status);
            window.location.href = redirect || '/client/dashboard';
          }
        } catch (err) {
          console.error('[Login Page] Session check error:', err);
          window.location.href = redirect || '/client/dashboard';
        }
      }, 300);

    } catch (err: any) {
      console.error('[Login Page] Login error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      
      if (errorMessage.toLowerCase().includes('rejected')) {
        setError('Your account has been rejected. Please contact support.');
      } else if (errorMessage.toLowerCase().includes('blacklisted')) {
        setError('Your account has been blacklisted. Please contact support.');
      } else if (errorMessage.toLowerCase().includes('suspended')) {
        setError('Your account is suspended. Please contact support.');
      } else if (errorMessage.toLowerCase().includes('rate limit')) {
        setError('Too many login attempts. Please try again in a few minutes.');
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(errorMessage);
      }
      
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#5B3594] dark:text-[#FF7A3D] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={loading}
          />
          <label
            htmlFor="rememberMe"
            className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 cursor-pointer select-none font-medium"
          >
            Remember me for 30 days
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#DDD3E9] dark:border-[#3A2F5B]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-black">
          <span className="bg-white dark:bg-[#1D1533] px-3.5 text-[#6B627A] dark:text-[#DDD3E9]/70">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ewdbrfwqtlijyyaftlcp.supabase.co';
          window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&response_type=code&redirect_to=${encodeURIComponent(window.location.origin + '/api/auth/callback')}`;
        }}
        className="w-full flex items-center justify-center gap-3 h-12 border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42] rounded-xl transition-all text-[#22183D] dark:text-white text-sm font-bold shadow-sm"
        disabled={loading}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
    </>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="h-3 w-20 bg-[#DDD3E9] dark:bg-[#271E42] animate-pulse rounded" />
        <div className="h-10 w-full bg-[#DDD3E9] dark:bg-[#271E42] animate-pulse rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-16 bg-[#DDD3E9] dark:bg-[#271E42] animate-pulse rounded" />
        <div className="h-10 w-full bg-[#DDD3E9] dark:bg-[#271E42] animate-pulse rounded-xl" />
      </div>
      <div className="h-11 w-full bg-[#DDD3E9] dark:bg-[#271E42] animate-pulse rounded-xl" />
    </div>
  );
}

export default function SecureLoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account to continue">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-black text-[#5B3594] dark:text-[#FF7A3D] hover:underline">
          Create account
        </Link>
      </p>

      <AuthLegalNote />
    </AuthShell>
  );
}
