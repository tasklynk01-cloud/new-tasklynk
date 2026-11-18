"use client";

import Link from "next/link";
import { Phone, Mail, MessageCircle, ShieldCheck, Award, Clock, MapPin, Sparkles } from "lucide-react";
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello TaskLynk, I'd like to get started on an academic / data analysis project."
);

export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#1B1230] text-[#DDD5E8] pt-16 pb-12 border-t border-[#5B3A8C]/35 overflow-hidden">
      <StripeGradientMesh
        mode="dark-footer"
        heightClass="h-full"
        className="inset-0 opacity-95 pointer-events-none"
      />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Trust Badges Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12 mb-12 border-b border-[#5B3A8C]/30">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#241B3F]/85 backdrop-blur-md border border-[#5B3A8C]/35 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A3D]/20 flex items-center justify-center text-[#FF7A3D] shrink-0 border border-[#FF7A3D]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">100% Quality Verified</p>
              <p className="text-xs text-[#DDD5E8]/80">Managed delivery &amp; escrow</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#241B3F]/85 backdrop-blur-md border border-[#5B3A8C]/35 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#5B3A8C]/40 flex items-center justify-center text-[#EEE7FA] shrink-0 border border-[#5B3A8C]/40">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Verified Specialists</p>
              <p className="text-xs text-[#DDD5E8]/80">Vetted technical &amp; creative experts</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#241B3F]/85 backdrop-blur-md border border-[#5B3A8C]/35 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A3D]/20 flex items-center justify-center text-[#FF7A3D] shrink-0 border border-[#FF7A3D]/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">On-Time Guarantee</p>
              <p className="text-xs text-[#DDD5E8]/80">Milestone &amp; deadline tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#241B3F]/85 backdrop-blur-md border border-[#5B3A8C]/35 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#5B3A8C]/40 flex items-center justify-center text-[#EEE7FA] shrink-0 border border-[#5B3A8C]/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Dedicated Managers</p>
              <p className="text-xs text-[#DDD5E8]/80">24/7 personal project lead</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <TaskLynkLogo size="md" variant="white" showTagline={true} />
            <p className="text-sm text-[#DDD5E8]/90 leading-relaxed max-w-sm">
              TaskLynk is Kenya’s managed professional services platform bringing together verified specialists in technology, data analytics, design, video, business support, research, and academic writing under dedicated project management.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-[#EEE7FA]">
              <span className="inline-flex items-center gap-1 bg-[#241B3F]/85 backdrop-blur-sm border border-[#5B3A8C]/35 px-3 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-[#FF7A3D]" /> Nairobi, Kenya
              </span>
              <span className="inline-flex items-center gap-1 bg-[#241B3F]/85 backdrop-blur-sm border border-[#5B3A8C]/35 px-3 py-1 rounded-lg">
                <span>⏱ 24/7 Active Response</span>
              </span>
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Specialized Services</h4>
            <ul className="space-y-2.5 text-sm text-[#DDD5E8]/85">
              <li><Link href="/services#website-development" className="hover:text-[#FF7A3D] transition-colors">Website &amp; Web Development</Link></li>
              <li><Link href="/services#software-integration" className="hover:text-[#FF7A3D] transition-colors">Software &amp; API Integration</Link></li>
              <li><Link href="/services#data-analytics" className="hover:text-[#FF7A3D] transition-colors">Data Analytics &amp; Power BI</Link></li>
              <li><Link href="/services#graphic-design" className="hover:text-[#FF7A3D] transition-colors">Graphic Design &amp; Video</Link></li>
              <li><Link href="/services#accounting-finance" className="hover:text-[#FF7A3D] transition-colors">Business &amp; Financial Support</Link></li>
              <li><Link href="/services#research-intelligence" className="hover:text-[#FF7A3D] transition-colors">Research &amp; Market Intelligence</Link></li>
              <li><Link href="/services#academic-writing" className="hover:text-[#FF7A3D] transition-colors">Academic &amp; Professional Writing</Link></li>
            </ul>
          </div>

          {/* Quick Links & Resources */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Platform &amp; Tools</h4>
            <ul className="space-y-2.5 text-sm text-[#DDD5E8]/85">
              <li>
                <a href="https://app.tasklynk.co.ke/documents" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF7A3D] transition-colors font-bold text-[#FF7A3D] flex items-center gap-1">
                  <span>⚡ AI Writing Studio Workspace</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#FF7A3D] text-white rounded font-bold">STUDIO</span>
                </a>
              </li>
              <li>
                <a href="https://app.tasklynk.co.ke" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF7A3D] transition-colors font-bold text-[#EEE7FA] flex items-center gap-1">
                  <span>Enterprise OS Portal</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#5B3A8C] text-white rounded font-bold">APP</span>
                </a>
              </li>
              <li><Link href="/login" className="hover:text-[#FF7A3D] transition-colors">Portal Sign In</Link></li>
              <li><Link href="/about" className="hover:text-[#FF7A3D] transition-colors">About TaskLynk</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#FF7A3D] transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-[#FF7A3D] transition-colors">Pricing &amp; Calculator</Link></li>
              <li><Link href="/blog" className="hover:text-[#FF7A3D] transition-colors">Guides &amp; Insights</Link></li>
              <li>
                <a href="https://humaragpt.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF7A3D] transition-colors flex items-center gap-1 text-[#EEE7FA]">
                  <span>HumaraGPT AI Humanizer</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#5B3A8C] text-white rounded">AI</span>
                </a>
              </li>
              <li>
                <a href="https://plagcheck.kingpin.co.ke" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF7A3D] transition-colors flex items-center gap-1 text-[#EEE7FA]">
                  <span>PlagCheck AI &amp; Turnitin</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded">QA</span>
                </a>
              </li>
              <li>
                <Link href="/register/freelancer" className="hover:text-[#FF7A3D] transition-colors">
                  Join as a Verified Specialist
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Direct Support</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-2.5 text-[#DDD5E8]">
                <Phone className="w-4 h-4 text-[#FF7A3D] shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+254701066845" className="hover:text-white transition-colors block font-bold text-white font-mono">
                    +254 701 066 845
                  </a>
                  <span className="text-xs text-[#DDD5E8]/65">Call / SMS Support</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[#DDD5E8]">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <a
                    href={`https://wa.me/254701066845?text=${WHATSAPP_MESSAGE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors block font-medium text-white"
                  >
                    WhatsApp Instant Chat
                  </a>
                  <span className="text-xs text-[#DDD5E8]/65">Under 5 min response</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[#DDD5E8]">
                <Mail className="w-4 h-4 text-[#FF7A3D] shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:tasklynk01@gmail.com" className="hover:text-white transition-colors block font-medium text-white">
                    tasklynk01@gmail.com
                  </a>
                  <span className="text-xs text-[#DDD5E8]/65">Official inquiries</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#5B3A8C]/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#DDD5E8]/75">
          <p>© {year} TaskLynk Professional Services. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#FF7A3D] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#FF7A3D] transition-colors">Terms of Service</Link>
            <Link href="/policy" className="hover:text-[#FF7A3D] transition-colors">Quality &amp; Refund Policy</Link>
            <Link href="/contact" className="hover:text-[#FF7A3D] transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
