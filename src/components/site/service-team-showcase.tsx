import Link from 'next/link';
import { ShieldCheck, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { SpecialistAvatar } from '@/components/site/specialist-avatar';
import type { PublicSpecialist } from '@/lib/public-specialist-dto';

interface ServiceTeamShowcaseProps {
  title?: string;
  subtitle?: string;
  specialists: PublicSpecialist[];
  serviceCategory?: string;
}

export function ServiceTeamShowcase({
  title = 'Accredited Team Specialists Assigned to This Service',
  subtitle = 'Every TaskLynk specialist is thoroughly vetted, identity-verified, and supervised under our strict quality assurance protocol.',
  specialists,
  serviceCategory,
}: ServiceTeamShowcaseProps) {
  if (!specialists || specialists.length === 0) return null;

  return (
    <section className="py-16 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
      <StripeGradientMesh
        mode="light-section"
        heightClass="h-full"
        className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
      />
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-2">
            TaskLynk Team
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((spec) => (
            <div
              key={spec.slug}
              className="linen-card group rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-[#FF7A3D] dark:hover:border-[#FF7A3D] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative bg-white/95 dark:bg-[#1A1230]/95 backdrop-blur-md border border-[#DDD3E9] dark:border-[#3A2F5B]"
            >
              <div>
                {/* Top row: Avatar, Specialist Badge, Rating */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <SpecialistAvatar
                      avatarUrl={spec.avatarUrl}
                      name={spec.displayName}
                      headline={spec.headline}
                      size="md"
                      className="shadow-md ring-2 ring-[#FF7A3D]/20 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                      <h4 className="font-black text-base text-[#22183D] dark:text-white truncate group-hover:text-[#FF7A3D] transition-colors">
                        {spec.displayName}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Verified Specialist
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8] dark:bg-[#271E42] px-2 py-0.5 rounded-full border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70 shadow-xs">
                      ★ {spec.ratingAverage ? Number(spec.ratingAverage).toFixed(1) : "4.9"}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-bold text-[#FF7A3D] line-clamp-1 mb-2">
                  {spec.headline}
                </p>

                <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 line-clamp-3 mb-3 leading-relaxed">
                  {spec.bio}
                </p>

                <div className="flex flex-wrap gap-1 pt-2 border-t border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40 mb-3">
                  {spec.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8FD] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40 flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-1/2 text-[11px] font-bold rounded-xl border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] hover:bg-[#5B3594] hover:text-white"
                >
                  <Link href={`/professionals/${spec.slug}`}>
                    Profile &amp; Portfolio
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="w-1/2 text-[11px] font-bold rounded-xl bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-md shadow-[#FF7A3D]/20"
                >
                  <Link href={`/client/new-job?service=${encodeURIComponent(serviceCategory || spec.headline)}&preferredSpecialist=${spec.slug}`}>
                    Request
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/professionals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B3594] dark:text-[#FF7A3D] hover:underline"
          >
            <span>View All Accredited TaskLynk Specialists</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
