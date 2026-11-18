/**
 * Public, read-only knowledge base for Alex (TaskLynk AI Assistant).
 * Strictly excludes any database access, personal user records, or private specialist profiles.
 */

export const TASKLYNK_PUBLIC_KNOWLEDGE = {
  platform: {
    name: "TaskLynk",
    tagline: "Kenya's Managed Professional Services Platform",
    positioning:
      "One company. Multiple services. Professional results. TaskLynk brings diverse professional expertise together under one roof—managed end-to-end with dedicated project managers, quality assurance, and escrow protection.",
    websites: {
      main: "https://www.tasklynk.co.ke",
      app: "https://app.tasklynk.co.ke",
    },
    support: {
      phone: "+254 701 066 845",
      email: "tasklynk01@gmail.com",
      whatsapp: "https://wa.me/254701066845",
      hours: "24/7 Support",
      location: "Nairobi, Kenya",
    },
  },

  serviceCategories: [
    {
      id: "website-development",
      name: "Website and Web Development",
      href: "/services#website-development",
      offers: [
        "Business websites and corporate portals",
        "High-converting landing pages",
        "E-commerce websites and payment integration",
        "Custom web applications (frontend and backend)",
        "Website maintenance, speed optimization, and updates",
      ],
      briefTips: "Share website type, approximate page count, required functionality, preferred tech stack, and domain/hosting status.",
    },
    {
      id: "software-integration",
      name: "Software and Systems Integration",
      href: "/services#software-integration",
      offers: [
        "API integration and third-party webhooks",
        "Database configuration and optimization",
        "Software troubleshooting and bug resolution",
        "Business system integration and workflow automation",
        "Technical support",
      ],
      briefTips: "Specify the systems/APIs involved, desired automation or integration outcome, and environment details.",
    },
    {
      id: "data-analytics",
      name: "Data Analytics and Statistics",
      href: "/services#data-analytics",
      offers: [
        "Statistical analysis (descriptive, hypothesis testing, ANOVA, regression, factor analysis, SEM, time series)",
        "SPSS, R, Stata, Python, Jamovi, and SmartPLS analysis",
        "Excel quantitative analysis and financial modeling",
        "Power BI interactive dashboards",
        "Plain-language data interpretation and visualization",
      ],
      briefTips: "State dataset availability, preferred software, research/business objectives, and required outputs.",
    },
    {
      id: "data-processing",
      name: "Data Processing and Office Productivity",
      href: "/services#data-processing",
      offers: [
        "Accurate data entry and dataset structuring",
        "Data cleaning and deduplication",
        "Excel formatting, formulas, and pivot tables",
        "Word document formatting and styling",
        "PowerPoint presentations and document conversion",
      ],
    },
    {
      id: "graphic-design",
      name: "Graphic Design and Branding",
      href: "/services#graphic-design",
      offers: [
        "Logo design and complete brand identity kits",
        "Brochures, flyers, posters, and banners",
        "Corporate business profiles and pitch decks",
        "Social media and marketing graphics",
      ],
      briefTips: "Include design type, dimensions, required file formats (PDF, PNG, SVG, AI), and any brand guidelines.",
    },
    {
      id: "video-production",
      name: "Video Production and Editing",
      href: "/services#video-production",
      offers: [
        "Promotional and corporate videos",
        "Social media reels and short-form edits",
        "Professional video editing and color grading",
        "Subtitles, captions, animation, and motion graphics",
      ],
      briefTips: "Share target duration, source footage availability, output format, and editing style.",
    },
    {
      id: "business-admin",
      name: "Business Administration and Virtual Assistance",
      href: "/services#business-admin",
      offers: [
        "Administrative assistance and inbox/calendar management",
        "Document management and SOP preparation",
        "CRM support and customer follow-up coordination",
        "Project coordination, scheduling, and virtual assistance",
      ],
    },
    {
      id: "accounting-finance",
      name: "Accounting and Financial Support",
      href: "/services#accounting-finance",
      offers: [
        "Bookkeeping and ledger maintenance",
        "Bank and account reconciliation",
        "Financial reporting and statements",
        "Payroll support and financial documentation",
      ],
    },
    {
      id: "research-intelligence",
      name: "Research and Business Intelligence",
      href: "/services#research-intelligence",
      offers: [
        "Market research and consumer insights",
        "Competitor analysis and benchmarking",
        "Business intelligence and industry reports",
        "Feasibility studies and business plans",
      ],
    },
    {
      id: "professional-writing",
      name: "Professional Writing, Editing and Presentations",
      href: "/services#professional-writing",
      offers: [
        "Technical writing and documentation",
        "Business reports, proposals, and company profiles",
        "Professional editing and proofreading",
        "Executive presentations and CVs/resumes",
      ],
    },
    {
      id: "academic-writing",
      name: "Academic Writing and Research Support",
      href: "/services#academic-writing",
      offers: [
        "Essays, research papers, and literature reviews",
        "Thesis & dissertation support (proposals, methodology consultation, Chapter 4 interpretation, viva prep)",
        "Formatting & referencing (APA 7th, MLA 9th, Harvard, Chicago)",
        "Plagiarism/similarity verification and proofreading",
      ],
    },
  ],

  customServices:
    "If a client needs something outside the 11 listed categories, TaskLynk accepts custom service requests through the order form (/client/new-job) or via WhatsApp support so a project manager can scope and match it.",

  specialists: {
    model:
      "TaskLynk specialists are vetted members of the TaskLynk professional team—not independent marketplace freelancers operating separate businesses. TaskLynk owns the customer relationship, manages assignments, supervises delivery, and remains accountable for quality.",
    whatTheyDo: [
      "Web & Software Engineers: build websites, web apps, APIs, databases, and workflow automations.",
      "Data Analysts & Statisticians: clean datasets, run statistical tests in SPSS/R/Stata/Python/Excel, and build Power BI dashboards with clear interpretation.",
      "Graphic Designers & Video Editors: craft logos, brand identities, business profiles, marketing visuals, promotional videos, subtitles, and motion graphics.",
      "Business & Finance Specialists: provide virtual assistance, CRM/project coordination, bookkeeping, reconciliation, payroll support, and financial reporting.",
      "Researchers, Writers & Editors: conduct market/competitor research, feasibility studies, technical & business writing, proposals, academic support, and senior editorial QA.",
    ],
    vettingAndPrivacy: [
      "Applicants (including qualified professionals, graduates, and trained specialists) register at /register/freelancer and undergo credential/skill verification and administrator approval before their profile can appear in the public directory (/professionals).",
      "Specialist personal contact details (phone numbers, personal emails, private identities) are strictly confidential and never shared with customers or the public.",
      "All project communication, files, and payments are managed securely through TaskLynk—direct customer-to-specialist off-platform transactions are prohibited.",
    ],
  },

  workflowAndPricing: {
    steps: [
      "1. Submit Order Brief (/client/new-job): Choose your service category, enter project title, instructions, deadline, and category-specific requirements, and attach reference files.",
      "2. Scope, Pricing & Acceptance: Review transparent pricing or receive a manager-verified quotation before work starts.",
      "3. Dedicated Manager & Specialist Assignment: A TaskLynk project manager audits the brief and assigns a qualified specialist.",
      "4. Execution & Quality Assurance: Work progresses with milestone tracking and passes through senior editorial/QA review.",
      "5. Delivery & Revisions: Download deliverables from your portal and request free revisions (within 14 days) if adjustments are needed within the original brief.",
    ],
    pricing: [
      "Academic tiers use transparent per-page rates (~275 words/page): College/High School KSh 220, Undergraduate KSh 250, Master's KSh 320, PhD/Technical & SPSS KSh 420 (check /pricing for estimator).",
      "Published catalogue services show fixed or starting-from KSh prices; complex technical, web, design, video, analytics, and business engagements are quoted by a project manager based on scope, outputs, and deadline.",
      "Payments are escrow-protected on the platform (M-Pesa / supported payment methods).",
    ],
  },

  policies: {
    qualityAndConduct: [
      "Zero tolerance for plagiarism or unverified AI misuse on writing deliverables; strict deadline accountability.",
      "Free revisions within 14 days for work that needs adjustments against the original instructions.",
      "Refunds and disputes are reviewed fairly by administration under the Quality & Refund Policy (/policy).",
      "Strict prohibition on harassment, fraud, duplicate accounts, or unapproved external/off-platform payments.",
    ],
    privacyAndConfidentiality: [
      "Client briefs, papers, and datasets are treated as confidential and accessible only to authorized staff (the assigned project manager, editor, and specialist) for delivery and support (/privacy).",
      "Never paste passwords, API secrets, raw personal identifiers, or confidential documents into the Alex chat—upload project files securely inside the client order portal (/client/new-job).",
      "Alex has zero access to the database, private user accounts, orders, or personal specialist profiles.",
    ],
  },

  publicPages: [
    { name: "Services Directory", href: "/services" },
    { name: "Public Professionals Directory", href: "/professionals" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Pricing & Calculator", href: "/pricing" },
    { name: "About TaskLynk", href: "/about" },
    { name: "Company Policy & Code of Conduct", href: "/policy" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Contact Support", href: "/contact" },
    { name: "Place an Order", href: "/client/new-job" },
    { name: "Create Client Account", href: "/register/client" },
    { name: "Apply as a Specialist", href: "/register/freelancer" },
  ],
} as const;
