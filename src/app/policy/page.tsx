import {
  ContentPageShell,
  generateContentMetadata,
} from "@/components/site/content-page-shell";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Users,
  Briefcase,
  FileWarning,
  Lock,
  Scale,
  Phone,
  Mail as MailIcon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = generateContentMetadata(
  "Company Policy & Code of Conduct — TaskLynk Academic",
  "TaskLynk's full company policy and code of conduct. Transparent rules for clients, freelancers, managers, editors, and admins. Fair penalties, secure payments, and academic integrity.",
  "/policy"
);

const violationMatrix = [
  { violation: "Plagiarism", penalty: "30–100% fine, suspension, ban" },
  { violation: "AI misuse", penalty: "Treated as plagiarism" },
  { violation: "Late delivery", penalty: "10–50% fine, rating downgrade" },
  { violation: "Fraud / chargeback", penalty: "Permanent ban + legal action" },
  { violation: "Account selling", penalty: "Permanent ban" },
  { violation: "Abuse of power", penalty: "Dismissal" },
  { violation: "Harassment / threats", penalty: "Account suspension / ban" },
  { violation: "Duplicate accounts", penalty: "Merge + suspension" },
  { violation: "Corruption / bribery", penalty: "Immediate termination" },
  {
    violation: "Unapproved external payments",
    penalty: "Permanent ban",
  },
];

