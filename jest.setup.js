// Jest setup file for test environment configuration
// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-minimum-32-characters';
process.env.TURSO_CONNECTION_URL = 'file:test.db';
process.env.TURSO_AUTH_TOKEN = 'test-token';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:5000';
process.env.NODE_ENV = 'test';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => new Map(),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console logs in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep errors and warnings visible
  error: console.error,
  warn: console.warn,
};
