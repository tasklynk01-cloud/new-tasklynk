"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';

function EditorRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setVerifying(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await safeApiFetch(`/api/invitations/verify?token=${token}`);
      const data = await response.json();

      if (data.valid && data.role === 'editor') {
        setTokenValid(true);
        setTokenEmail(data.email);
      } else {
        toast.error(extractErrorMessage(data, 'Invalid editor invitation link'));
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      toast.error('Failed to verify invitation link');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await safeApiFetch('/api/invitations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // ignore JSON parse errors and fall back to generic
      }

      if (response.ok) {
        toast.success('Registration successful! Redirecting to editor dashboard...');

        // Auto-login the editor and redirect to editor dashboard
        try {
          const loginResponse = await safeApiFetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: tokenEmail,
              password: formData.password,
            }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.token) {
              localStorage.setItem('bearer_token', loginData.token);
            }

            // Redirect to editor dashboard
            setTimeout(() => {
              router.push('/editor/dashboard');
            }, 1000);
          } else {
            // If auto-login fails, redirect to login page
            setTimeout(() => {
              router.push('/login?registered=true&role=editor');
            }, 1500);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          // Fallback to login page
          setTimeout(() => {
            router.push('/login?registered=true&role=editor');
          }, 1500);
        }
      } else {
        const message = data?.error || 'Registration failed';
        const details = data?.details ? `: ${data.details}` : '';
        toast.error(`${message}${details}`);
      }
    } catch (error) {
      console.error('Error registering:', error);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthShell title="Editor registration" subtitle="Verifying your invitation">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (!token || !tokenValid) {
    return (
      <AuthShell title="Invalid invitation" subtitle="This invitation link is invalid, expired, or has already been used">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <XCircle className="size-10 text-destructive" />
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Editor registration" subtitle="You've been invited to join as an editor">
      <Card>
        <CardContent className="pt-2">
          <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-foreground/80">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
            Invitation verified for {tokenEmail}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email address</Label>
              <Input type="email" value={tokenEmail} disabled className="bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-xs font-medium">Phone number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+254 700 000000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">
                Confirm password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create editor account'
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function EditorRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <EditorRegistrationForm />
    </Suspense>
  );
}
