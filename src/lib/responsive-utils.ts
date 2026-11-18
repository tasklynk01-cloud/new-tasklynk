/**
 * Responsive Optimization Utilities
 * 
 * Standard responsive patterns for TaskLynk
 */

// Standard responsive padding scale
export const responsivePadding = {
  compact: "p-4 sm:p-4 md:p-4",
  standard: "p-4 sm:p-5 md:p-6",
  spacious: "p-6 sm:p-6 md:p-6 lg:p-6"
}

// Standard responsive gap scale
export const responsiveGap = {
  tight: "gap-3 sm:gap-3 md:gap-4",
  standard: "gap-3 sm:gap-4 md:gap-4",
  loose: "gap-4 sm:gap-4 md:gap-6"
}

// Standard responsive text scale
export const responsiveText = {
  xs: "text-xs",
  sm: "text-xs sm:text-sm",
  base: "text-sm sm:text-base",
  lg: "text-base sm:text-lg",
  xl: "text-lg sm:text-xl",
  "2xl": "text-xl sm:text-2xl",
  "3xl": "text-2xl sm:text-3xl"
}

// Standard grid layouts
export const responsiveGrid = {
  twoCol: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  threeCol: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  fourCol: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  autoFit: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
}

// Touch target minimum sizes (WCAG AA compliance)
export const touchTarget = {
  minimum: "min-h-[44px] min-w-[44px]", // iOS/Android minimum
  comfortable: "min-h-[48px] min-w-[48px]" // More comfortable for larger fingers
}

// Responsive container widths
export const containerWidth = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full"
}

// Standard breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536
}

// Helper function to check if mobile
export function isMobile(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth < breakpoints.md
}

// Helper function to check if tablet
export function isTablet(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg
}

// Helper function to check if desktop
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth >= breakpoints.lg
}

