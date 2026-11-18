import { CATEGORIES, getCategory } from './categories';
import { dataAnalysisServices } from './data/data-analysis';
import { thesisServices } from './data/thesis';
import { businessServices } from './data/business';
import { trainingServices } from './data/training';
import { qualitativeServices } from './data/qualitative';
import { technicalServices } from './data/technical';
import { BUNDLES, getBundle } from './data/bundles';
import type { CatalogueService, CatalogueCategory, CatalogueBundle, CategorySlug, ServiceOverride, BundleOverride } from './types';

export * from './types';
export { CATEGORIES, getCategory } from './categories';
export { BUNDLES, getBundle } from './data/bundles';

// Static base services
const ALL_BASE_SERVICES: CatalogueService[] = [
  ...dataAnalysisServices,
  ...thesisServices,
  ...businessServices,
  ...trainingServices,
  ...qualitativeServices,
  ...technicalServices,
];

// In-memory runtime override store (can be populated or synced via admin API)
const serviceOverrides = new Map<string, ServiceOverride>();
const bundleOverrides = new Map<string, BundleOverride>();

export function applyServiceOverride(override: ServiceOverride) {
  serviceOverrides.set(override.serviceSlug, {
    ...serviceOverrides.get(override.serviceSlug),
    ...override,
  });
}

export function applyBundleOverride(override: BundleOverride) {
  bundleOverrides.set(override.bundleSlug, {
    ...bundleOverrides.get(override.bundleSlug),
    ...override,
  });
}

export function getAllServices(includeUnpublished = false): CatalogueService[] {
  return ALL_BASE_SERVICES.map((s) => {
    const o = serviceOverrides.get(s.slug);
    if (!o) return s;
    return {
      ...s,
      published: o.published !== undefined ? o.published : s.published,
      orderable: o.orderable !== undefined ? o.orderable : s.orderable,
      pricingModel: o.pricingModel ?? s.pricingModel,
      startingPrice: o.startingPrice !== undefined ? o.startingPrice : s.startingPrice,
      minimumPrice: o.minimumPrice !== undefined ? o.minimumPrice : s.minimumPrice,
      turnaround: o.turnaround ?? s.turnaround,
      revisionPolicy: o.revisionPolicy ?? s.revisionPolicy,
      summary: o.summary ?? s.summary,
    };
  }).filter((s) => includeUnpublished || s.published);
}

export function getServicesByCategory(categorySlug: CategorySlug, includeUnpublished = false): CatalogueService[] {
  return getAllServices(includeUnpublished).filter((s) => s.categorySlug === categorySlug);
}

export function getServiceBySlug(slug: string): CatalogueService | undefined {
  const service = getAllServices(true).find((s) => s.slug === slug);
  return service;
}

export function getAllBundles(includeUnpublished = false): CatalogueBundle[] {
  return BUNDLES.map((b) => {
    const o = bundleOverrides.get(b.slug);
    if (!o) return b;
    return {
      ...b,
      published: o.published !== undefined ? o.published : b.published,
      orderable: o.orderable !== undefined ? o.orderable : b.orderable,
      discountPercent: o.discountPercent ?? b.discountPercent,
      fixedPrice: o.fixedPrice !== undefined ? o.fixedPrice : b.fixedPrice,
      tagline: o.tagline ?? b.tagline,
      description: o.description ?? b.description,
      turnaround: o.turnaround ?? b.turnaround,
      includes: o.includes ?? b.includes,
    };
  }).filter((b) => includeUnpublished || b.published);
}

/**
 * Search and filter catalogue services
 */
export function searchCatalogue({
  query = '',
  categorySlug,
  tool,
  pricingModel,
  orderableOnly = false,
}: {
  query?: string;
  categorySlug?: CategorySlug;
  tool?: string;
  pricingModel?: string;
  orderableOnly?: boolean;
} = {}): CatalogueService[] {
  const q = query.trim().toLowerCase();
  return getAllServices().filter((s) => {
    if (categorySlug && s.categorySlug !== categorySlug) return false;
    if (orderableOnly && !s.orderable) return false;
    if (pricingModel && s.pricingModel !== pricingModel) return false;
    if (tool && !s.tools.some((t) => t.toLowerCase().includes(tool.toLowerCase()))) return false;

    if (!q) return true;

    return (
      s.name.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.keywords.some((k) => k.toLowerCase().includes(q)) ||
      s.tools.some((t) => t.toLowerCase().includes(q)) ||
      s.useCases.some((u) => u.toLowerCase().includes(q))
    );
  });
}

/**
 * Generate a pre-filled WhatsApp enquiry link for any service
 */
export function getServiceWhatsAppUrl(service: CatalogueService): string {
  const text = `Hello TaskLynk Support, I would like to enquire about: ${service.name} (${service.slug}).\nCategory: ${service.categorySlug}.\nCould you please guide me on scope, specialist availability, and quotation?`;
  return `https://wa.me/254701066845?text=${encodeURIComponent(text)}`;
}

/**
 * Generate a pre-filled WhatsApp enquiry link for any bundle
 */
export function getBundleWhatsAppUrl(bundle: CatalogueBundle): string {
  const text = `Hello TaskLynk Support, I would like to enquire about the ${bundle.name} bundle.\nCould you please provide a quotation and discuss turnaround?`;
  return `https://wa.me/254701066845?text=${encodeURIComponent(text)}`;
}

/**
 * Generate direct order URL (links smoothly to existing TaskLynk client workflow)
 */
export function getServiceOrderUrl(service: CatalogueService): string {
  if (service.legacyHref) {
    return service.legacyHref;
  }
  const params = new URLSearchParams({
    service: service.slug,
    category: service.categorySlug,
    title: service.name,
  });
  if (service.legacyOrderKey) {
    params.set('workType', service.legacyOrderKey);
  }
  return `/catalogue/order?${params.toString()}`;
}

export function getBundleOrderUrl(bundle: CatalogueBundle): string {
  const params = new URLSearchParams({
    bundle: bundle.slug,
    title: bundle.name,
  });
  return `/catalogue/order?${params.toString()}`;
}

/**
 * Get related services matching category or shared software tools
 */
export function getRelatedServices(service: CatalogueService, limit = 4): CatalogueService[] {
  return getAllServices()
    .filter((s) => s.slug !== service.slug && (s.categorySlug === service.categorySlug || s.tools.some((t) => service.tools.includes(t))))
    .slice(0, limit);
}

/**
 * Get bundles that include a given service
 */
export function getBundlesForService(serviceSlug: string): CatalogueBundle[] {
  return getAllBundles().filter((bundle) => bundle.includes.some((item) => item.serviceSlug === serviceSlug));
}


