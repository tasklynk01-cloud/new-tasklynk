"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  GraduationCap,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Check,
  Cloud,
  Cpu,
  Server,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";

interface ServiceItemData {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  samplePreview: {
    type: string;
    title: string;
    model: string;
    hypothesisResult: string;
    turnaround: string;
    rate: string;
  };
  ctaUrl: string;
  isExternal?: boolean;
}

const SERVICES_DATA: ServiceItemData[] = [
  {
    id: "data-analysis",
    label: "SPSS & Data Analysis",
    icon: BarChart3,
    badge: "Flagship Specialty",
    title: "SPSS, R, Python & Quantitative Data Modeling",
    subtitle: "From raw datasets to defensible Chapter 4 & 5 dissertation writeups",
    description:
      "Our verified statisticians handle full data cleaning, normality testing, Multiple Regression, ANOVA, Chi-Square, factor analysis, and structural equation modeling (SEM). You receive clean SPSS syntax (.sps), dataset files (.sav), and publication-formatted APA tables.",
    deliverables: [
      "SPSS Syntax & Cleaned Data Files (.sav)",
      "APA 7th Formatted Output Tables & Figures",
      "Defensible Interpretation & Hypothesis Testing",
      "Free Revisions & Defense Clarification Notes",
    ],
    samplePreview: {
      type: "spss",
      title: "Model Summary (Regression Analysis)",
      model: "R: 0.884 | R²: 0.781 | Adjusted R²: 0.776 | F(3, 142) = 168.4, p < .001",
      hypothesisResult: "H1 Accepted: Significant predictor of academic performance (β = .412, p = .002)",
      turnaround: "From 12 Hours",
      rate: "From KSh 350 / section",
    },
    ctaUrl: "/register/client?service=data-analysis",
    isExternal: false,
  },
  {
    id: "academic-writing",
    label: "Academic Essays",
    icon: BookOpen,
    badge: "High Demand",
    title: "Custom Essays, Term Papers & Coursework",
    subtitle: "Written to strict university grading rubrics with zero AI hallucination",
    description:
      "Original research papers, critical essays, and literature reviews authored by human specialists across 40+ disciplines. Every paper comes with an official Turnitin similarity report, full scholarly citations, and formatting in your required style.",
    deliverables: [
      "100% Original Content + Turnitin Verification",
      "APA 7th, MLA 9th, Harvard, or Chicago Referencing",
      "Free Title Page, Outline, and Abstract",
      "Unlimited Free Revisions within 14 Days",
    ],
    samplePreview: {
      type: "paper",
      title: "Authentic Scholarly Referencing",
      model: "Peer-reviewed sources from 2020–2026 (Scopus, JSTOR, PubMed, ScienceDirect)",
      hypothesisResult: "Turnitin Similarity Index: 0% • AI Detection: 0%",
      turnaround: "From 3 Hours",
      rate: "From KSh 220 / page",
    },
    ctaUrl: "/register/client?service=academic-writing",
    isExternal: false,
  },
  {
    id: "thesis",
    label: "Thesis & Dissertations",
    icon: GraduationCap,
    badge: "Postgraduate",
    title: "Milestone-Driven Thesis & Dissertation Support",
    subtitle: "Complete chapter-by-chapter guidance for Master’s & PhD candidates",
    description:
      "Structured support across all 5 standard academic chapters: Chapter 1 (Introduction & Problem Statement), Chapter 2 (Literature Review & Conceptual Framework), Chapter 3 (Methodology & Sampling), Chapter 4 (Data Findings), and Chapter 5 (Recommendations & Discussion).",
    deliverables: [
      "Concept Note & Proposal Defense Preparation",
      "Methodology Design & Tool Reliability (Cronbach's Alpha)",
      "Comprehensive 50+ Source Literature Synthesis",
      "Dedicated Senior Academic Project Lead",
    ],
    samplePreview: {
      type: "thesis",
      title: "Milestone Progression Tracker",
      model: "Chapter 1-3 Proposal Approved -> Ethical Review -> Data Collection -> Chapter 4-5 Writeup",
      hypothesisResult: "Guided by certified Kenyan PhD and Master's editors",
      turnaround: "Milestone Delivery",
      rate: "Custom Project Pricing",
    },
    ctaUrl: "/register/client?service=thesis",
    isExternal: false,
  },
  {
    id: "cloud-ops",
    label: "Enterprise Cloud & DevOps",
    icon: Cloud,
    badge: "app.tasklynk.co.ke",
    title: "Enterprise Cloud Migration, Architecture & DevOps",
    subtitle: "High-availability cloud infrastructure, Docker, Kubernetes & automated CI/CD pipelines",
    description:
      "Full cloud transformation from monolithic architectures to resilient multi-region cloud services. Hosted and managed on our enterprise infrastructure with Terraform IaC, AWS/GCP/Cloudflare setup, and 99.99% SLA uptime monitoring.",
    deliverables: [
      "Production Cloud Architecture & Terraform IaC",
      "Zero-Downtime Migration & Database Replication",
      "Automated CI/CD Deployment Telemetry",
      "24/7 SLA Health & Security Auditing",
    ],
    samplePreview: {
      type: "cloud",
      title: "Cloud Infrastructure Health Telemetry",
      model: "Multi-Region Cluster | 99.99% Uptime SLA | Latency: <24ms | TLS 1.3 Strict",
      hypothesisResult: "Hosted on app.tasklynk.co.ke • Auto-scaling active • ISO-27001 compliant",
      turnaround: "SLA Dedicated",
      rate: "From KSh 180,000 / setup",
    },
    ctaUrl: "https://app.tasklynk.co.ke",
    isExternal: true,
  },
  {
    id: "ai-automation",
    label: "AI Business Automation",
    icon: Cpu,
    badge: "app.tasklynk.co.ke",
    title: "AI-Powered Business Process Automation & Custom Agents",
    subtitle: "Replace manual workflows with 80% automated autonomous pipelines",
    description:
      "End-to-end business automation audit and custom agent engineering. Integrates smart document processing, automated customer lifecycle routing, real-time analytics, and API orchestrations on the enterprise operating system.",
    deliverables: [
      "Custom AI Agent Orchestration & Logic Workflows",
      "Enterprise CRM, ERP & Billing API Integrations",
      "Automated Event -> Action Trigger Matrices",
      "Staff Onboarding & Operational Runbooks",
    ],
    samplePreview: {
      type: "automation",
      title: "Autonomous Agent Execution Pipeline",
      model: "Event: OrderInvoiced -> Trigger: VerificationCheck -> Action: AutoDispatch",
      hypothesisResult: "Autonomous engine live on app.tasklynk.co.ke • 0 Manual Intervention",
      turnaround: "From 48 Hours",
      rate: "From KSh 120,000 / project",
    },
    ctaUrl: "https://app.tasklynk.co.ke",
    isExternal: true,
  },
  {
    id: "managed-it",
    label: "Managed IT & Security",
    icon: Server,
    badge: "app.tasklynk.co.ke",
    title: "24/7 Managed IT Support & Security Infrastructure",
    subtitle: "Tier-3 engineer desk, automated threat detection, and disaster recovery",
    description:
      "Continuous monitoring, automated backups, encrypted vault storage, and instant remote incident response for modern enterprises, research institutes, and technology businesses in Kenya.",
    deliverables: [
      "24/7 Tier-3 Helpdesk & Dedicated Incident Lead",
      "Real-Time Vulnerability Scanning & Patching",
      "Automated Encrypted Offsite Backup Systems",
      "Enterprise Compliance & Penetration Testing Reports",
    ],
    samplePreview: {
      type: "security",
      title: "Security Telemetry & Threat Defense",
      model: "AES-256 GCM Encryption | Zero-Trust Access | Automated SOC Telemetry",
      hypothesisResult: "All endpoints verified on app.tasklynk.co.ke • Active 24/7 SLA",
      turnaround: "Instant 24/7 Response",
      rate: "From KSh 95,000 / month",
    },
    ctaUrl: "https://app.tasklynk.co.ke",
    isExternal: true,
  },
  {
    id: "business",
    label: "Business & Pitch Decks",
    icon: Building2,
    badge: "Corporate & SME",
    title: "Bank-Ready Business Plans & Feasibility Studies",
    subtitle: "Financial forecast models, market studies, and pitch presentations",
    description:
      "Bank-grade business documentation for startups, entrepreneurs, and established enterprises in Kenya. Includes 5-year pro-forma financial projections (P&L, Cash Flow, Balance Sheet, Break-even analysis) and executive investor slide decks.",
    deliverables: [
      "5-Year Financial Modeling & Sensitivity Analysis",
      "Market Sizing (TAM/SAM/SOM) & Competitor Matrix",
      "Executive Pitch Deck in Editable PowerPoint (.pptx)",
      "Tailored for Kenyan Banks, VCs, and Angel Investors",
    ],
    samplePreview: {
      type: "business",
      title: "5-Year Financial Pro-Forma",
      model: "Year 1-5 Revenue Growth Model | IRR: 34.2% | Payback: 2.1 Years",
      hypothesisResult: "Bank & Investor Compliant Financial Model",
      turnaround: "From 24 Hours",
      rate: "From KSh 5,000 / project",
    },
    ctaUrl: "/register/client?service=business-plans",
    isExternal: false,
  },
];

