import {
  ContentPageShell,
  generateContentMetadata,
} from "@/components/site/content-page-shell";
import {
  FileText,
  Shield,
  Users,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  Lock,
  Scale,
  Sparkles,
  CheckCircle,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = generateContentMetadata(
  "Terms & Conditions — TaskLynk Academic Platform",
  "Read the official Terms and Conditions for using TaskLynk. Transparent policies for clients, specialists, editors, and managers. Fair rules, secure payments, and academic integrity.",
  "/terms"
);

export default function TermsPage() {
  return (
    <ContentPageShell>
      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#EEE5F8] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#1D1533] border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#EFE8F8]/80 dark:bg-[#271E42]/40 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#FF7A3D]/8 dark:bg-[#FF7A3D]/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">Legal Agreement</span>
          </div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
            Terms &amp; <span className="text-[#FF7A3D]">Conditions</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
            <strong>TaskLynk Academic</strong> — &ldquo;Linking Talent. Delivering Results.&rdquo; These terms govern the relationship between TaskLynk, our clients, and verified specialists.
          </p>
          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 mt-3 font-semibold">
            Last updated: January 2026
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20 sm:py-28 bg-white dark:bg-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="linen-card p-8 sm:p-10 rounded-3xl">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-[#FF7A3D]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white">
                  Company Overview
                </h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                <p>
                  <strong className="text-[#22183D] dark:text-white">Company Name:</strong> TaskLynk Academic (M&amp;D TechPoint)
                </p>
                <p>
                  <strong className="text-[#22183D] dark:text-white">Slogan:</strong> &ldquo;Linking Talent. Delivering Results.&rdquo;
                </p>
                <p>
                  <strong className="text-[#22183D] dark:text-white">Core Focus:</strong> TaskLynk is an academic and professional writing platform that connects clients seeking high-quality written projects with verified specialists (writers, editors, designers, statisticians, and proofreaders).
                </p>
                <p>
                  TaskLynk ensures transparent, secure, and timely delivery of academic papers, slides, reports, designs, and document services. Through automated workflows and human oversight, the platform provides seamless collaboration.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="mt-8 grid sm:grid-cols-5 gap-4">
              {[
                { title: "Integrity", desc: "Honesty in every order" },
                { title: "Excellence", desc: "Triple-check quality" },
                { title: "Security", desc: "Encrypted M-Pesa & data" },
                { title: "Transparency", desc: "Clear CPP pricing tiers" },
                { title: "Originality", desc: "100% human-crafted" },
              ].map((v) => (
                <div
                  key={v.title}
                  className="linen-card p-5 rounded-2xl text-center"
                >
                  <p className="font-black text-[#5B3594] dark:text-[#FF7A3D] text-sm mb-1">{v.title}</p>
                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-20 sm:py-28 bg-[#FAF8FD] dark:bg-[#140E24]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#22183D] dark:text-white tracking-tight">
                Platform Policies
              </h2>
            </div>

            {/* 1. General Terms */}
            <PolicyCard
              icon={<FileText className="w-5 h-5 text-[#FF7A3D]" />}
              number="1"
              title="General Terms"
              items={[
                "By creating an account, users agree to TaskLynk's Terms of Service, Privacy Policy, and Payment Policy.",
                "All users must provide accurate personal and contact information.",
                "Accounts may be suspended or terminated for violation of these terms.",
              ]}
            />

            {/* 2. Account Roles */}
            <div className="linen-card p-8 sm:p-10 rounded-3xl">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-[#22183D] dark:text-white">
                  2. Account Roles and Responsibilities
                </h3>
              </div>

              <div className="space-y-6">
                <RoleBlock
                  title="Client Policy"
                  items={[
                    "Clients must provide clear order instructions, deadlines, and materials.",
                    "Transparent pricing applies universally based on academic level and urgency.",
                    "Clients can request free revisions within 14 days of deliverable submission.",
                    "Clients are prohibited from uploading offensive, illegal, or malicious assignments.",
                    "Payment is made through verified M-Pesa channels and escrow before files are downloadable.",
                    "Refunds are processed as per the platform money-back guarantee for unfulfilled milestones.",
                  ]}
                />

                <RoleBlock
                  title="Specialist & Writer Policy"
                  items={[
                    "Earnings follow the transparent CPP tier system (Junior, Senior, Pro, Master).",
                    "Specialists must ensure originality — no plagiarism, unauthorized AI-generated, or reused content.",
                    "Every uploaded paper must pass a Turnitin-safe and AI detection review.",
                    "Using generative tools to fake papers is strictly prohibited; limited grammar assistance is permitted.",
                    "Specialists must meet agreed deadlines and follow client rubrics precisely.",
                    "Missed deadlines or substandard content leads to milestone penalties or account closure.",
                  ]}
                />
              </div>
            </div>

            <PolicyCard
              icon={<Shield className="w-5 h-5 text-[#FF7A3D]" />}
              number="3"
              title="Academic Integrity & AI Policy"
              items={[
                "All deliverables must be authentic and tailored directly to project prompts.",
                "TaskLynk reserves the right to run comprehensive AI and plagiarism checks before client delivery.",
                "Plagiarized content results in immediate order reassignment and specialist suspension.",
              ]}
            />

            <PolicyCard
              icon={<Lock className="w-5 h-5 text-[#FF7A3D]" />}
              number="4"
              title="Anti-Fraud & Security Policy"
              items={[
                "Fraudulent payments, impersonation, or document tampering results in permanent blacklisting.",
                "All financial transactions are conducted via encrypted M-Pesa and banking gateways.",
              ]}
            />

            <PolicyCard
              icon={<MessageSquare className="w-5 h-5 text-[#FF7A3D]" />}
              number="5"
              title="Communication Policy"
              items={[
                "All official project communication is recorded within TaskLynk chat for client and specialist protection.",
                "Sharing off-platform contact or solicitations outside the platform is forbidden.",
              ]}
            />

            <PolicyCard
              icon={<DollarSign className="w-5 h-5 text-[#FF7A3D]" />}
              number="6"
              title="Payments & Withdrawals"
              items={[
                "Clients hold funds securely in escrow until order review and approval.",
                "Specialist payouts are credited immediately upon client or QA manager approval.",
                "Withdrawals to M-Pesa are processed weekly or upon demand for verified tiers.",
              ]}
            />

            <PolicyCard
              icon={<Scale className="w-5 h-5 text-[#FF7A3D]" />}
              number="7"
              title="Dispute Resolution"
              items={[
                "In case of quality disputes, dedicated academic managers review rubrics and evidence independently.",
                "Decisions prioritize fair outcomes, revisions, or refunds according to platform standards.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-[#22183D] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#5B3594]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#FF7A3D]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
              Questions About Our Terms?
            </h2>
            <p className="text-base md:text-lg text-[#DDD3E9]/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Our support team is available 24/7 on WhatsApp and email to clarify any of these policies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black px-9 py-4 rounded-2xl text-base shadow-xl shadow-[#FF7A3D]/25 transition-all hover:scale-105"
              >
                Contact Support
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:bg-white/10"
              >
                Read Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ContentPageShell>
  );
}

function PolicyCard({
  icon,
  number,
  title,
  items,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="linen-card p-8 sm:p-10 rounded-3xl">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-2xl font-black text-[#22183D] dark:text-white">
          {number}. {title}
        </h3>
      </div>
      <ul className="space-y-3 text-[#6B627A] dark:text-[#DDD3E9]/90 text-sm sm:text-base">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="border-l-4 border-[#5B3594] dark:border-[#FF7A3D] pl-4">
      <h4 className="font-black text-lg mb-3 text-[#22183D] dark:text-white">{title}</h4>
      <ul className="space-y-2 text-[#6B627A] dark:text-[#DDD3E9]/90 text-sm sm:text-base">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF7A3D] flex-shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

