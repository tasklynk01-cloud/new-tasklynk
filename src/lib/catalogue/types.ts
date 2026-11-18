// Service catalogue types. The catalogue is defined in code (safe defaults that always render)
// and can be overridden per service or bundle from the admin dashboard (see overrides.ts).

export type CategorySlug =
  | 'data-analysis-statistics'
  | 'thesis-dissertation-research-support'
  | 'business-data-analysis-reporting'
  | 'data-analysis-training-tutoring'
  | 'qualitative-mixed-methods-research'
  | 'technical-services';

/** Drives which conditional fields appear on the quotation and order form. */
export type ServiceKind = 'statistical' | 'research' | 'business' | 'training' | 'qualitative' | 'technical';

export type PricingModel = 'fixed' | 'starting' | 'quote' | 'per_session' | 'hourly' | 'milestone';

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface TrainingInfo {
  targetLearner: string;
  prerequisites: string;
  outcomes: string[];
  sessionDuration: string;
  format: string;
  materials: string;
}

export interface CatalogueService {
  slug: string;
  name: string;
  categorySlug: CategorySlug;
  kind: ServiceKind;
  /** One or two sentence customer friendly description. */
  summary: string;
  /** Longer description paragraphs. */
  description: string[];
  useCases: string[];
  tools: string[];
  requiredInputs: string[];
  deliverables: string[];
  turnaround: string;
  pricingModel: PricingModel;
  /** KSh. Null means no published starting price, the customer requests a quotation. */
  startingPrice: number | null;
  /** Minimum price floor used by quotation rules (admin only, never displayed). */
  minimumPrice: number | null;
  revisionPolicy: string;
  specialistProfile: string;
  faqs: ServiceFaq[];
  related: string[];
  keywords: string[];
  /** Existing TaskLynk page that already covers this topic. Linked, never duplicated. */
  legacyHref?: string;
  /** Legacy work type key used by the existing order form (src/app/client/new-job). */
  legacyOrderKey?: string;
  training?: TrainingInfo;
  /** Admin QA gate: service is visible and can receive quotation requests. */
  published: boolean;
  /** Admin QA gate: a qualified specialist is confirmed, direct ordering is enabled. */
  orderable: boolean;
  /** Admin QA notes shown only in the dashboard. */
  qaChecklist: string[];
}

export interface CatalogueCategory {
  slug: CategorySlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  audience: string;
  icon: 'bar-chart' | 'graduation-cap' | 'briefcase' | 'presentation' | 'messages' | 'cpu';
  accent: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  blogSlug: string;
  faqs: ServiceFaq[];
}

export interface BundleItem {
  serviceSlug: string;
  note?: string;
}

export interface CatalogueBundle {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  idealFor: string[];
  includes: BundleItem[];
  deliverables: string[];
  turnaround: string;
  /** Percentage discount applied to the sum of the included services at quotation time. */
  discountPercent: number;
  /** Optional fixed bundle price in KSh. Null means priced from the included services. */
  fixedPrice: number | null;
  published: boolean;
  orderable: boolean;
}

export interface ServiceOverride {
  serviceSlug: string;
  published?: boolean;
  orderable?: boolean;
  pricingModel?: PricingModel;
  startingPrice?: number | null;
  minimumPrice?: number | null;
  turnaround?: string;
  revisionPolicy?: string;
  archived?: boolean;
  summary?: string;
  qaNotes?: string;
}

export interface BundleOverride {
  bundleSlug: string;
  published?: boolean;
  orderable?: boolean;
  discountPercent?: number;
  fixedPrice?: number | null;
  tagline?: string;
  description?: string;
  turnaround?: string;
  includes?: BundleItem[];
}