export function InteractiveServicesPreview() {
  const [activeTabId, setActiveTabId] = useState("data-analysis");
  const activeService = SERVICES_DATA.find((s) => s.id === activeTabId) || SERVICES_DATA[0];

  return (
    <div className="w-full">
      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 pb-4 overflow-x-auto no-scrollbar mb-6">
        {SERVICES_DATA.map((service) => {
          const ServiceIcon = service.icon;
          const isActive = service.id === activeTabId;
          return (
            <button
              key={service.id}
              onClick={() => setActiveTabId(service.id)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#5B3A8C] text-white shadow-lg shadow-[#5B3A8C]/25 scale-105"
                  : "linen-card text-[#241B3F] dark:text-[#F8F5FC] hover:border-[#5B3A8C]"
              }`}
            >
              <ServiceIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#FF7A3D]"}`} />
              <span>{service.label}</span>
              {service.isExternal && (
                <span className="text-[9px] px-1.5 py-0.5 bg-[#FF7A3D]/20 text-[#FF7A3D] rounded font-bold">
                  APP
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Interactive Stage */}
      <div className="linen-card rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-300">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Service Overview & Deliverables */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5B3A8C] dark:text-[#EEE7FA] bg-[#EEE7FA]/80 dark:bg-[#271E42]/80 px-3 py-1 rounded-full border border-[#DDD5E8]/60 dark:border-[#3A2F5B]">
                {activeService.badge}
              </span>
              <span className="text-xs text-[#6F687A] dark:text-[#DDD5E8]/70 font-semibold">
                ⏱ {activeService.samplePreview.turnaround}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#241B3F] dark:text-white tracking-tight leading-tight">
              {activeService.title}
            </h3>

            <p className="text-sm font-bold text-[#FF7A3D]">
              {activeService.subtitle}
            </p>

            <p className="text-xs sm:text-sm text-[#6F687A] dark:text-[#DDD5E8]/90 leading-relaxed">
              {activeService.description}
            </p>

            {/* Deliverables Checklist */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#241B3F] dark:text-white mb-2.5">
                Key Deliverables Included:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#241B3F]/90 dark:text-[#F8F5FC]/90">
                {activeService.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 font-bold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              {activeService.isExternal ? (
                <Button asChild size="default" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-6 shadow-md shadow-[#FF7A3D]/25">
                  <a href={activeService.ctaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <span>Explore on app.tasklynk.co.ke</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              ) : (
                <Button asChild size="default" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-6 shadow-md shadow-[#FF7A3D]/25">
                  <Link href={activeService.ctaUrl} className="flex items-center gap-1.5">
                    <span>Order {activeService.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}
              <span className="text-xs font-bold text-[#241B3F] dark:text-[#F8F5FC]">
                {activeService.samplePreview.rate}
              </span>
            </div>
          </div>

          {/* Right: Live Interactive Output Console with Purple 3D Waves */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#2E1065] via-[#3B0764] to-[#1E0538] text-[#F8F5FC] p-5 sm:p-6 border border-[#7C3AED]/50 shadow-2xl space-y-4">
              {/* Active 3D Glowing Purple Silk Wave Engine Embedded directly inside the card */}
              <StripeGradientMesh
                mode="purple-section"
                heightClass="h-full"
                className="inset-0 opacity-85 pointer-events-none rounded-2xl"
              />

              {/* Radiant Flare */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#FF6B00]/25 blur-2xl -z-0" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/40 text-xs">
                  <span className="font-mono text-[#FFA06E] font-bold flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-[#FF7A3D]" />
                    {activeService.samplePreview.title}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    VERIFIED OUTPUT
                  </span>
                </div>

                {/* Console Code / Output Box */}
                <div className="bg-[#140827]/80 backdrop-blur-md rounded-xl p-3.5 font-mono text-[11px] sm:text-xs text-[#DDD5E8] border border-[#7C3AED]/30 space-y-2 leading-relaxed">
                  <p className="text-[#FFA06E] font-semibold">
                    &gt; {activeService.samplePreview.model}
                  </p>
                  <p className="text-[#DDD5E8]/85">
                    {activeService.samplePreview.hypothesisResult}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#7C3AED]/25 border border-[#7C3AED]/40 flex items-center gap-2.5 text-xs text-[#EEE7FA]">
                  <ShieldCheck className="w-5 h-5 text-[#FFA06E] shrink-0" />
                  <span>
                    {activeService.isExternal 
                      ? "Powered by TaskLynk Digital OS on app.tasklynk.co.ke"
                      : "Audited by certified human editors with 100% milestone protection"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
