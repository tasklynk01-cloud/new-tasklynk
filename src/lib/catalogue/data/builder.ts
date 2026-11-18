import type { CatalogueService, CategorySlug, PricingModel, ServiceKind, ServiceFaq, TrainingInfo } from '../types';

interface KindDefaults {
  tools: string[];
  requiredInputs: string[];
  turnaround: string;
  pricingModel: PricingModel;
  revisionPolicy: string;
  specialistProfile: string;
  qaChecklist: string[];
  faqs: (name: string) => ServiceFaq[];
}

const COMMON_QA = [
  'Qualified specialist identified and confirmed',
  'Deliverables and review criteria defined',
  'Customer inputs documented',
  'Turnaround estimate validated against specialist capacity',
  'Quality control reviewer assigned',
];

const KIND_DEFAULTS: Record<ServiceKind, KindDefaults> = {
  statistical: {
    tools: ['SPSS', 'Stata', 'R', 'Python', 'Excel', 'Jamovi', 'SmartPLS'],
    requiredInputs: [
      'Research objectives or questions and any hypotheses',
      'Dataset in .sav, .xlsx, .csv or .dta format',
      'Variable definitions or a codebook, including scales and coding',
      'Sample size and how the sample was collected',
      'Preferred software and required output format',
      'Your deadline',
    ],
    turnaround: 'Typically 2 to 7 days depending on scope. Faster delivery can be quoted for urgent work.',
    pricingModel: 'quote',
    revisionPolicy:
      'One round of corrections within the agreed scope is included. Changes to objectives or data after delivery are quoted separately.',
    specialistProfile:
      'Statistician or data analyst with postgraduate training and demonstrated experience in the method and software, confirmed by TaskLynk before assignment.',
    qaChecklist: [...COMMON_QA, 'Software licence availability confirmed', 'Second review of tables and interpretation'],
    faqs: (name) => [
      {
        question: `What do I need to send for ${name}?`,
        answer:
          'Share your objectives, your dataset, a short description of each variable and your preferred software. If you are not sure which test fits, say so and the specialist will recommend one in the quotation.',
      },
      {
        question: 'Can the analysis be explained to me?',
        answer:
          'Yes. The deliverable includes an interpretation of the main results, and you can request a short walkthrough session so that you understand and can defend the choices made.',
      },
    ],
  },
  research: {
    tools: ['Microsoft Word', 'Google Docs', 'Zotero', 'Mendeley', 'EndNote'],
    requiredInputs: [
      'Your current draft, outline or idea',
      'Institution guidelines, rubric or supervisor comments',
      'Referencing style (APA, Harvard, MLA and others)',
      'The stage you have reached and what you want to achieve',
      'Your deadline',
    ],
    turnaround: 'Typically 1 to 5 days depending on length and complexity. Milestone delivery for larger projects.',
    pricingModel: 'quote',
    revisionPolicy:
      'One round of follow-up edits within the agreed scope is included. New sections or a change of topic are quoted separately.',
    specialistProfile:
      'Researcher, editor or subject specialist with postgraduate qualifications and experience supporting academic work, confirmed before assignment.',
    qaChecklist: [...COMMON_QA, 'Academic integrity brief reviewed with the customer'],
    faqs: (name) => [
      {
        question: `Is ${name} suitable for my own thesis or manuscript?`,
        answer:
          'Yes, provided you use it to improve and understand your own work and follow your institution rules. We do not support misrepresenting authorship.',
      },
      {
        question: 'Will my supervisor feedback be considered?',
        answer: 'Please upload supervisor comments and guidelines. Specialists use them to keep the support aligned with what your institution expects.',
      },
    ],
  },
  business: {
    tools: ['Excel', 'Power BI', 'Google Sheets', 'Python', 'R'],
    requiredInputs: [
      'Business objective and the decisions the work should support',
      'Source data files or exports (with personal identifiers removed where possible)',
      'Metrics or KPIs you want to see',
      'Preferred report format and audience',
      'Any access requirements, handled securely through your project manager',
      'Your deadline',
    ],
    turnaround: 'Typically 2 to 10 days depending on data quality and scope. Recurring work is scheduled by agreement.',
    pricingModel: 'quote',
    revisionPolicy:
      'One round of adjustments within the agreed scope is included. New data sources or additional metrics are quoted separately.',
    specialistProfile:
      'Data analyst or business intelligence specialist with practical experience in the required tools, confirmed before assignment.',
    qaChecklist: [...COMMON_QA, 'Data handling and confidentiality terms agreed'],
    faqs: (name) => [
      {
        question: `How do I share data safely for ${name}?`,
        answer:
          'Upload files through your TaskLynk order so that access is limited to you, your project manager and the assigned specialist. Remove personal identifiers and never share passwords in messages.',
      },
      {
        question: 'Can I maintain the outputs myself afterwards?',
        answer: 'Handover notes are included where applicable, and a short training session can be added so that your team can update the files confidently.',
      },
    ],
  },
  training: {
    tools: ['Video call with screen sharing', 'Sample datasets', 'Practice exercises'],
    requiredInputs: [
      'Your current skill level',
      'Preferred software and version',
      'Learning objectives or the project you are working on',
      'Available training times and time zone',
      'Preferred format: individual, small group or guided project',
    ],
    turnaround: 'First session usually within 2 to 5 days of confirming a schedule.',
    pricingModel: 'per_session',
    revisionPolicy:
      'Training is scheduled by session. Missed or rescheduled sessions follow the policy confirmed in your quotation. Follow-up questions are handled in the agreed follow-up session.',
    specialistProfile:
      'Tutor or analyst with teaching or mentoring experience and strong practical skills in the tool, confirmed before assignment.',
    qaChecklist: [...COMMON_QA, 'Learning plan and materials prepared', 'Trial or introductory call completed'],
    faqs: (name) => [
      {
        question: `Is ${name} available as a group session?`,
        answer: 'Small group training can be arranged when learners share similar goals and availability. Tell us the group size in your enquiry.',
      },
      {
        question: 'Do I receive materials after the session?',
        answer: 'Yes. Each listing states the materials provided, which normally include exercises and sample datasets.',
      },
    ],
  },
  qualitative: {
    tools: ['NVivo', 'ATLAS.ti', 'Microsoft Excel', 'Microsoft Word', 'Dedoose'],
    requiredInputs: [
      'Research questions and the study design',
      'Audio recordings, transcripts or response files',
      'Language of the data and any local language or code switching',
      'Existing codebook or framework, if you have one',
      'Ethics or confidentiality requirements',
      'Your deadline',
    ],
    turnaround: 'Typically 3 to 14 days depending on volume. Transcription time depends on audio length and quality.',
    pricingModel: 'quote',
    revisionPolicy:
      'One round of corrections within the agreed scope is included. A change of research question or framework is quoted separately.',
    specialistProfile:
      'Qualitative researcher or analyst with experience in the method and software, confirmed before assignment.',
    qaChecklist: [...COMMON_QA, 'Confidentiality and anonymisation approach agreed', 'Software licence availability confirmed'],
    faqs: (name) => [
      {
        question: `Can I order only part of ${name}?`,
        answer: 'Yes. Transcription, coding, interpretation and full project support are priced separately so that you choose the scope you need.',
      },
      {
        question: 'Who owns the codes and themes?',
        answer: 'The researcher owns the study and its findings. Project files are delivered to you at the end of the work.',
      },
    ],
  },
  technical: {
    tools: ['Agreed in the project scope'],
    requiredInputs: [
      'Project goal and target users',
      'Existing code, designs or documentation (if any)',
      'Preferred technologies',
      'Milestones and acceptance criteria',
      'Your deadline',
    ],
    turnaround: 'Confirmed per project in the written scope.',
    pricingModel: 'milestone',
    revisionPolicy: 'Revision limits are set in the written scope and linked to each milestone.',
    specialistProfile: 'Developer or engineer with a portfolio relevant to the stack, confirmed before assignment.',
    qaChecklist: [...COMMON_QA, 'Code ownership and handover terms agreed'],
    faqs: (name) => [
      {
        question: `How is ${name} scoped?`,
        answer: 'A project manager reviews your brief, proposes milestones and confirms the price before development begins.',
      },
    ],
  },
};

