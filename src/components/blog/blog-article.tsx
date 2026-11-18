import type { Metadata } from "next";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  User,
  Tag,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";
import { RoleSelectionDialog } from "@/components/auth/role-selection-dialog";
import { BlogArticleMeta, blogArticles } from "@/lib/blog-data";

interface BlogArticleProps {
  meta: BlogArticleMeta;
  content: React.ReactNode;
}

export function BlogArticle({ meta, content }: BlogArticleProps) {
  // Related articles (same category, exclude current)
  const related = blogArticles
    .filter((a) => a.slug !== meta.slug)
    .slice(0, 3);

  // ── JSON-LD structured data ──────────────────────────────────────────
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.excerpt,
    image: meta.image,
    datePublished: meta.date,
    dateModified: meta.date,
    author: {
      "@type": "Person",
      name: meta.author,
      jobTitle: meta.authorRole,
      url: "https://www.tasklynk.co.ke/about",
    },
    publisher: {
      "@type": "Organization",
      name: "TaskLynk Academic",
      url: "https://www.tasklynk.co.ke",
      logo: {
        "@type": "ImageObject",
        url: "https://www.tasklynk.co.ke/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.tasklynk.co.ke/blog/${meta.slug}`,
    },
    keywords: meta.keywords.join(", "),
    inLanguage: "en-KE",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.tasklynk.co.ke",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://www.tasklynk.co.ke/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: meta.title,
        item: `https://www.tasklynk.co.ke/blog/${meta.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <MainHeader />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-12 overflow-hidden bg-transparent border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/4 w-[480px] h-[480px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[420px] h-[420px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mb-6 font-medium">
            <Link href="/" className="hover:text-[#5B3594] dark:hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#5B3594] dark:text-[#FF7A3D]" />
            <Link href="/blog" className="hover:text-[#5B3594] dark:hover:text-white transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#5B3594] dark:text-[#FF7A3D]" />
            <span className="text-[#22183D] dark:text-white font-semibold line-clamp-1">{meta.title}</span>
          </nav>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#EFE8F8] px-3.5 py-1 rounded-full text-xs font-semibold mb-5 shadow-sm uppercase tracking-wider">
              <Tag className="w-3 h-3 text-[#FF7A3D]" />
              {meta.category}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#22183D] dark:text-white mb-5 leading-tight tracking-tight">
              {meta.title}
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed mb-6 font-normal">
              {meta.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#5B3594] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#22183D] dark:text-white leading-tight">
                    {meta.author}
                  </p>
                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 leading-tight mt-0.5">{meta.authorRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF7A3D]" />
                <time dateTime={meta.date}>
                  {new Date(meta.date).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
                <span>{meta.readTime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="py-8 bg-transparent">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg max-w-4xl mx-auto border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70 bg-white dark:bg-[#1D1533]">
            <SafeImage
              src={meta.image}
              alt={meta.imageAlt}
              category={meta.category}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-10 bg-transparent">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none 
              [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#22183D] dark:[&_h2]:text-white [&_h2]:scroll-mt-32
              [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-[#22183D] dark:[&_h3]:text-white
              [&_p]:text-base [&_p]:md:text-[17px] [&_p]:font-normal [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-[#4A4160] dark:[&_p]:text-[#DDD3E9]/90
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:text-[#4A4160] dark:[&_ul]:text-[#DDD3E9]/90
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:text-[#4A4160] dark:[&_ol]:text-[#DDD3E9]/90
              [&_li]:text-base [&_li]:md:text-[17px] [&_li]:font-normal [&_li]:leading-relaxed
              [&_strong]:text-[#22183D] dark:[&_strong]:text-white [&_strong]:font-semibold
              [&_a]:text-[#5B3594] dark:[&_a]:text-[#FF7A3D] [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#FF7A3D] [&_blockquote]:bg-white dark:[&_blockquote]:bg-[#1D1533] [&_blockquote]:p-5 [&_blockquote]:rounded-xl [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:text-[#22183D] dark:[&_blockquote]:text-white [&_blockquote]:border-y [&_blockquote]:border-r [&_blockquote]:border-y-[#DDD3E9]/50 [&_blockquote]:border-r-[#DDD3E9]/50 [&_blockquote]:shadow-sm
              [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-[#DDD3E9] dark:[&_table]:border-[#3A2F5B] [&_table]:bg-white dark:[&_table]:bg-[#1D1533] [&_table]:shadow-sm
              [&_thead]:bg-[#FAF8FD] dark:[&_thead]:bg-[#271E42] [&_thead]:border-b [&_thead]:border-[#DDD3E9] dark:[&_thead]:border-[#3A2F5B]
              [&_th]:px-4 [&_th]:py-3.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[#22183D] dark:[&_th]:text-white [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-left
              [&_td]:px-4 [&_td]:py-3.5 [&_td]:text-sm [&_td]:text-[#4A4160] dark:[&_td]:text-[#DDD3E9]/90 [&_td]:border-t [&_td]:border-[#DDD3E9]/60 dark:[&_td]:border-[#3A2F5B]
              [&_figure]:my-8 [&_figure]:rounded-2xl [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-[#DDD3E9] dark:[&_figure]:border-[#3A2F5B]
              [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-[#6B627A] dark:[&_figcaption]:text-[#DDD3E9]/70 [&_figcaption]:mt-2
              [&_img]:rounded-xl [&_img]:border [&_img]:border-[#DDD3E9] dark:[&_img]:border-[#3A2F5B] [&_img]:shadow-sm
            ">
              {content}
            </div>

            {/* Author Box */}
            <div className="mt-12 linen-card rounded-2xl p-6 md:p-7 border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70 shadow-sm">
              <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-5">
                <div className="w-14 h-14 rounded-xl bg-[#5B3594] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md shadow-[#5B3594]/20">
                  {meta.author[0]}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white mb-1">{meta.author}</h3>
                  <p className="text-xs font-semibold text-[#FF7A3D] uppercase tracking-wider mb-2">
                    {meta.authorRole}
                  </p>
                  <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed font-normal">
                    Verified TaskLynk editorial contributor with years of experience in academic writing, statistical analysis, and editorial quality assurance across Kenyan and international institutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#FAF8FD] dark:bg-[#140E24] border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shadow-sm border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#22183D] dark:text-white tracking-tight">Related Articles</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="linen-card group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70"
                >
                  <div className="relative h-44 overflow-hidden bg-[#FAF8FD] dark:bg-[#1D1533]">
                    <SafeImage
                      src={a.image}
                      alt={a.imageAlt}
                      category={a.category}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-[#FF7A3D] uppercase tracking-wider mb-2 block">
                      {a.category}
                    </span>
                    <h3 className="text-base font-bold text-[#22183D] dark:text-white mb-2 line-clamp-2 group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 line-clamp-2 leading-relaxed font-normal">
                      {a.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Light, Crisp & High-Quality */}
      <section className="py-20 sm:py-24 bg-[#FAF8FD] dark:bg-[#120B20] text-[#22183D] dark:text-white text-center relative overflow-hidden border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
        <StripeGradientMesh
          mode="light-section"
          heightClass="h-full"
          className="inset-0 opacity-70 pointer-events-none"
        />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-3.5 py-1 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-semibold text-[#5B3594] dark:text-[#EFE8F8] uppercase tracking-wider">
                Ready to Get Started?
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#22183D] dark:text-white mb-4 tracking-tight leading-tight">
              Get Expert Academic Help &mdash; 24/7
            </h2>
            <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mb-8 leading-relaxed font-normal">
              Submit your assignment today and get matched with a verified Kenyan specialist, certified editor, and a dedicated academic manager.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <RoleSelectionDialog
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-[#FF7A3D]/25 transition-all hover:scale-[1.02]"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              />
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-[#5B3594]/30 hover:border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:bg-[#EFE8F8] dark:hover:bg-[#271E42]"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export function generateBlogMetadata(meta: BlogArticleMeta): Metadata {
  return {
    title: `${meta.title} | TaskLynk Blog`,
    description: meta.description || meta.excerpt,
    keywords: meta.keywords.join(", "),
    authors: [{ name: meta.author }],
    alternates: {
      canonical: `https://www.tasklynk.co.ke/blog/${meta.slug}`,
    },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description || meta.excerpt,
      url: `https://www.tasklynk.co.ke/blog/${meta.slug}`,
      siteName: "TaskLynk Academic",
      images: [
        {
          url: meta.image,
          width: 1200,
          height: 630,
          alt: meta.imageAlt,
        },
      ],
      authors: [meta.author],
      publishedTime: meta.date,
      modifiedTime: meta.date,
      tags: meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description || meta.excerpt,
      images: [meta.image],
      creator: "@tasklynk",
    },
  };
}

