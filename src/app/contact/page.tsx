import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  Building2,
  HelpCircle
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: 'Contact TaskLynk Academic Solutions — 24/7 Support in Nairobi, Kenya',
  description: 'Get in touch with TaskLynk Academic Solutions. Reach our dedicated project management team via WhatsApp, phone, email, or our inquiry form.',
  ...generateCanonicalMetadata('/contact'),
};

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello TaskLynk Support, I have a question regarding an academic order / specialist application."
);

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1200px]"
            className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">24/7 Dedicated Support</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              We&apos;re Here to Help You <span className="text-[#FF7A3D]">Succeed</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              Have a question about an order, need a custom quote for a complex dissertation, or inquiring about specialist applications? Reach our team anytime.
            </p>
          </div>
        </section>

        {/* Contact Info & Channels */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12">
              
              {/* Left Column: Direct Channels */}
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B]">
                  Direct Contact Channels
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#22183D] dark:text-white tracking-tight">
                  Reach Our Nairobi Office &amp; Support Team
                </h2>
                <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  Our academic project managers are active 24/7 on WhatsApp and phone for immediate responses and urgent 3-hour orders.
                </p>

                <div className="space-y-4 pt-2">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/254701066845?text=${WHATSAPP_MESSAGE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linen-card flex items-center gap-4 p-5 rounded-2xl hover:border-emerald-500 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#22183D] dark:text-white group-hover:text-emerald-600 transition-colors">WhatsApp Instant Support</p>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">+254 701 066 845 (Average reply: &lt;5 mins)</p>
                    </div>
                  </a>

                  {/* Phone */}
                  <div className="linen-card p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-[#FF7A3D]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#22183D] dark:text-white">Direct Telephone Lines</p>
                        <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">24/7 Voice &amp; SMS Support</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <a 
                        href="tel:+254701066845" 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#FF7A3D] text-xs font-bold text-[#22183D] dark:text-white transition-all active:scale-95 shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#FF7A3D]" />
                          <span className="font-mono">+254 701 066 845</span>
                        </span>
                        <span className="text-[10px] text-[#5B3594] dark:text-[#FF7A3D] font-bold bg-[#EFE8F8] dark:bg-[#271E42] px-1.5 py-0.5 rounded">Line 1</span>
                      </a>
                      <a 
                        href="tel:+254702794172" 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#FF7A3D] text-xs font-bold text-[#22183D] dark:text-white transition-all active:scale-95 shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#FF7A3D]" />
                          <span className="font-mono">+254 702 794 172</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold bg-[#EFE8F8] dark:bg-[#271E42] px-1.5 py-0.5 rounded">Line 2</span>
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="linen-card flex items-center gap-4 p-5 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#22183D] dark:text-white">Official Email</p>
                      <a href="mailto:tasklynk01@gmail.com" className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 hover:text-[#5B3594] dark:hover:text-[#FF7A3D] font-bold block mt-0.5">
                        tasklynk01@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Office Location */}
                  <div className="linen-card flex items-center gap-4 p-5 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#22183D] dark:text-white">Headquarters</p>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Nairobi, Kenya • Operating Nationwide &amp; Globally</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Inquiry Form */}
              <div className="lg:col-span-7">
                <ContactForm />
              </div>

            </div>
          </div>
        </section>

        {/* Guarantees & Availability */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="linen-card p-7 rounded-3xl">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Confidentiality Guaranteed</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
                  All inquiries and project details are kept strictly private under non-disclosure protocols.
                </p>
              </div>
              <div className="linen-card p-7 rounded-3xl">
                <Clock className="w-8 h-8 text-[#5B3594] dark:text-[#EFE8F8] mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Fast Response</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
                  We reply within 5 minutes on WhatsApp and under 4 hours via formal email correspondence.
                </p>
              </div>
              <div className="linen-card p-7 rounded-3xl">
                <Building2 className="w-8 h-8 text-[#FF7A3D] mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Local &amp; Global Reach</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
                  Headquartered in Nairobi, serving universities and research scholars nationwide and globally.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

