"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Eye, EyeOff, Check, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { validateOptionalKenyanPhone } from '@/lib/phone-validation';
import { extractError } from '@/lib/client-api-helpers';

export default function FreelancerRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('You must agree to the Terms and Conditions to continue');
      return;
    }

    // Basic validation
    if (!name || name.trim() === '') {
      toast.error('Please enter your full name');
      return;
    }

    if (!email || email.trim() === '') {
      toast.error('Please enter your email address');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const phoneValidation = validateOptionalKenyanPhone(phone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error || 'Invalid phone number');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await safeApiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: name.trim(),
          role: 'freelancer',
          phone: phoneValidation.normalized,
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('[Freelancer Register] Failed to parse response JSON:', jsonError);
        toast.error('Invalid response from server. Please try again.');
        return;
      }

      if (!res.ok) {
        // Use extractError helper to safely get error message and code
        const { message: errorMessage, code: errorCode } = extractError(data, `Registration failed (${res.status}). Please try again.`);

        console.error('[Freelancer Register] Registration failed:', {
          status: res.status,
          statusText: res.statusText,
          error: data?.error,
          code: errorCode,
          debug: data?.debug,
        });

        // Provide helpful error messages based on error code
        let userFriendlyError = errorMessage;
        if (errorCode === 'EMAIL_ALREADY_REGISTERED' || errorCode === 'EMAIL_EXISTS') {
          userFriendlyError = 'This email is already registered. Please log in instead.';
        } else if (errorCode === 'INVALID_EMAIL') {
          userFriendlyError = 'Please enter a valid email address.';
        } else if (errorCode === 'PASSWORD_TOO_SHORT') {
          userFriendlyError = 'Password must be at least 6 characters long.';
        }

        toast.error(userFriendlyError);
        return;
      }

      // Success - show message and redirect to availability selection (Step 1)
      if (data?.success) {
        toast.success(data.message || 'Registration successful! Next, select your availability.');
      } else {
        toast.success('Registration successful! Next, select your availability.');
      }

      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push(`/register/freelancer/availability?email=${encodeURIComponent(normalizedEmail)}`);
      }, 500);
    } catch (err: any) {
      console.error('[Freelancer Register] Registration exception:', err);
      const errorMessage = err?.message || err?.error || 'Registration failed. Please check your connection and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Join as a Specialist"
      subtitle="Deliver managed professional, technical, creative, data &amp; academic projects"
      backHref="/"
      backLabel="Back to Home"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g. Sarah Ochieng"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
          {name && name.trim().length < 2 && (
            <p className="text-xs text-amber-500 font-medium">Name should be at least 2 characters</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
          {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
            <p className="text-xs text-amber-500 font-medium">Please enter a valid email address</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Phone Number <span className="text-[#6B627A] dark:text-[#DDD3E9]/60 font-normal lowercase">(for M-Pesa payouts)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 0712345678 or +254712345678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              const validation = validateOptionalKenyanPhone(e.target.value);
              setPhoneError(validation.valid ? '' : validation.error || 'Invalid phone number');
            }}
            disabled={loading}
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
          {phoneError && (
            <p className="text-xs text-rose-500 font-medium">{phoneError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="off"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="off"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-rose-500 font-medium">Passwords do not match</p>
          )}
        </div>

        <div className="flex gap-2.5 rounded-2xl border border-[#5B3594]/25 bg-[#EFE8F8] dark:bg-[#271E42] p-4 text-xs text-[#22183D] dark:text-[#DDD3E9]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#5B3594] dark:text-[#FF7A3D]" />
          <p>
            <span className="font-bold text-[#22183D] dark:text-white">Next Step:</span> Select your availability &amp; 7–15 subject specialties.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] p-4">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={loading}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-xs leading-relaxed text-[#6B627A] dark:text-[#DDD3E9]/90 cursor-pointer select-none">
            I agree to TaskLynk&apos;s{' '}
            <Link href="/terms" target="_blank" className="font-bold text-[#5B3594] dark:text-[#FF7A3D] underline underline-offset-2">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="font-bold text-[#5B3594] dark:text-[#FF7A3D] underline underline-offset-2">
              Company Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
          size="lg"
          disabled={loading || !agreedToTerms || !!phoneError}
        >
          {loading ? 'Creating account...' : 'Continue Registration'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
        Already have an account?{' '}
        <Link href="/login" className="font-black text-[#5B3594] dark:text-[#FF7A3D] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
