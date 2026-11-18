import * as React from "react";
import {
  ContentPageShell,
  generateContentMetadata,
} from "@/components/site/content-page-shell";
import {
  Lock,
  Eye,
  Database,
  Cookie,
  Mail,
  Share2,
  UserCheck,
  Trash2,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/alex/types";

export const metadata = generateContentMetadata(
  "Privacy Policy — TaskLynk Academic Platform",
  "Learn how TaskLynk handles account details, project files, payments, cookies and advertising, and how to exercise your privacy rights in Kenya.",
  "/privacy"
);

const privacySections = [
  {
    id: "alex-chat",
    icon: Mail,
    title: "Alex — TaskLynk AI Assistant",
    items: [
      "Alex is automated AI assistance, not a human employee. It helps you explore published services, prepare a brief and find account, order, quotation and WhatsApp support links. It cannot access private orders or files, take payments, confirm specialist capacity or make binding commitments.",
      "When AI processing is enabled, a limited recent conversation and public service descriptions are sent to an external AI processing service to select relevant listings and follow-up questions. Obvious email addresses, long numbers, links and labelled credentials are redacted before transfer, but automated redaction is imperfect. Do not paste papers, confidential datasets, research participant information, passwords or payment credentials into chat.",
      "TaskLynk does not save chat transcripts in its database or browser storage. Chat is held temporarily in the current tab’s memory, limited to recent messages, and cleared when you reload, use Clear chat, switch accounts, or after approximately 30 minutes of inactivity. The AI processor may retain requests under its own service terms and security obligations. Clearing the interface does not delete records independently held by that processor. Contact us before using chat if you require specific processing-location or retention guarantees.",
      "Chat is not used by TaskLynk to train unrelated systems. AI processing is enabled only after the operator approves the applicable processing terms; third-party handling is governed by those terms and applicable law. You may instead contact our team or use the order form without using Alex’s chat processing.",
      "Optional usage measurement requires your choice in Alex’s settings and can be switched off there. It records aggregate daily event counts, such as chat opens, recommendations, quotation clicks and order creation, not message content, customer identifiers or research data. Reports cover the latest 30 days; older counters are removed when new enabled analytics events are processed. Metrics settings are stored for the browser tab session. Browser Do Not Track preferences are respected.",
      "WhatsApp handover opens a draft for you to review and send. No transcript or files are attached automatically. A summary is included only if you enable sharing and type a summary yourself. Do not include sensitive information. Opening the link does not mean a human has been contacted; WhatsApp processes any message you choose to send under its own terms.",
    ],
  },
  {
    id: "scope",
    icon: Shield,
    title: "Who We Are and What This Policy Covers",
    items: [
      "TaskLynk Academic Solutions (TaskLynk, we, us or our) operates the TaskLynk platform from Nairobi, Kenya. This policy explains how personal information is handled when you browse our website, create an account, request academic support, work as a specialist or editor, or contact our team.",
      "TaskLynk determines how account, platform administration and support information is used. If a client supplies personal information in project materials, the client remains responsible for having a lawful basis to share it; TaskLynk handles that material to provide the requested service and meet applicable obligations.",
      "This notice is written with Kenya’s Data Protection Act, 2019 and applicable regulations in mind. Other privacy laws may give you additional rights where they apply. Reading this policy or browsing the website does not, by itself, constitute consent to optional processing.",
    ],
  },
  {
    id: "information-collected",
    icon: Database,
    title: "Personal Information We Collect",
    items: [
      "Account and profile information: your name, email address, phone or WhatsApp number, profile photo, account role, login credentials in protected form, verification status and account preferences. If you choose an available third-party sign-in option, we receive the account identifiers and profile details shared by that provider.",
      "Specialist and editor information: skills, qualifications, certifications, areas of expertise, portfolio samples, availability, work history, ratings and service-performance records that you provide or generate through platform activity.",
      "Project information: order instructions, subject area, deadlines, uploaded documents, research materials, datasets, drafts, deliverables, revisions, feedback and order-related messages. Files may contain personal information you or another participant include in them.",
      "Financial records: payment and payout phone numbers, transaction references, amounts, payment status, invoices, refunds, withdrawal requests and account balances. Do not send us M-Pesa PINs, banking passwords, card security codes or one-time payment codes.",
      "Communications and technical information: contact-form submissions, support conversations, notifications, IP addresses, browser and device information, login times, security events and diagnostic records associated with your use of the service. Cookies and local storage are explained separately below.",
    ],
  },
  {
    id: "information-sources",
    icon: Eye,
    title: "Where Information Comes From",
    items: [
      "Most information comes directly from you when you register, update a profile, submit an order, upload a file, make a payment or contact us. Some technical information is generated automatically when your browser connects to the platform.",
      "We also receive information from people involved in your order, such as assigned specialists, editors and managers, and from payment, authentication, hosting and communication providers that support the service.",
      "Information needed to create an account, fulfil an order or verify a payment is necessary for those features to work. Optional profile details can be omitted. If required information is not provided, we may be unable to provide the relevant service.",
    ],
  },
  {
    id: "purposes-and-legal-bases",
    icon: UserCheck,
    title: "Why We Use Information and Our Legal Bases",
    items: [
      "Providing the service: we use account, project and communication details to register users, assess applications, assign work, coordinate reviews and revisions, deliver files, answer questions and administer payments. The basis is taking steps at your request before a contract or performing our agreement with you, as applicable.",
      "Security and service administration: we use relevant activity and transaction records to investigate misuse, prevent fraud, troubleshoot problems, maintain service reliability and resolve disputes. Where applicable, we rely on legitimate interests balanced against your rights and reasonable expectations.",
      "Legal obligations: we may process and retain records needed for accounting, tax, lawful requests, regulatory requirements and other duties imposed by applicable law.",
      "Consent: where required, we rely on a separate choice for optional marketing, non-essential cookies or other optional processing. You can withdraw consent for future processing without affecting processing that was lawful before withdrawal. A new, incompatible purpose requires an appropriate legal basis and notice.",
    ],
  },
  {
    id: "project-confidentiality",
    icon: Lock,
    title: "Project Files, Research Data and Confidentiality",
    items: [
      "Project materials are used to deliver and administer the requested work, including allocation, editing, review, revisions and dispute resolution. Relevant staff and assigned contributors may need access to instructions, messages and files to complete these tasks.",
      "Remove unnecessary identifiers before uploading documents, including student numbers, signatures, participant names and contact details. Anonymise research datasets wherever possible, and do not upload another person’s information unless you are authorised to share it for the intended purpose.",
      "Avoid uploading health records, biometric data or other sensitive personal information unless it is necessary and you have first discussed appropriate handling with us. Ethical approval for research does not automatically authorise disclosure of identifiable participant data to a service provider.",
      "If a project requires an external review or specialist tool that would receive identifiable or confidential material, ask us to clarify the recipient and handling arrangements before submission. Do not assume that files are automatically excluded from an external provider’s retention or repository rules.",
    ],
  },
  {
    id: "sharing",
    icon: Share2,
    title: "Who May Receive Your Information",
    items: [
      "Service participants: authorised administrators, managers, assigned specialists and editors may receive information relevant to their role in account support, order fulfilment, review or payment administration.",
      "Service providers: hosting, database, file-storage, authentication, email, SMS, support and payment providers may process information needed to operate their services for TaskLynk. M-Pesa payments involve the relevant mobile-money provider and transaction information needed for verification, reconciliation, refunds or payouts.",
      "Advertising providers: Google and its partners may receive browser, device and advertising information through advertising technology on the website. See the cookies and advertising section for details and choices; this is separate from access to your project files.",
      "Legal and business circumstances: relevant information may be disclosed to comply with a lawful request, protect rights or safety, investigate suspected fraud, obtain professional advice or handle a business restructuring or transfer, subject to applicable safeguards and notice requirements.",
      "Do not treat a public profile, a shared file link or information sent to another participant as a private support channel. Share only what is needed, and contact us if you believe information has been disclosed inappropriately.",
    ],
  },
  {
    id: "cookies-advertising",
    icon: Cookie,
    title: "Cookies, Local Storage and Google Advertising",
    items: [
      "Essential browser storage supports functions such as signing in, maintaining sessions and remembering interface preferences. Some authentication information and preferences may be stored in local storage, which remains on your device until cleared or removed by the application.",
      "The website includes Google AdSense advertising technology. Third-party vendors, including Google, use cookies to serve ads based on a user’s previous visits to this website or other websites. Google’s advertising cookies enable Google and its partners to serve ads based on visits to this site and other sites on the Internet.",
      "Advertising technologies may process IP addresses, cookie or device identifiers, browser details and interactions with ads. Depending on your location, consent choices and provider settings, ads may be personalised or non-personalised. Non-personalised advertising can still use storage for functions such as fraud prevention and frequency limits.",
      "You can manage personalised Google advertising through Google’s Ads Settings, use available third-party advertising opt-out tools, and block or delete cookies through your browser. Clearing cookies does not necessarily clear local storage; use your browser’s site-data controls for both. Blocking essential storage may prevent sign-in or other features from working.",
      "Where applicable law requires consent for non-essential technology, that consent must be obtained separately. This policy is a disclosure, not a cookie-consent control, and does not itself switch advertising or tracking on or off.",
    ],
  },
  {
    id: "communications",
    icon: Mail,
    title: "Service Messages and Marketing Choices",
    items: [
      "We use your contact details for account verification, security alerts, order updates, invoices, payment queries and responses to support requests. These messages are connected to operating your account or delivering a service and are separate from promotional communications.",
      "If you receive optional promotions, you can use any unsubscribe instructions provided or contact us to ask that they stop. Withdrawing marketing consent does not stop necessary account, transaction or security messages.",
      "If you contact us through WhatsApp, email or another external service, that service also handles information under its own privacy terms. Avoid sending passwords, payment codes or unnecessary sensitive documents through these channels.",
    ],
  },
  {
    id: "international-transfers",
    icon: Share2,
    title: "Storage Locations and International Transfers",
    items: [
      "TaskLynk operates from Kenya, but infrastructure, communication, advertising and other service providers may store or access information in other countries. Working with a contributor outside Kenya may also involve cross-border access to relevant project information.",
      "International transfers must have a lawful basis and the safeguards required by applicable Kenyan data protection law. Depending on the transfer, these may include appropriate contractual or other safeguards, a legally permitted necessity, or informed consent where required. Sensitive personal information requires particular care.",
      "Contact us before submitting location-restricted or sensitive research data if you need details about the providers, processing locations or safeguards relevant to your project. Do not assume that all platform data is hosted exclusively in Kenya.",
    ],
  },
  {
    id: "retention-deletion",
    icon: Trash2,
    title: "How Long We Keep Information and Deletion Requests",
    items: [
      "Retention depends on the information and why it is needed. Account and profile records support your account; project files and messages support delivery, revisions and dispute handling; transaction records support reconciliation, accounting and legal obligations; security logs support incident investigation and misuse prevention.",
      "There is no single retention period for every category. Relevant factors include whether your account or order is active, outstanding payments, contractual commitments, legal record-keeping requirements and unresolved claims. Information should be deleted or anonymised when it is no longer needed for a lawful purpose.",
      "You can request account closure or deletion of specific information by contacting us. Deletion is not unconditional: some records may need to be retained for legal duties, fraud prevention or the establishment, exercise or defence of claims. We will explain applicable limits when handling your request.",
      "Removal from active systems may not immediately remove copies in backups or records independently held by payment providers or other recipients. Where backup copies remain, they should be protected and removed through the applicable backup lifecycle, subject to legal retention needs.",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security and Incident Handling",
    items: [
      "We use technical and organisational measures intended to reduce unauthorised access and misuse, including authenticated access, role-based permissions and protected credentials. Protection also depends on the relevant infrastructure and storage configuration; no website or transmission method can guarantee absolute security.",
      "Use a unique password, enable available account-security features, keep your device secure and sign out of shared devices. Treat file links as confidential and do not share credentials or verification codes with anyone claiming to represent TaskLynk.",
      "Report suspected account compromise, exposed files or other privacy incidents promptly using the contact details below. We will assess reported incidents and make notifications to affected people and the relevant authority where required by applicable law.",
    ],
  },
  {
    id: "privacy-rights",
    icon: UserCheck,
    title: "Your Privacy Rights",
    items: [
      "Subject to applicable law, you may ask to be informed about how your information is used, access your personal information, correct inaccurate or misleading information, object to processing, and request deletion of information that should no longer be held.",
      "Where applicable, you may also request restriction of processing, a portable copy of information, withdrawal of consent, or review of a decision based solely on automated processing that has a legal or similarly significant effect. Contact us if you believe an account, application or payment decision needs human review.",
      "Send requests to tasklynk01@gmail.com with the subject ‘Privacy request’, your account email and a description of the information or right involved. We may ask for proportionate identity or authority verification to avoid disclosing information to the wrong person. Do not send identity documents unless requested through an appropriate channel.",
      "We will handle requests within the period required by applicable law and explain any permitted limitation, refusal or extension. You may complain directly to Kenya’s Office of the Data Protection Commissioner (ODPC); you do not have to contact TaskLynk first to exercise that right.",
    ],
  },
  {
    id: "children",
    icon: UserCheck,
    title: "Children and Young Users",
    items: [
      "The platform is intended for adult clients and contributors, not for children to create independent accounts. If a service involves a person under 18, contact us before providing their personal information so that lawful authority, parental or guardian consent where required, and appropriate safeguards can be assessed.",
      "If you believe a child has supplied personal information without appropriate authorisation, notify us. We will review the report and take appropriate action, including restricting processing or deleting information where required.",
    ],
  },
  {
    id: "external-services",
    icon: Eye,
    title: "Links and Third-Party Services",
    items: [
      "Our website may link to payment services, social media, external resources or other providers. Their collection and use of information is governed by their own privacy notices. A link does not mean TaskLynk controls or guarantees that provider’s privacy practices.",
      "Review the relevant provider’s terms before submitting information, authorising access or following an advertising link. Contact us if you are unsure whether a request or payment destination genuinely belongs to TaskLynk.",
    ],
  },
  {
    id: "policy-updates",
    icon: Database,
    title: "Changes to This Policy",
    items: [
      "We may update this notice when our services, providers or legal obligations change. The date at the top identifies the latest revision. Material changes will be communicated through appropriate channels where required, and any newly required consent will be requested separately.",
      "Check this page periodically and contact us if you need clarification about a change or how it affects information you previously supplied.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <ContentPageShell>
      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#EEE5F8] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#1D1533] border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#EFE8F8]/80 dark:bg-[#271E42]/40 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#FF7A3D]/8 dark:bg-[#FF7A3D]/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
            Privacy <span className="text-[#FF7A3D]">Policy</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
            Understand what <strong>TaskLynk</strong> collects, why we use it, who may receive it, and the choices you have about your personal information.
          </p>
          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 mt-3 font-semibold">
            Last updated: <time dateTime="2026-10-29">October 29, 2026</time>
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="py-20 sm:py-28 bg-white dark:bg-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="linen-card p-8 sm:p-10 rounded-3xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white mb-4">
                Our Promise in Plain English
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                We use account details, project materials, communications and payment records to operate TaskLynk and deliver your requested services. Assigned contributors and service providers may process relevant information. Our website also includes Google advertising technology. This policy explains those activities, the limits of deletion, and how to ask questions or exercise your rights.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: <Shield className="w-5 h-5 text-[#FF7A3D]" />,
                  title: "Project Confidentiality",
                  desc: "Understand access to your files",
                },
                {
                  icon: <Eye className="w-5 h-5 text-[#5B3594] dark:text-[#EFE8F8]" />,
                  title: "Transparent Data Use",
                  desc: "Including cookies and advertising",
                },
                {
                  icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
                  title: "Privacy Choices",
                  desc: "Access, correction and deletion requests",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="linen-card p-6 rounded-2xl flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#22183D] dark:text-white">{item.title}</p>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <nav aria-label="Privacy policy contents" className="mt-10">
              <h2 className="text-xl font-black text-[#22183D] dark:text-white mb-4">Find What You Need</h2>
              <ol className="grid sm:grid-cols-2 gap-3 text-sm">
                {privacySections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="inline-block rounded-md text-[#5B3594] dark:text-[#EFE8F8] underline underline-offset-4 hover:text-[#FF7A3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                      {index + 1}. {section.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#privacy-contact" className="inline-block rounded-md text-[#5B3594] dark:text-[#EFE8F8] underline underline-offset-4 hover:text-[#FF7A3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                    {privacySections.length + 1}. Contact and Useful Privacy Resources
                  </a>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-20 sm:py-28 bg-[#FAF8FD] dark:bg-[#140E24]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {privacySections.map((section, index) => (
              <PrivacyCard
                key={section.id}
                id={section.id}
                icon={<section.icon aria-hidden="true" className="w-5 h-5 text-[#FF7A3D]" />}
                number={String(index + 1)}
                title={section.title}
                items={section.items}
              />
            ))}

            <section id="privacy-contact" aria-labelledby="privacy-contact-heading" className="linen-card p-8 sm:p-10 rounded-3xl scroll-mt-32">
              <h2 id="privacy-contact-heading" className="text-2xl font-black text-[#22183D] dark:text-white mb-5">{privacySections.length + 1}. Contact and Useful Privacy Resources</h2>
              <div className="space-y-4 text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                <p>For privacy questions, access requests, corrections, deletion requests or incident reports, contact TaskLynk Academic Solutions, Nairobi, Kenya.</p>
                <p>Email: <a href="mailto:tasklynk01@gmail.com?subject=Privacy%20request" className="text-[#5B3594] dark:text-[#EFE8F8] underline underline-offset-4 break-all">tasklynk01@gmail.com</a>. You can also use our <Link href="/contact" className="underline underline-offset-4">contact page</Link>. Include your account email and a brief description, but not your password or payment PIN.</p>
                <ul className="list-disc pl-5 space-y-3 marker:text-[#FF7A3D]">
                  <li><a href="https://www.odpc.go.ke/file-a-complaint/" className="underline underline-offset-4">Kenya ODPC: file a data protection complaint</a></li>
                  <li><a href="https://myadcenter.google.com/" className="underline underline-offset-4">Google Ads Settings: manage personalised advertising</a></li>
                  <li><a href="https://policies.google.com/technologies/partner-sites" className="underline underline-offset-4">How Google uses information from sites that use its services</a></li>
                  <li><a href="https://www.aboutads.info/choices/" className="underline underline-offset-4">Choices for participating third-party advertising providers</a></li>
                </ul>
              </div>
            </section>
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
              Questions About Your Privacy?
            </h2>
            <p className="text-base md:text-lg text-[#DDD3E9]/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your paper and project materials are handled confidentially for service delivery under this policy. Create a client account to submit your brief and files through the order form, or ask our team about confidentiality on WhatsApp. Avoid sending sensitive research data in chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/client" className="inline-flex items-center justify-center gap-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black px-8 py-4 rounded-2xl">
                Create Account &amp; Start an Order
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-2xl">
                Ask Our Team on WhatsApp
              </a>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black px-9 py-4 rounded-2xl text-base shadow-xl shadow-[#FF7A3D]/25 transition-all hover:scale-105"
              >
                Contact Privacy Team
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:bg-white/10"
              >
                Read Terms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ContentPageShell>
  );
}

function PrivacyCard({
  id,
  icon,
  number,
  title,
  items,
}: {
  id: string;
  icon: React.ReactNode;
  number: string;
  title: string;
  items: string[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="linen-card p-8 sm:p-10 rounded-3xl scroll-mt-32">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] flex items-center justify-center">
          {icon}
        </div>
        <h2 id={`${id}-heading`} className="text-2xl font-black text-[#22183D] dark:text-white">
          {number}. {title}
        </h2>
      </div>
      <ul className="space-y-3 text-[#6B627A] dark:text-[#DDD3E9]/90 text-sm sm:text-base">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

