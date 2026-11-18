import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  BarChart3,
  Users,
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Globe,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { UniversityCurriculumBadges } from "@/components/site/university-curriculum-badges";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";
import { generateRichServiceSchema } from "@/lib/rich-snippets";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/spss-analysts-kenya",
  {
    title: "Hire SPSS Data Analysts in Kenya | Affordable Statistical Experts | TaskLynk",
    description:
      "Hire vetted Kenyan SPSS freelancers for dissertation, thesis, and research data analysis. Same time zone, local market knowledge, M-Pesa payments. SPSS, AMOS, Process Macro expertise. Secure escrow.",
    openGraph: {
      title: "Hire SPSS Data Analysts in Kenya | Affordable Statistical Experts | TaskLynk",
      description:
        "Hire vetted Kenyan SPSS freelancers for dissertation, thesis, and research data analysis. Same time zone, local market knowledge, M-Pesa payments.",
      type: "website",
    },
  }
);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why hire a Kenyan SPSS analyst instead of an international freelancer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kenyan analysts share your time zone (EAT = UTC+3), understand local university requirements (Kenyatta, UoN, Strathmore, JKUAT, etc.), know Kenyan research contexts (NGO surveys, agriculture data, financial sector), and accept M-Pesa/bank transfer. No 3 AM calls or currency conversion headaches.",
      },
    },
    {
      "@type": "Question",
      name: "What SPSS analyses can Kenyan freelancers on TaskLynk perform?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Full range: descriptive statistics, t-tests, ANOVA/ANCOVA/MANOVA, regression (linear, logistic, multinomial, hierarchical), factor analysis, reliability (Cronbach&apos;s α), correlation, chi-square, non-parametric tests, PROCESS macro (mediation/moderation), AMOS/SEM, survey weighting, complex sample analysis, and custom syntax.",
      },
    },
    {
      "@type": "Question",
      name: "Can you help with dissertation/thesis data analysis for Kenyan universities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our Kenyan freelancers are familiar with formatting requirements for UoN, Kenyatta, Strathmore, JKUAT, Egerton, Moi, and other institutions. They deliver APA 7th edition formatted results chapters, SPSS output (.spv), syntax files (.sps), and interpretation ready for Chapter 4.",
      },
    },
    {
      "@type": "Question",
      name: "How does payment work for Kenyan clients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We support M-Pesa, bank transfer (KES), and card payments. Funds are held in escrow until you approve each milestone. No international wire fees. You pay in KES; freelancers receive KES. Transparent, local, secure.",
      },
    },
    {
      "@type": "Question",
      name: "What if I need urgent analysis for a deadline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Nairobi-based freelancers offer 24–48 hour turnaround for standard analyses. For urgent 3-hour order deadlines, we have analysts on standby via WhatsApp (+254 701 066 845). Post your project with &apos;Urgent&apos; tag to get immediate bids.",
      },
    },
    {
      "@type": "Question",
      name: "Are your Kenyan freelancers qualified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every freelancer passes a rigorous SPSS skills assessment, portfolio review, and academic credentials verification. Many hold Master&apos;s/PhDs from Kenyan and international universities. They&apos;ve analyzed data for NGOs, government agencies, and graduate students across Kenya.",
      },
    },
  ],
};

const serviceSchema = generateRichServiceSchema({
  name: "SPSS Data Analysts in Kenya",
  serviceType: "Statistical Consulting and SPSS Data Analysis Kenya",
  description:
    "Hire vetted Kenyan SPSS freelancers for dissertation, thesis, and research data analysis. Same time zone, local market knowledge, M-Pesa payments, APA-formatted results. Secure escrow.",
  canonicalPath: "/services/data-analysis/spss-analysts-kenya",
  areaServed: ["Nairobi", "Kenya"],
  aggregateRating: {
    ratingValue: 4.9,
    reviewCount: 268,
    bestRating: 5,
    worstRating: 1,
  },
  offers: {
    lowPrice: 2500,
    highPrice: 35000,
    priceCurrency: "KES",
    offerCount: 10,
  },
});

export default function SPSSAnalystsKenyaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <MainHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 md:pt-28 pb-16 lg:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/50">
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <MapPin className="w-3 h-3" />
                <span>Kenya · East Africa</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire SPSS Data Analysts in Kenya <br />
                <span className="text-gradient-orange">Local Statistical Experts for Your Research</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Same time zone. Local university knowledge. M-Pesa payments. Hire vetted Kenyan SPSS freelancers on TaskLynk for dissertation, thesis, NGO, and business data analysis — without the hassle of international freelancers.
              </p>
            </div>
          </div>
        </section>

        {/* Why Hire Locally */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  Why Hire SPSS Analysts in Kenya?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  When your research deadline looms, the last thing you need is a freelancer asleep in a different time zone, unfamiliar with your university&apos;s formatting requirements, or insisting on USD wire transfers. TaskLynk&apos;s Kenyan SPSS analysts eliminate these friction points.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                    <MapPin className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-1">Aligned Time Zones (EAT)</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Real-time collaboration during your working hours. No 3 AM WhatsApp messages.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                    <GraduationCap className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-1">Local University Expertise</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Familiar with UoN, Kenyatta, Strathmore, JKUAT, Moi, Egerton formatting & Chapter 4 requirements.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                    <Building2 className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-1">Kenyan Research Context</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">NGO surveys, agriculture data, county-level statistics, financial sector, SME research.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                    <Phone className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-1">Local Payments</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">M-Pesa, bank transfer (KES), card. No forex fees. Escrow in local currency.</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Cities We Cover</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  Our freelancer network spans Kenya&apos;s major academic and business hubs:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6 columns-2 md:columns-4">
                  <li>Nairobi (CBD, Westlands, Kilimani, Karen, Runda)</li>
                  <li>Mombasa (Nyali, Bamburi, CBD)</li>
                  <li>Kisumu (Milimani, CBD)</li>
                  <li>Eldoret (Town, Annex)</li>
                  <li>Nakuru, Thika, Nyeri, Meru, Kakamega</li>
                  <li>Remote analysts serving all counties</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  SPSS Services Our Kenyan Freelancers Deliver
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Whether you&apos;re a Master&apos;s student at UoN, a PhD candidate at Strathmore, an NGO evaluating a USAID project, or a Nairobi SME analyzing customer data — our analysts match the method to your context.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Academic Research Analysis</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Dissertation & thesis Chapter 4: full results chapter with APA 7th tables</li>
                  <li>Research proposal: power analysis, sample size justification, analysis plan</li>
                  <li>Journal article analysis: reviewer-ready statistics, reproducibility files</li>
                  <li>Questionnaire/survey analysis: Likert scaling, reverse coding, reliability, factor analysis</li>
                  <li>Experimental design: RCT analysis, pre-post, crossover, cluster randomized</li>
                  <li>Longitudinal data: mixed models, GEE, growth curve modeling</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Advanced Statistical Techniques</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Structural Equation Modeling (AMOS / lavaan via R integration)</li>
                  <li>Mediation & moderation (PROCESS Macro Models 1–90+)</li>
                  <li>Multilevel / hierarchical linear modeling (HLM)</li>
                  <li>Survival analysis: Kaplan-Meier, Cox regression</li>
                  <li>Time series & forecasting: ARIMA, exponential smoothing</li>
                  <li>Complex survey analysis: weights, stratification, clustering</li>
                  <li>Meta-analysis: effect size synthesis, forest plots, funnel plots</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Business & NGO Analytics</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Customer segmentation & profiling (K-means, hierarchical clustering)</li>
                  <li>Predictive modeling: churn, credit scoring, demand forecasting</li>
                  <li>Program evaluation: difference-in-differences, RCT analysis, RDD</li>
                  <li>Market research: conjoint, MaxDiff, brand tracking</li>
                  <li>Financial analysis: ratio analysis, trend modeling, risk scoring</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Deliverables Included</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Cleaned dataset (.sav, .csv, .xlsx)</li>
                  <li>SPSS output (.spv) + syntax (.sps) for full reproducibility</li>
                  <li>APA 7th edition formatted tables ready for thesis/journal</li>
                  <li>Plain-English interpretation of every test</li>
                  <li>Assumption checking documentation</li>
                  <li>Power analysis / sample size justification (if requested)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">Why TaskLynk Kenya?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                The Leading Marketplace for Kenyan Data Talent
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                We&apos;re building Kenya&apos;s most trusted freelance data network — one verified analyst at a time.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Kenyan Talent Pool", desc: "100+ verified analysts from Nairobi, Mombasa, Kisumu, Eldoret and beyond." },
                { icon: ShieldCheck, title: "M-Pesa Escrow", desc: "Pay in KES via M-Pesa. Funds released only when you approve deliverables." },
                { icon: MessageSquare, title: "WhatsApp Support", desc: "24/7 support on +254 701 066 845. Real humans, not bots." },
                { icon: Globe, title: "Local + Global", desc: "Kenyan rates, global standards. Work with analysts who publish internationally." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                From Nairobi Brief to Approved Results in 3 Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Post in Minutes", desc: "Describe your SPSS needs, university (if academic), timeline, and KES budget. Free to post." },
                { step: "02", icon: Users, title: "Meet Local Analysts", desc: "Receive 3–5 vetted Kenyan SPSS experts within hours. Chat on WhatsApp before hiring." },
                { step: "03", icon: CheckCircle2, title: "Pay via M-Pesa", desc: "Fund escrow in KES. Review .spv, .sps, and APA tables. Release payment when satisfied." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-green-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* University & Institutional Compliance Badges */}
        <UniversityCurriculumBadges />

        {/* FAQ */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About Hiring Kenyan SPSS Analysts?
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqSchema.mainEntity.map((faq, index) => (
                <details key={index} className="group bg-card border border-border rounded-xl p-6">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground">
                    {faq.name}
                    <span className="text-primary transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-green-500 via-green-500/95 to-green-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Work with Kenya&apos;s Best SPSS Analysts?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your project in minutes. Get matched with local experts who understand your context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-green-600 hover:bg-white/90 font-bold rounded-full px-8">
                  <Link href="/register/client">Post a Project Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-white font-bold rounded-full px-8">
                  <Link href="/services/data-analysis/spss-data-analysis-services">View SPSS Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Links */}
        <section className="py-12 bg-background border-t border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="prose prose-slate dark:prose-invert max-w-none max-w-3xl mx-auto text-center">
              <p className="text-sm text-muted-foreground">
                Need analysts in a specific city?{" "}
                <Link href="/services/data-analysis/data-analysts-nairobi" className="text-primary font-semibold hover:underline">Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/excel-experts-nairobi" className="text-primary font-semibold hover:underline">Excel Experts Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/power-bi-consultants-nairobi" className="text-primary font-semibold hover:underline">Power BI Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/kenya-data-analysis-services" className="text-primary font-semibold hover:underline">All Kenya Data Services</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}