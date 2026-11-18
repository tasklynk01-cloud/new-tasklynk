import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: ['lucide-react'],
  
  // Render.com hosting - standard Node.js server deployment
  // Protected by Cloudflare CDN/WAF (DNS proxy mode)
  // No special output config needed - uses default server-side rendering
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 🚀 Production Optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons', 
      'recharts', 
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
    // Enable optimistic client-side navigation
    optimisticClientCache: true,
  },

  // Turbopack configuration (empty to silence webpack/turbopack conflict warning)
  turbopack: {},

  webpack: (config, { isServer }) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    
    // 📦 Bundle Size Optimization
    if (!isServer) {
      // Split vendor chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // React/UI libraries
            react: {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            // Radix UI components
            radix: {
              name: 'radix-vendor',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 25,
            },
          },
        },
      };
    }
    
    return config
  },

  // Centralized payment API rewrites (e.g. https://api.tasklynk.co.ke/payments/initialize)
  async rewrites() {
    return [
      {
        source: '/payments/:path*',
        destination: '/api/payments/:path*',
      },
    ];
  },

  // SEO Redirects - Handle all TaskLynk variations
  async redirects() {
    return [
      // Direct registration routes to homepage with instant popup modal
      {
        source: '/register/select-role',
        destination: '/?register=true',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/?register=true',
        permanent: false,
      },
      // Brand name variations - redirect to home
      {
        source: '/task-lynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task-link',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tasklynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tasklink',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task_lynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task_link',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // 🔒 Security & SEO Headers
  async headers() {
    return [
      // Static Assets - Long-term caching (1 year, immutable)
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Next.js Static Build Output - Long-term caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Next.js Data - Short-term caching
      {
        source: '/_next/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600'
          }
        ],
      },
      // Manifest & PWA files
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Clickjacking Protection
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://slelguoygbfzlpylpxfs.supabase.co https://static.cloudflareinsights.com https://js.paystack.co https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://adservice.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob: https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: wss: https://api.paystack.co https://cloudflareinsights.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://ep2.adtrafficquality.google",
              "frame-src 'self' https://js.paystack.co https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://*.google.com https://*.adtrafficquality.google https://ep2.adtrafficquality.google",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
      // API CORS Headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, Accept, Origin'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
// Orchids restart: 1763592238746