import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/page.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/layout.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/loading.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/error.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/not-found.{js,ts,jsx,tsx,mdx}",
    "!./src/app/api/**",
  ],
  // Ensure these responsive sidebar classes are always generated
  safelist: [
    '-translate-x-full',
    'translate-x-0',
    '!translate-x-0',
    'lg:translate-x-0',
    'lg:hidden',
    'lg:block',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        mainbg: "#F8F5FC",
        'sidebar-dark': "#241B3F",
        'text-primary': "#241B3F",
        'text-secondary': "#6F687A",
        'accent-orange': "#FF7A3D",
        'orange-hover': "#E9662F",
        'progress-bg': "#EEE7FA",
        'purple-primary': "#241B3F",
        'purple-royal': "#5B3A8C",
        'purple-light': "#EEE7FA",
        'purple-bg': "#F8F5FC",
        'border-lavender': "#DDD5E8",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        chart: {
          "1": "var(--color-chart-1)",
          "2": "var(--color-chart-2)",
          "3": "var(--color-chart-3)",
          "4": "var(--color-chart-4)",
          "5": "var(--color-chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          foreground: "var(--color-sidebar-foreground)",
          primary: "var(--color-sidebar-primary)",
          "primary-foreground": "var(--color-sidebar-primary-foreground)",
          accent: "var(--color-sidebar-accent)",
          "accent-foreground": "var(--color-sidebar-accent-foreground)",
          border: "var(--color-sidebar-border)",
          ring: "var(--color-sidebar-ring)",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;