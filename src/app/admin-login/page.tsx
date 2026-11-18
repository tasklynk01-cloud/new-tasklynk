"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AuthShell } from '@/components/auth/auth-shell';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import Link from 'next/link';
import { Shield, Eye, EyeOff } from 'lucide-react';

// Authorized admin emails
const ADMIN_EMAILS = [
  'topwriteessays@gmail.com',
  'm.d.techpoint25@gmail.com',
  'maguna956@gmail.com',
  'tasklynk01@gmail.com',
  'maxwellotieno11@gmail.com',
  'ashleydothy3162@gmail.com'
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if admin is already registered
  const checkAdminRegistered = async (email: string) => {
    try {
      const response = await safeApiFetch(`/api/users?email=${encodeURIComponent(email)}&role=admin`);
      if (response.ok) {
        const users = await response.json();
        return users.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate email is in authorized list
      if (!ADMIN_EMAILS.includes(formData.email.toLowerCase())) {
        toast.error('Unauthorized email. Only authorized admins can register.');
        setIsLoading(false);
        return;
      }

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      // Check if admin already registered
      const alreadyRegistered = await checkAdminRegistered(formData.email);
      if (alreadyRegistered) {
        toast.info('Admin account already exists. Redirecting to regular login...');
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
        setIsLoading(false);
        return;
      }

      // Register admin account
      const response = await safeApiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          role: 'admin'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(extractErrorMessage(data, 'Registration failed'));
        setIsLoading(false);
        return;
      }

      toast.success('Admin account created! Redirecting to dashboard...');

      // Auto-login and redirect to admin dashboard
      const loginResponse = await safeApiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Admin Portal" subtitle="Authorized administrators only">
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#5B3594]/25 bg-[#EFE8F8] dark:bg-[#271E42] px-4 py-3 text-xs text-[#5B3594] dark:text-[#EFE8F8] font-semibold">
          <Shield className="size-4 shrink-0 text-[#FF7A3D]" />
          This page is restricted. Unauthorized attempts are logged and monitored.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Authorized admin email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
            />
            <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">Only authorized admin emails are permitted</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Phone number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="e.g. +254701066845"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              disabled={isLoading}
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="off"
                className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
              Confirm password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="off"
                className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#22183D] dark:hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register admin account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
          Already registered?{' '}
          <Link href="/login" className="font-black text-[#5B3594] dark:text-[#FF7A3D] hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
