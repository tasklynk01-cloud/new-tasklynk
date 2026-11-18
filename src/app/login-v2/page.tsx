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

"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context-v2';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
      
      const targetPath = redirect || dashboards[user.role] || '/client/dashboard';
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

      setTimeout(() => {
        const dashboards: Record<string, string> = {
          admin: '/admin/dashboard',
          manager: '/manager/dashboard',
          client: '/client/dashboard',
          account_owner: '/client/dashboard',
          freelancer: '/freelancer/dashboard',
          writer: '/freelancer/dashboard',
          editor: '/editor/dashboard',
        };
        
        const targetPath = redirect || dashboards[user?.role || 'client'] || '/client/dashboard';
        router.replace(targetPath);
      }, 500);

    } catch (err: any) {
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
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline"
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
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={loading}
          />
          <Label
            htmlFor="remember"
            className="text-sm font-normal cursor-pointer"
          >
            Remember me for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
    </div>
  );
}

export default function SecureLoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your TaskLynk account
            </p>
          </div>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Secure login with encrypted connection
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
