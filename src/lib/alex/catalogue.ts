import "server-only";
import published from "./published-services.json";
import type { ServiceCard } from "./types";
import { getAllServices } from "@/lib/catalogue";
import { TASKLYNK_PUBLIC_KNOWLEDGE } from "./knowledge";

/**
 * Pure read-only public catalogue for Alex.
 * Strictly zero database access and zero personal/specialist profile queries.
 */
export async function getPublishedServices(): Promise<ServiceCard[]> {
  const expandedCategories: ServiceCard[] = TASKLYNK_PUBLIC_KNOWLEDGE.serviceCategories.map((cat) => ({
    id: `category-${cat.id}`,
    title: cat.name,
    description: cat.offers.slice(0, 3).join(" • "),
    href: cat.href,
    priceLabel: cat.id === "academic-writing" ? "From KSh 220 / page" : "Transparent / Custom Quote",
    deliverables: [...cat.offers.slice(0, 4)],
  }));

  const live: ServiceCard[] = getAllServices().map((service) => ({
    id: service.slug,
    title: service.name,
    description: service.summary,
    href: `/catalogue/${service.categorySlug}/${service.slug}`,
    priceLabel:
      service.startingPrice === null
        ? "Request a quotation"
        : `${service.pricingModel === "fixed" ? "Published price" : "Starting from"}: KSh ${service.startingPrice.toLocaleString("en-KE")}${
            service.pricingModel === "hourly"
              ? " / hour"
              : service.pricingModel === "per_session"
              ? " / session"
              : ""
          }`,
    deliverables: service.deliverables.slice(0, 4),
  }));

  const seen = new Set([...expandedCategories, ...live].map((service) => service.href));
  const legacyPublished: ServiceCard[] = published
    .filter((service) => !seen.has(service.href))
    .map((record) => ({
      ...record,
      priceLabel: "Request a quotation",
      deliverables: [],
    }));

  return [...expandedCategories, ...live, ...legacyPublished];
}

export function searchServices(records: ServiceCard[], query: string): ServiceCard[] {
  const stopWords = new Set([
    "the", "our", "your", "for", "and", "can", "help", "need", "get", "find",
    "with", "service", "services", "what", "you", "about", "how", "does", "offer",
  ]);
  const terms = query
    .toLowerCase()
    .replace(/chapter (?:4|four)/g, "research thesis")
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));

  return records
    .map((record) => ({
      record,
      score: terms.reduce(
        (score, term) =>
          score +
          (record.title.toLowerCase().includes(term)
            ? 4
            : record.description.toLowerCase().includes(term)
            ? 2
            : record.deliverables.some((d) => d.toLowerCase().includes(term))
            ? 1
            : 0),
        0
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.record);
}
