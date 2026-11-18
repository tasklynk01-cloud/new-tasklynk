"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Lock, Sparkles, CheckCircle2, Star, Users, Zap, Shield } from "lucide-react";
import { AuthLogo } from "./logo";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  /** Page heading shown above the card, e.g. "Welcome back" */
  title: string;
  /** One-line supporting copy under the heading */
  subtitle?: string;
  children: React.ReactNode;
  /** Content max-width. "lg" for multi-card layouts, "xl" for data-dense pickers. */
  width?: "sm" | "lg" | "xl";
  className?: string;
  /** Where the top-right back link goes. Defaults to home. */
  backHref?: string;
  /** Label for the back link. Defaults to "Back to home". */
  backLabel?: string;
  /** Optional wave mode for the left showcase panel. Defaults to 'purple-section' */
  waveMode?: "purple-section" | "hero" | "dark-footer" | "light-section";
}

export function AuthShell({
  title,
  subtitle,
  children,
  width = "sm",
  className,
  backHref = "/",
  backLabel = "Back to home",
  waveMode = "purple-section",
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col lg:flex-row selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* ========================================================================= */}
      {/* LEFT SIDE: Brand Showcase, Fine-Linen Purple Style & Social Proof */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[48%] bg-gradient-to-br from-[#1C1333] via-[#2A1B4A] to-[#120B22] text-white relative flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-[#DDD5E8]/20">
        {/* Active 3D Silk Wave Engine on the Left Side (calibrated opacity for readability) */}
        <StripeGradientMesh
          mode={waveMode}
          heightClass="h-full"
          className="inset-0 opacity-45 pointer-events-none"
        />

        {/* Dark contrast scrim to keep fonts sharp and clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#160E28]/60 via-[#191030]/50 to-[#100920]/80 pointer-events-none" />

        {/* Ambient Linen Sheen & Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#5B3A8C]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-[#5B3A8C]/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[length:32px_32px] pointer-events-none" />

        {/* Top: Logo & Platform Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <AuthLogo variant="white" />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-[#1C1236]/80 border border-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-[#EEE7FA] shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span>Managed Professional Services</span>
          </div>
        </div>

        {/* Middle: Value Prop & Testimonial Card */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#FF7A3D]/20 border border-[#FF7A3D]/40 text-[#FFA06E] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#FF7A3D]" />
              <span>100% Escrow Protected</span>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">
              Where Verified Expertise Meets <span className="text-[#FF7A3D]">Managed Delivery.</span>
            </h2>
            
            <p className="text-sm xl:text-base text-[#EEE7FA] leading-relaxed font-normal drop-shadow-sm">
              Access vetted specialists across web &amp; software development, data analytics, graphic design, video production, business support, research, and writing—overseen by dedicated project managers.
            </p>
          </div>

          {/* 3 Pillars List */}
          <div className="space-y-3 pt-2">
            {[
              { icon: Zap, title: "15-Minute Specialist Matching", text: "Direct assignment to vetted subject matter experts." },
              { icon: Shield, title: "Multi-Stage Quality Assurance", text: "Specialist execution + QA review + milestone tracking." },
              { icon: Star, title: "Milestone Escrow Protection", text: "Funds are released only after you review and approve." },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1B1133]/75 border border-white/15 backdrop-blur-md shadow-md">
                <div className="w-9 h-9 rounded-xl bg-[#FF7A3D]/20 text-[#FF7A3D] flex items-center justify-center shrink-0 font-bold border border-[#FF7A3D]/30">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-[#DDD5E8] mt-0.5 leading-snug">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof Pill */}
          <div className="p-4 rounded-2xl bg-[#1B1133]/80 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["/hero-person.png", "/how-hero-should-look-like.png"].map((src, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#241B3F] overflow-hidden relative bg-[#5B3A8C]">
                    <Image src={src} alt="Specialist" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#FF7A3D]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] font-bold text-white mt-0.5">Vetted Multi-Disciplinary Team</p>
              </div>
            </div>
            <div className="text-right border-l border-white/15 pl-4">
              <p className="text-xs font-bold text-[#FF7A3D]">11+ Categories</p>
              <p className="text-[10px] text-[#DDD5E8]">Managed Delivery</p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Ribbon */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#DDD5E8]">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>M-Pesa Verified Gateway</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: Auth Form Container */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between min-h-screen">
        {/* Top Header with Back Link & Mobile Logo */}
        <header className="flex items-center justify-between px-6 py-5 sm:px-10 border-b border-[#DDD5E8]/60 dark:border-[#3A2F5B] bg-white/80 dark:bg-[#140E24]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="lg:hidden">
            <Link href="/" className="inline-block">
              <AuthLogo variant="auto" />
            </Link>
          </div>
          <div className="hidden lg:block">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6B627A] dark:text-[#DDD3E9]/80">
              TaskLynk Secure Portal
            </span>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B627A] dark:text-[#DDD3E9] hover:text-[#22183D] dark:hover:text-white bg-white dark:bg-[#1D1533] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42] border border-[#DDD5E8] dark:border-[#3A2F5B] rounded-full px-4 py-2 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span>{backLabel}</span>
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 sm:py-14">
          <div
            className={cn(
              "w-full",
              width === "xl" ? "max-w-3xl" : width === "lg" ? "max-w-2xl" : "max-w-md",
              className
            )}
          >
            {/* Header Title & Subtitle */}
            <div className="mb-8 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#EFE8F8] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
                <span>Instant Access</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#22183D] dark:text-white">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 max-w-sm mx-auto leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Auth Form Card */}
            <div className="linen-card p-7 sm:p-10 rounded-3xl shadow-xl">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-5 border-t border-[#DDD5E8]/60 dark:border-[#3A2F5B] bg-white/50 dark:bg-[#140E24]/50 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">
          <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-medium">
            <span>© {new Date().getFullYear()} TaskLynk Academic Solutions</span>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#FF7A3D] transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#FF7A3D] transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Consistent small-print legal line used under the auth card. */
export function AuthLegalNote() {
  return (
    <p className="mt-6 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
      By continuing, you agree to TaskLynk’s{" "}
      <Link href="/terms" className="underline underline-offset-2 text-[#5B3594] dark:text-[#FF7A3D] font-bold">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline underline-offset-2 text-[#5B3594] dark:text-[#FF7A3D] font-bold">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

