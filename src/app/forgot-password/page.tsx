"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthShell, AuthLegalNote } from '@/components/auth/auth-shell';
import { Mail, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await safeApiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailSent(true);
        toast.success('Password reset instructions sent');
      } else {
        toast.error(extractErrorMessage(data, 'Failed to send password reset email'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthShell title="Check your email" subtitle="Password reset instructions have been sent">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 font-bold">
            <CheckCircle2 className="size-7" />
          </div>

          <div className="rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] p-4 text-xs text-[#6B627A] dark:text-[#DDD3E9]">
            If an account exists with <strong className="text-[#22183D] dark:text-white font-bold">{email}</strong>, you&apos;ll receive reset instructions within a few minutes.
          </div>

          <ol className="list-decimal space-y-2 rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#140E24] p-5 pl-9 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 text-left font-medium">
            <li>Check your inbox and spam folder</li>
            <li>Open the reset link in the email</li>
            <li>Choose a new password</li>
            <li>Sign in with your new password</li>
          </ol>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 text-sm"
              size="lg"
            >
              Return to sign in
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full bg-white dark:bg-[#1D1533] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42] border-[#DDD3E9] dark:border-[#3A2F5B] text-[#22183D] dark:text-[#DDD3E9] font-bold h-12 rounded-xl text-sm"
              size="lg"
            >
              Try a different email
            </Button>
          </div>
        </div>
        <AuthLegalNote />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you reset instructions"
    >
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
            disabled={isLoading}
            required
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Sending...
            </>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Mail className="size-4" />
              <span>Send reset instructions</span>
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