export default function CompanyPolicyPage() {
  return (
    <ContentPageShell>
      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#EEE5F8] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#1D1533] border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#EFE8F8]/80 dark:bg-[#271E42]/40 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#FF7A3D]/8 dark:bg-[#FF7A3D]/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">Ethics &amp; Governance</span>
          </div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
            Company Policy &amp; <span className="text-[#FF7A3D]">Code of Conduct</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
            TaskLynk is committed to maintaining a professional, transparent, and ethical academic-support environment. These standards apply equally to all users.
          </p>
          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 mt-3 font-semibold">
            Last updated: January 2026
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 sm:py-24 bg-white dark:bg-[#140E24]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl space-y-8">
              {/* 1. General Statement */}
              <PolicySection
                number="1"
                title="General Statement"
                tone="blue"
                icon={<Sparkles className="w-5 h-5" />}
              >
                <p className="text-foreground/90 leading-relaxed">
                  TaskLynk is committed to maintaining a professional,
                  transparent, and ethical academic-support and freelance work
                  environment. All users — clients, freelancers, managers,
                  editors, and admins — must comply with the policies outlined
                  below. Violation of these policies may lead to account
                  restrictions, penalties, or permanent ban.
                </p>
              </PolicySection>

              {/* 2. Client Policies */}
              <PolicySection
                number="2"
                title="Client Policies"
                tone="blue"
                icon={<Users className="w-5 h-5" />}
              >
                <SubSection title="2.1 Fraud & Misrepresentation">
                  <p>Clients must avoid:</p>
                  <ul>
                    <li>Filing fraudulent disputes.</li>
                    <li>Submitting false claims about work quality.</li>
                    <li>Refusing to pay for completed and approved work.</li>
                    <li>Uploading fake evidence to force refunds.</li>
                  </ul>
                  <Penalty tone="red">
                    Immediate account suspension, permanent ban, and legal
                    follow-up for financial fraud.
                  </Penalty>
                </SubSection>

                <SubSection title="2.2 Payment & Refund Policy">
                  <ul>
                    <li>Payment must be completed before order activation or release.</li>
                    <li>Partial refunds are only issued if the platform confirms service failure.</li>
                    <li>Full refunds are not issued when work has been delivered according to instructions, when the client becomes unresponsive, or when the client changes requirements after completion.</li>
                  </ul>
                  <Penalty tone="yellow">
                    <strong>Chargebacks:</strong> Chargebacks will result in
                    account termination and debt collection.
                  </Penalty>
                </SubSection>

                <SubSection title="2.3 Duplicate or Fraudulent Accounts">
                  <p>Clients may not create multiple accounts to:</p>
                  <ul>
                    <li>Circumvent payment limits.</li>
                    <li>Abuse discounts.</li>
                    <li>Hide previous bans.</li>
                  </ul>
                  <Penalty tone="red">
                    All duplicate accounts are merged and suspended; ongoing
                    orders are placed on hold; potential legal action for
                    fraud.
                  </Penalty>
                </SubSection>

                <SubSection title="2.4 Abuse, Harassment & Threats">
                  <ul>
                    <li>Threatening managers, freelancers, or support staff is strictly prohibited.</li>
                    <li>Abusive or manipulative behaviour to force free work is not allowed.</li>
                  </ul>
                  <Penalty tone="red">
                    Temporary or permanent suspension.
                  </Penalty>
                </SubSection>
              </PolicySection>

              {/* 3. Freelancer Policies */}
              <PolicySection
                number="3"
                title="Freelancer Policies"
                tone="purple"
                icon={<Briefcase className="w-5 h-5" />}
              >
                <SubSection title="3.1 Academic Integrity">
                  <p>Freelancers must:</p>
                  <ul>
                    <li>Deliver original work.</li>
                    <li>Cite sources properly.</li>
                    <li>Produce plagiarism-free content.</li>
                  </ul>
                  <Penalty tone="red">
                    <ul className="list-disc list-inside space-y-1">
                      <li>1st offence: 30% fine + written warning.</li>
                      <li>2nd offence: 100% fine + 14-day suspension.</li>
                      <li>3rd offence: Permanent ban.</li>
                    </ul>
                  </Penalty>
                </SubSection>

                <SubSection title="3.2 AI Content Policy">
                  <p>Use of AI tools (ChatGPT, Bard, Claude, etc.) is:</p>
                  <ul>
                    <li>Allowed only when permitted by the client or admin.</li>
                    <li>Banned for technical, professional, or strict academic assignments unless specified.</li>
                  </ul>
                  <p>All final deliverables MUST include:</p>
                  <ul>
                    <li>An AI-detection report.</li>
                    <li>A plagiarism report.</li>
                  </ul>
                  <Penalty tone="yellow">
                    Submitting AI-generated content without approval is
                    misconduct and is treated as plagiarism.
                  </Penalty>
                </SubSection>

                <SubSection title="3.3 Deadline & Availability">
                  <p>Freelancers must:</p>
                  <ul>
                    <li>Deliver drafts, revisions, and final copies on time.</li>
                    <li>Inform managers early if a delay is expected.</li>
                    <li>Be reachable during the order lifecycle.</li>
                  </ul>
                  <Penalty tone="yellow">
                    <ul className="list-disc list-inside space-y-1">
                      <li>10–50% deduction depending on severity.</li>
                      <li>Order reassigned and freelancer unpaid for repeated lateness.</li>
                      <li>Suspension after multiple late submissions.</li>
                    </ul>
                  </Penalty>
                </SubSection>

                <SubSection title="3.4 Fraud & Account Abuse">
                  <p>Freelancers may NOT:</p>
                  <ul>
                    <li>Use multiple accounts.</li>
                    <li>Sell or rent accounts.</li>
                    <li>Collude with clients for external payments.</li>
                    <li>Manipulate ratings or feedback.</li>
                  </ul>
                  <Penalty tone="red">
                    Immediate and permanent ban + forfeiture of earnings.
                  </Penalty>
                </SubSection>

                <SubSection title="3.5 Corruption & Abuse of Power">
                  <p>Freelancers may NOT:</p>
                  <ul>
                    <li>Bribe managers for priority assignments.</li>
                    <li>Offer gifts or money for unfair treatment.</li>
                    <li>Manipulate queue systems.</li>
                  </ul>
                  <Penalty tone="red">Permanent termination.</Penalty>
                </SubSection>
              </PolicySection>

              {/* 4. Manager / Editor Policies */}
              <PolicySection
                number="4"
                title="Manager / Editor Policies"
                tone="green"
                icon={<FileWarning className="w-5 h-5" />}
              >
                <SubSection title="4.1 Abuse of Power">
                  <ul>
                    <li>Favouring specific freelancers unfairly.</li>
                    <li>Assigning orders to unqualified persons.</li>
                    <li>Taking bribes or engaging in corruption.</li>
                    <li>Editing client instructions to manipulate outcomes.</li>
                  </ul>
                  <Penalty tone="red">
                    <ul className="list-disc list-inside space-y-1">
                      <li>1st offence: Salary deduction + written warning.</li>
                      <li>2nd offence: Suspension.</li>
                    </ul>
                  </Penalty>
                </SubSection>

                <SubSection title="4.2 Quality Control Responsibilities">
                  <p>Managers must:</p>
                  <ul>
                    <li>Verify plagiarism and AI reports.</li>
                    <li>Approve deliveries only after confirming quality.</li>
                    <li>Ensure instructions are clear before assigning.</li>
                    <li>Request additional pay only when justified.</li>
                  </ul>
                  <Penalty tone="yellow">
                    Fines or removal depending on severity.
                  </Penalty>
                </SubSection>

                <SubSection title="4.3 Confidentiality Policy">
                  <p>Managers must protect:</p>
                  <ul>
                    <li>Client personal data.</li>
                    <li>Attached documents.</li>
                    <li>Research materials.</li>
                  </ul>
                  <Penalty tone="red">
                    Any leak of client documents is grounds for immediate
                    dismissal.
                  </Penalty>
                </SubSection>
              </PolicySection>

              {/* 5. Admin & Internal Staff Policy */}
              <PolicySection
                number="5"
                title="Admin & Internal Staff Policy"
                tone="amber"
                icon={<Lock className="w-5 h-5" />}
              >
                <SubSection title="5.1 Integrity & Neutrality">
                  <p>Admins must:</p>
                  <ul>
                    <li>Handle disputes impartially.</li>
                    <li>Avoid favouritism.</li>
                    <li>Protect all user data.</li>
                  </ul>
                  <p>Any intentional mismanagement is treated as corruption.</p>
                </SubSection>

                <SubSection title="5.2 System Access & Security">
                  <p>Admins must not:</p>
                  <ul>
                    <li>Grant unauthorised users access.</li>
                    <li>Modify database records without documentation.</li>
                    <li>Delete financial logs without approval.</li>
                  </ul>
                  <Penalty tone="red">
                    Violations may result in criminal liability.
                  </Penalty>
                </SubSection>
              </PolicySection>

              {/* 6. Payment & Earnings Policy */}
              <PolicySection
                number="6"
                title="Payment & Earnings Policy"
                tone="green"
                icon={<Scale className="w-5 h-5" />}
              >
                <SubSection title="6.1 Freelancer Payments">
                  <ul>
                    <li>Payments are released after client approval or auto-approval window.</li>
                    <li>Earnings are calculated after platform fees and penalties.</li>
                    <li>Withdrawals follow the set schedule (M-Pesa, bank transfer, etc.).</li>
                  </ul>
                </SubSection>

                <SubSection title="6.2 Manager Payments">
                  <p>Managers are paid:</p>
                  <ul>
                    <li>Fixed acceptance fee.</li>
                    <li>Submission fee.</li>
                    <li>Extra-page fee.</li>
                  </ul>
                  <p>Late reviews or low oversight may reduce payouts.</p>
                </SubSection>

                <SubSection title="6.3 Refund Impact">
                  <p>If an order is refunded:</p>
                  <ul>
                    <li>Freelancer payment may be reduced or cancelled depending on fault.</li>
                    <li>Managers may lose management fees.</li>
                    <li>Sensitive cases are handled manually by admin.</li>
                  </ul>
                </SubSection>
              </PolicySection>

              {/* 7. Prohibited Activities */}
              <PolicySection
                number="7"
                title="Prohibited Activities"
                tone="red"
                icon={<AlertTriangle className="w-5 h-5" />}
              >
                <p className="mb-4 font-semibold">
                  The following will result in immediate account deletion:
                </p>

                <SubSection title="7.1 Selling or Transferring Accounts">
                  <p>Strictly prohibited.</p>
                </SubSection>

                <SubSection title="7.2 External Payments">
                  <p>No user may request payment outside the platform:</p>
                  <ul>
                    <li>M-Pesa.</li>
                    <li>WhatsApp.</li>
                    <li>Telegram.</li>
                    <li>Bank transfers.</li>
                  </ul>
                </SubSection>

                <SubSection title="7.3 Cheating the System">
                  <ul>
                    <li>Fake documents.</li>
                    <li>Fake reports.</li>
                    <li>Manipulating payment pages.</li>
                    <li>Creating multiple accounts for earnings or discount abuse.</li>
                  </ul>
                </SubSection>
              </PolicySection>

              {/* 8. Confidentiality & Data Protection */}
              <PolicySection
                number="8"
                title="Confidentiality & Data Protection"
                tone="blue"
                icon={<Lock className="w-5 h-5" />}
              >
                <p>All parties must:</p>
                <ul>
                  <li>Keep order details private.</li>
                  <li>Maintain academic confidentiality.</li>
                  <li>Avoid storing client documents on unsecured devices.</li>
                </ul>
                <Penalty tone="red">
                  Data privacy violations may lead to legal actions.
                </Penalty>
              </PolicySection>

              {/* 9. Violations Matrix */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-500/10 text-red-600 p-3 rounded-lg">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    9. Violations & Consequences Matrix
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left p-3 font-semibold rounded-tl-lg">
                          Violation Type
                        </th>
                        <th className="text-left p-3 font-semibold rounded-tr-lg">
                          Penalty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {violationMatrix.map((row, i) => (
                        <tr
                          key={row.violation}
                          className={
                            i % 2 === 0 ? "bg-muted/30" : "bg-background"
                          }
                        >
                          <td className="p-3 font-medium">{row.violation}</td>
                          <td className="p-3 text-muted-foreground">
                            {row.penalty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 10. Final Clause */}
              <PolicySection
                number="10"
                title="Final Clause"
                tone="blue"
                icon={<CheckCircle className="w-5 h-5" />}
              >
                <p className="text-foreground/90 leading-relaxed">
                  By using the platform, every user agrees to be bound by
                  these policies. TaskLynk reserves the right to update
                  policies at any time to maintain platform integrity, improve
                  service quality, and ensure a secure environment for all
                  users.
                </p>
              </PolicySection>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-[#1a1a2e] to-slate-950 text-white overflow-hidden border-t border-slate-800">
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Need Clarification on a Policy?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Our team is happy to walk you through any policy or report a
                concern. We respond within 5 minutes, 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 py-4 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]"
                >
                  <Link href="/contact">
                    Contact Policy Team
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl px-8 py-4 backdrop-blur-sm transition-colors"
                >
                  <Link href="/privacy">Read Privacy Policy</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-col md:flex-row justify-center gap-6 text-sm text-slate-400">
                <a
                  href="tel:+254701066845"
                  className="flex items-center justify-center gap-2 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />+254 701 066 845
                </a>
                <a
                  href="mailto:tasklynk01@gmail.com"
                  className="flex items-center justify-center gap-2 hover:text-white transition-colors"
                >
                  <MailIcon className="w-4 h-4" />
                  tasklynk01@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
    </ContentPageShell>
  );
}

function PolicySection({
  number,
  title,
  icon,
  tone,
  children,
}: {
  number: string;
  title: string;
  icon: React.ReactNode;
  tone: "blue" | "purple" | "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-green-500/10 text-green-600",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-lg ${toneMap[tone]}`}>{icon}</div>
        <h3 className="text-xl md:text-2xl font-bold">
          {number}. {title}
        </h3>
      </div>
      <div className="space-y-6 text-foreground/90 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_p]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-4 border-primary/30 pl-4">
      <h4 className="font-bold text-lg mb-3 text-foreground">{title}</h4>
      <div className="space-y-3 text-foreground/90 text-sm md:text-base [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_p]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Penalty({
  tone,
  children,
}: {
  tone: "red" | "yellow";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, { bg: string; text: string; label: string }> = {
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-800 dark:text-red-200",
      label: "Penalty",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      text: "text-yellow-800 dark:text-yellow-200",
      label: "Note",
    },
  };
  const t = toneMap[tone];
  return (
    <div
      className={`${t.bg} border-l-4 border-${tone}-500 p-4 my-2 rounded-r-lg`}
    >
      <p className={`${t.text} font-semibold`}>{t.label}:</p>
      <div className={`${t.text} leading-relaxed text-sm`}>{children}</div>
    </div>
  );
}
