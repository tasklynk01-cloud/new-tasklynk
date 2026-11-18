"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell, AuthLegalNote } from "@/components/auth/auth-shell";
import Link from "next/link";
import { RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from '@/lib/client-api-helpers';

const STEPS = ["Registration", "Availability", "Subjects", "Verification"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mt-2 mb-6 flex items-center justify-center gap-1.5">
      {STEPS.map((step, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={
                "flex size-6 items-center justify-center rounded-full text-xs font-black " +
                (isDone
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                  ? "bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25"
                  : "bg-[#DDD3E9] dark:bg-[#271E42] text-[#6B627A] dark:text-[#DDD3E9]/60")
              }
            >
              {isDone ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="h-0.5 w-5 bg-[#DDD3E9] dark:bg-[#3A2F5B]" />}
          </div>
        );
      })}
    </div>
  );
}

export const VerifyEmailForm = ({ defaultEmail = "" }: { defaultEmail?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qpEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState<string>(defaultEmail || qpEmail);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!email && (defaultEmail || qpEmail)) {
      setEmail(defaultEmail || qpEmail);
    }
  }, [defaultEmail, qpEmail, email]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      toast.error("Please enter the 6-digit code sent to your email");
      return;
    }

    setLoading(true);
    try {
      let subjectIds: number[] | undefined;
      let availabilityDays: string[] | undefined;
      let availabilityTimes: string[] | undefined;

      try {
        const stored = sessionStorage.getItem('pending_subject_ids');
        if (stored) {
          subjectIds = JSON.parse(stored);
          sessionStorage.removeItem('pending_subject_ids');
        }
      } catch (e) {}

      try {
        const availabilityData = sessionStorage.getItem('pending_availability');
        if (availabilityData) {
          const parsed = JSON.parse(availabilityData);
          availabilityDays = parsed.days || [];
          sessionStorage.removeItem('pending_availability');
        }
      } catch (e) {}

      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
          ...(subjectIds && { subjectIds }),
          ...(availabilityDays && { availabilityDays }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Verification failed"));
        return;
      }
      toast.success("Email verified! Your account is ready. You can now sign in with your password.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Enter your email to resend the code");
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds} seconds before resending`);
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'RATE_LIMITED' && data.remainingSeconds) {
          setCooldownSeconds(data.remainingSeconds);
          toast.error(extractErrorMessage(data, 'Rate limited'));
        } else {
          toast.error(extractErrorMessage(data, "Failed to send code"));
        }
        return;
      }
      toast.success("A new verification code has been sent to your email");
      setCooldownSeconds(60);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send code");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to complete your registration"
    >
      {qpEmail && <StepIndicator current={3} />}

      <form onSubmit={handleVerify} className="space-y-4">
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
            disabled={loading}
            required
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all h-12"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Verification code
          </Label>
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={loading}
            required
            autoComplete="one-time-code"
            className="w-full bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#22183D] dark:text-white rounded-xl h-14 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#5B3594]"
          />
          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400">✓</span>
            Didn't receive the code? Check your <strong>spam/junk folder</strong> — it usually arrives within 3 minutes.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black h-12 rounded-xl shadow-lg shadow-[#FF7A3D]/25 hover:shadow-xl hover:shadow-[#FF7A3D]/35 transition-all text-base mt-2 hover:scale-[1.01]"
          size="lg"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify & Activate Account"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 pt-3 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldownSeconds > 0}
          className="inline-flex items-center gap-1.5 text-[#5B3594] dark:text-[#FF7A3D] font-black hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${resending ? "animate-spin" : ""}`} />
          {cooldownSeconds > 0
            ? `Resend Code (${cooldownSeconds}s)`
            : resending
            ? "Sending..."
            : "Resend verification code"}
        </button>
        <Link href="/login" className="text-[#6B627A] dark:text-[#DDD3E9] hover:text-[#22183D] dark:hover:text-white font-bold">
          Back to sign in
        </Link>
      </div>
      <AuthLegalNote />
    </AuthShell>
  );
};
