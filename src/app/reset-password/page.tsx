"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell, AuthLegalNote } from '@/components/auth/auth-shell';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      router.push('/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await safeApiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
      } else {
        toast.error(extractErrorMessage(data, 'Failed to reset password'));
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <AuthShell title="Password reset complete" subtitle="Your password has been successfully updated">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 font-bold">
            <CheckCircle2 className="size-7" />
          </div>

          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
            You can now sign in with your new password.
          </p>

          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 text-sm"
            size="lg"
          >
            Continue to sign in
          </Button>
        </div>
        <AuthLegalNote />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Enter a strong password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            New password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="off"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="off"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-rose-500 font-medium">Passwords do not match</p>
        )}

        <Button
          type="submit"
          className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
          size="lg"
          disabled={isLoading || newPassword !== confirmPassword}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock className="size-4" />
              <span>Reset password</span>
            </span>
          )}
        </Button>

        <p className="text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium pt-2">
          Remember your password?{' '}
          <Link href="/login" className="font-black text-[#5B3594] dark:text-[#FF7A3D] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
      <AuthLegalNote />
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8FD] dark:bg-[#140E24]">
          <Loader2 className="size-8 animate-spin text-[#5B3594]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
