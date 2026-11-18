import type { Metadata } from "next";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";
import { blogArticles } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "TaskLynk Blog — Insights on Academic Writing, SPSS, Freelancing & Referencing in Kenya",
  description:
    "Expert guides, tutorials, and industry insights on academic writing services in Kenya, SPSS data analysis, urgent essay delivery, freelance writing careers, APA/MLA/Harvard/Chicago formatting, and more.",
  keywords: [
    "academic writing services Kenya",
    "essay writing service",
    "SPSS analysis Kenya",
    "data analysis help Kenya",
    "thesis writing Kenya",
    "freelance writers Kenya",
    "APA MLA Harvard Chicago formatting",
    "urgent academic writing 3 hours",
    "TaskLynk academic help",
    "best writing platform Kenya",
  ],
  alternates: {
    canonical: "https://www.tasklynk.co.ke/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <MainHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-14 lg:pb-20 bg-transparent border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40 text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/4 w-[480px] h-[480px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[420px] h-[420px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-3.5 py-1 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">
                TaskLynk Editorial Blog
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#22183D] dark:text-white leading-[1.12]">
              Insights, Guides &amp; <span className="text-[#FF7A3D]">Industry Knowledge</span>
            </h1>
            <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-4 leading-relaxed max-w-2xl mx-auto font-normal">
              Long-form guides and tutorials authored by <strong className="font-semibold text-[#22183D] dark:text-white">verified Kenyan academic editors and data analysts</strong> on SPSS, data modeling, academic writing, and research methodology.
            </p>
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-16 sm:py-24 bg-[#FAF8FD] dark:bg-[#140E24] relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#FF7A3D]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-[#5B3594]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-10 sm:mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shadow-sm border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#22183D] dark:text-white tracking-tight">Latest Articles</h2>
              <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5 font-normal">Expert guides for students, researchers, and professional specialists</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {blogArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="linen-card group rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70 shadow-sm hover:shadow-xl hover:shadow-[#5B3594]/8"
              >
                <div className="relative h-52 overflow-hidden bg-[#FAF8FD] dark:bg-[#1D1533]">
                  <SafeImage
                    src={article.image}
                    alt={article.imageAlt}
                    category={article.category}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3.5 left-3.5">
                    <span className="bg-[#5B3594] text-white text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-md shadow-[#5B3594]/20 uppercase tracking-wider">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white mb-2.5 group-hover:text-[#FF7A3D] transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mb-5 leading-relaxed flex-1 line-clamp-3 font-normal">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 pt-3.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF7A3D]" />
                      <time dateTime={article.date}>
                        {new Date(article.date).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5B3594] dark:text-[#FF7A3D]" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3.5 text-[#FF7A3D] text-xs sm:text-sm font-semibold group-hover:gap-2.5 transition-all">
                    Read article
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-[#22183D] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#5B3594]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#FF7A3D]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3.5 py-1 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-semibold text-[#EFE8F8] uppercase tracking-wider">
                Need Help Fast?
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
              Need Help With Your Project Today?
            </h2>
            <p className="text-sm sm:text-base text-[#DDD3E9]/90 mb-8 leading-relaxed font-normal">
              Connect with TaskLynk for plagiarism-free academic writing, SPSS analysis, and technical services &mdash; coordinated under dedicated project management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register/client"
                className="inline-flex items-center justify-center gap-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-[#FF7A3D]/25 transition-all hover:scale-[1.02]"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:bg-white/10"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