export interface ServiceSpec {
  slug: string;
  name: string;
  summary: string;
  detail: string;
  useCases: string[];
  deliverables: string[];
  tools?: string[];
  extraInputs?: string[];
  inputs?: string[];
  turnaround?: string;
  pricingModel?: PricingModel;
  related?: string[];
  keywords?: string[];
  legacyHref?: string;
  legacyOrderKey?: string;
  training?: TrainingInfo;
  faqs?: ServiceFaq[];
  orderable?: boolean;
}

export function buildServices(kind: ServiceKind, categorySlug: CategorySlug, specs: ServiceSpec[]): CatalogueService[] {
  const d = KIND_DEFAULTS[kind];
  return specs.map((s) => ({
    slug: s.slug,
    name: s.name,
    categorySlug,
    kind,
    summary: s.summary,
    description: [s.detail],
    useCases: s.useCases,
    tools: s.tools ?? d.tools,
    requiredInputs: s.inputs ?? [...(s.extraInputs ?? []), ...d.requiredInputs],
    deliverables: s.deliverables,
    turnaround: s.turnaround ?? d.turnaround,
    pricingModel: s.pricingModel ?? d.pricingModel,
    startingPrice: null,
    minimumPrice: null,
    revisionPolicy: d.revisionPolicy,
    specialistProfile: d.specialistProfile,
    faqs: [...(s.faqs ?? []), ...d.faqs(s.name)],
    related: s.related ?? [],
    keywords: s.keywords ?? [`${s.name} Kenya`, s.name.toLowerCase(), `${s.name.toLowerCase()} help`],
    legacyHref: s.legacyHref,
    legacyOrderKey: s.legacyOrderKey,
    training: s.training,
    published: true,
    // Direct ordering is enabled only for work TaskLynk already delivers (existing pages or order types).
    orderable: s.orderable ?? Boolean(s.legacyHref),
    qaChecklist: d.qaChecklist,
  }));
}

