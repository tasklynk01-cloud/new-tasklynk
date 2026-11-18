/**
 * Canonical URL Configuration
 * 
 * Prevents duplicate content penalties by ensuring all pages
 * point to the main domain (www.tasklynk.co.ke) as canonical
 */

export const MAIN_DOMAIN = 'www.tasklynk.co.ke';
export const SUBDOMAIN = 'tasklynkacademic.online';
export const PROTOCOL = 'https://';

/**
 * Get the canonical URL for a given path
 * Always returns the main domain URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Always use main domain for canonical
  return `${PROTOCOL}${MAIN_DOMAIN}/${cleanPath}`;
}

/**
 * Check if current request is from subdomain
 */
export function isSubdomain(host: string): boolean {
  return host.includes(SUBDOMAIN) || host.includes('tasklynkacademic.online');
}

/**
 * Get redirect URL if on subdomain
 * Returns null if already on main domain
 */
export function getRedirectUrl(host: string, path: string): string | null {
  if (isSubdomain(host)) {
    return getCanonicalUrl(path);
  }
  return null;
}

/**
 * Generate meta tags with canonical URL
 */
export function generateCanonicalMeta(path: string) {
  const canonical = getCanonicalUrl(path);
  
  return {
    canonical,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

