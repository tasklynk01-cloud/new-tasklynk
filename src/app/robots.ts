import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/services',
          '/about',
          '/contact',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/client/',
          '/freelancer/',
          '/manager/',
          '/dashboard/',
          '/settings/',
          '/profile/',
          '/login',
          '/register',
          '/verify-email',
          '/forgot-password',
          '/reset-password',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/client/',
          '/freelancer/',
          '/manager/',
          '/dashboard/',
          '/settings/',
          '/profile/',
          '/login',
          '/register',
          '/verify-email',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

