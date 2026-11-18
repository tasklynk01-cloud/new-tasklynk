"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building2,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';

export default function CertificateVerificationPage(props: {
  params: Promise<{ certNumber: string }>;
}) {
  const params = use(props.params);
  const { certNumber } = params;

  const [verification, setVerification] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const res = await fetch(`/api/training/verify/${certNumber}`);
        const data = await res.json();
        if (data.success) {
          setVerification(data);
        } else {
          setError(data.error || 'Invalid or revoked certificate');
        }
      } catch (err: any) {
        setError(err.message || 'Verification service error');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [certNumber]);

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col relative font-sans selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[700px]"
        className="inset-x-0 top-0 opacity-100 dark:opacity-80 pointer-events-none"
      />

      <MainHeader />

      <main className="flex-1 flex items-center justify-center pt-32 pb-16 px-4 relative z-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-[#FF7A3D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#6B627A] dark:text-[#DDD3E9]">Verifying credential against official TaskLynk registry...</p>
          </div>
        ) : error || !verification ? (
          <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#1D1533] border border-red-500/30 text-center space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-[#22183D] dark:text-white">Verification Failed</h2>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
              {error || 'No authentic record matches this certificate reference.'}
            </p>
            <div className="p-3 bg-[#FAF8FD] dark:bg-[#160F29] rounded-xl font-mono text-xs text-[#22183D] dark:text-slate-300 border border-[#DDD3E9] dark:border-[#3A2F5B]">
              Queried Ref: {certNumber}
            </div>
            <Link href="/training">
              <Button className="mt-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white text-xs font-bold h-10">
                Browse Training Academy
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl w-full p-8 sm:p-12 rounded-3xl bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-2xl space-y-8 backdrop-blur-xl">
            {/* Authenticity Badge */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Verified Official TaskLynk Academy Credential</span>
              </div>
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-2">
              <div className="text-xs font-bold text-[#5B3594] dark:text-[#FFA06E] uppercase tracking-widest">
                TaskLynk Training Academy
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white">Certificate of Achievement</h1>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2">
                This document officially certifies the completion of all requirements for:
              </p>
              <div className="text-xl sm:text-2xl font-black text-[#FF7A3D] pt-1">
                {verification.course.title}
              </div>
            </div>

            {/* Recipient */}
            <div className="p-6 bg-[#FAF8FD] dark:bg-[#160F29] rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] text-center space-y-1">
              <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 uppercase tracking-wider font-semibold">Awarded To</span>
              <div className="text-2xl font-black text-[#22183D] dark:text-white">
                {verification.certificate.learnerName}
              </div>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">
                Cohort: {verification.cohort.name} ({verification.course.durationDays} Days Intensive)
              </p>
            </div>

            {/* Technical Verification Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8FD] dark:bg-[#160F29]/50 p-5 rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B]">
              <div>
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Certificate Reference:</span>
                <div className="font-mono font-bold text-[#22183D] dark:text-white mt-0.5">{verification.certificate.certificateNumber}</div>
              </div>
              <div>
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Completion Date:</span>
                <div className="font-bold text-[#22183D] dark:text-white mt-0.5">
                  {new Date(verification.certificate.completionDate).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Authorized Signatory:</span>
                <div className="font-bold text-[#22183D] dark:text-white mt-0.5">{verification.certificate.authorizedSignatory}</div>
              </div>
              <div>
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Issuing Organization:</span>
                <div className="font-bold text-[#22183D] dark:text-white mt-0.5">TaskLynk Technologies Ltd (Kenya)</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => window.print()}
                className="w-full sm:w-auto bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold text-xs h-11 px-6 shadow-lg shadow-[#FF7A3D]/20"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Verified Certificate
              </Button>

              <Link href={`/training/${verification.course.slug}`} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-[#DDD3E9] dark:border-[#3A2F5B] text-xs font-bold text-[#5B3594] dark:text-[#DDD3E9] h-11 px-6"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Program Curriculum
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
