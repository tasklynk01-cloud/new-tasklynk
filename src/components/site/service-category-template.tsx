import { ContentPageShell } from "@/components/site/content-page-shell";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";

export interface ServiceItem {
  title: string;
  description: string;
  price: string;
  icon: LucideIcon;
}

export interface ServiceCategoryPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  services: ServiceItem[];
  accent: string;
}

export function ServiceCategoryPage({
  eyebrow,
  title,
  intro,
  services,
  accent,
}: ServiceCategoryPageProps) {
  return (
    <ContentPageShell>
      {/* Hero */}
      <section className="relative pt-12 md:pt-16 pb-12 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/50">
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" />
              {eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {intro}
            </p>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${accent} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {service.description}
                </p>
                <p className="text-lg font-bold text-primary">{service.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-[#1a1a2e] to-slate-950 text-white overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Start In Minutes
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
              Submit your requirements and your dedicated manager will assign
              the right specialist right away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 py-4 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl px-8 py-4 backdrop-blur-sm transition-colors"
              >
                <Link href="/services">View All Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ContentPageShell>
  );
}
