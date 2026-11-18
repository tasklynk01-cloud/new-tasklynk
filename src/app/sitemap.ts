import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo-config';
import { blogArticles } from '@/lib/blog-data';
import { CATEGORIES, getAllServices } from '@/lib/catalogue';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const currentDate = new Date();

  // ── Static public pages ──────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalogue`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/catalogue/order`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/professionals`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/how-it-works`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/pricing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/policy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
  ];

  // ── 12 Dedicated Service Taxonomy Pages ───────────────────────────────
  const dedicatedServicePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/services/website-development`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/software-development`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/systems-integration`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/data-analytics`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/data-processing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/graphic-design`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/video-production`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/virtual-assistance`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/accounting-support`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/business-research`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/professional-writing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/academic-support`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // ── Published Specialist Profiles ─────────────────────────────────────
  let specialistPages: MetadataRoute.Sitemap = [];
  try {
    const specialists = await getPublishedSpecialists();
    specialistPages = specialists.map((s) => ({
      url: `${baseUrl}/professionals/${s.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch (err) {
    console.error('Failed to load specialists for sitemap:', err);
  }

  // ── Catalogue Categories ─────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/catalogue/${cat.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // ── Catalogue Individual Services ────────────────────────────────────
  const allServices = getAllServices();
  const catalogueServicePages: MetadataRoute.Sitemap = allServices.map((svc) => ({
    url: `${baseUrl}/catalogue/${svc.categorySlug}/${svc.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // ── Legacy Routes Preserved ──────────────────────────────────────────
  const legacyServicePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/services/academic-writing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/services/data-analysis`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/services/business-services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/services/technical-services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/services/data-analysis/spss-data-analysis-services-nairobi`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/services/academic-writing/mba-thesis-proofreading-kenya`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/pricing/how-much-does-a-business-plan-cost-in-kenya`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/services/data-analysis/data-analysis-services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/data-analysis/kenya-data-analysis-services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/services/data-analysis/spss-data-analysis-services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/data-analysis/excel-data-analysis`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/data-analysis/power-bi-dashboard`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/technical/web-development`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/technical/react-development`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/technical/api-development`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // ── Blog articles ────────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ── Auth pages ───────────────────────────────────────────────────────
  const authPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/login`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...dedicatedServicePages,
    ...specialistPages,
    ...categoryPages,
    ...catalogueServicePages,
    ...legacyServicePages,
    ...blogPages,
    ...authPages,
  ];
}
