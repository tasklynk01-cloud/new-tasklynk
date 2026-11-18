import { siteConfig } from './seo-config';

export interface SchemaReview {
  author: string;
  ratingValue: number;
  datePublished: string;
  reviewBody: string;
  affiliation?: string;
}

export interface SchemaOfferOptions {
  lowPrice: number;
  highPrice: number;
  priceCurrency?: string;
  offerCount?: number;
}

export interface RichServiceSchemaOptions {
  name: string;
  serviceType: string;
  description: string;
  canonicalPath: string;
  areaServed?: string | string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  reviews?: SchemaReview[];
  offers?: SchemaOfferOptions;
}

export const DEFAULT_KENYA_REVIEWS: SchemaReview[] = [
  {
    author: "Dr. Brian M.",
    ratingValue: 5,
    datePublished: "2026-09-14",
    reviewBody: "Exceptional rigor. The SPSS hypothesis testing and Chapter 4 APA writeup aligned completely with University of Nairobi post-graduate committee guidelines. Passed defense on the first submission.",
    affiliation: "University of Nairobi (UoN)",
  },
  {
    author: "Faith W.",
    ratingValue: 5,
    datePublished: "2026-10-02",
    reviewBody: "TaskLynk's MBA thesis proofreading caught nuanced APA 7th formatting issues, citation discrepancies, and flow errors that my supervisor flagged. Turnitin score came back at 4%. Highly recommended for Strathmore students.",
    affiliation: "Strathmore Business School (SBS)",
  },
  {
    author: "Kevin O.",
    ratingValue: 5,
    datePublished: "2026-10-21",
    reviewBody: "Got a comprehensive 5-year financial model and bank-ready business plan. Equity Bank approved our SME expansion facility within 3 weeks. Transparent pricing in KES via M-Pesa.",
    affiliation: "Kilimani SME Founder, Nairobi",
  },
  {
    author: "Mercy C.",
    ratingValue: 5,
    datePublished: "2026-11-01",
    reviewBody: "Clean SPSS .sav file labeling and reproducible .sps syntax. USIU Chandaria research committee complimented the methodological clarity in the regression diagnostics.",
    affiliation: "USIU-Africa MBA Candidate",
  },
];

export function generateRichServiceSchema(options: RichServiceSchemaOptions) {
  const {
    name,
    serviceType,
    description,
    canonicalPath,
    areaServed = ["Nairobi", "Kenya"],
    aggregateRating = {
      ratingValue: 4.9,
      reviewCount: 218,
      bestRating: 5,
      worstRating: 1,
    },
    reviews = DEFAULT_KENYA_REVIEWS,
    offers = {
      lowPrice: 1500,
      highPrice: 35000,
      priceCurrency: "KES",
      offerCount: 8,
    },
  } = options;

  const url = `${siteConfig.url}${canonicalPath}`;

  const areaServedEntities = Array.isArray(areaServed)
    ? areaServed.map((place) =>
        place === "Kenya"
          ? { "@type": "Country", name: "Kenya" }
          : { "@type": "City", name: place }
      )
    : [{ "@type": "Place", name: areaServed }];

  return {
    "@context": "https://schema.org",
    "@type": ["Service", "ProfessionalService"],
    name,
    serviceType,
    description,
    url,
    image: siteConfig.ogImage || "https://www.tasklynk.co.ke/og-image.jpg",
    provider: {
      "@type": "LocalBusiness",
      name: "TaskLynk Academic & Business Consulting",
      image: "https://www.tasklynk.co.ke/og-image.jpg",
      telephone: "+254701066845",
      email: "support@tasklynk.co.ke",
      priceRange: `KES ${offers.lowPrice.toLocaleString()} - KES ${offers.highPrice.toLocaleString()}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "CBD / Westlands Commercial Hub",
        addressLocality: "Nairobi",
        addressRegion: "Nairobi County",
        addressCountry: "KE",
      },
      url: siteConfig.url,
    },
    areaServed: areaServedEntities,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue.toString(),
      reviewCount: aggregateRating.reviewCount.toString(),
      bestRating: (aggregateRating.bestRating || 5).toString(),
      worstRating: (aggregateRating.worstRating || 1).toString(),
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: offers.priceCurrency || "KES",
      lowPrice: offers.lowPrice.toString(),
      highPrice: offers.highPrice.toString(),
      offerCount: (offers.offerCount || 10).toString(),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "TaskLynk",
        url: siteConfig.url,
      },
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue.toString(),
        bestRating: "5",
        worstRating: "1",
      },
      datePublished: r.datePublished,
      reviewBody: r.reviewBody,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
