import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Smartphone, Globe, Layout, Users, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Hire React Developers | Frontend Engineering Experts',
  'Hire vetted React developers and frontend engineers for custom React applications, component libraries, Next.js development, and mobile-first interfaces. Secure milestone payments and proven expertise.',
  '/services/technical/react-development'
);

const faqs = [
  {
    question: 'What React projects do your developers specialize in?',
    answer: 'Our React developers handle everything from single-page applications (SPAs) and progressive web apps (PWAs) to complex enterprise dashboards, e-commerce frontends, content management systems, and micro-frontend architectures. We also specialize in Next.js for server-side rendering, static site generation, and hybrid applications with optimal SEO and performance.',
  },
  {
    question: 'Do you work with React Native for mobile apps?',
    answer: 'Yes. Our React developers are proficient in React Native for building cross-platform mobile applications for iOS and Android. We also use Expo for rapid development and deployment, and can integrate native modules for platform-specific functionality. We handle the complete mobile development lifecycle from design to app store deployment.',
  },
  {
    question: 'What is your experience with component libraries and design systems?',
    answer: 'Our developers work with popular component libraries including Material-UI (MUI), Ant Design, Chakra UI, Tailwind CSS, Styled Components, and Styled System. They also build custom design systems from scratch, ensuring component consistency, accessibility compliance, and maintainable code architecture. We can integrate with existing design systems or create new ones based on your brand guidelines.',
  },
  {
    question: 'Do you use TypeScript with React?',
    answer: 'Yes, most of our senior React developers use TypeScript for type safety, better developer experience, and reduced runtime errors. We follow modern React best practices including hooks, context API, custom hooks, component composition, and performance optimization techniques like memoization, code splitting, and lazy loading.',
  },
  {
    question: 'Can you help with existing React codebases?',
    answer: 'Yes. We provide codebase audits, performance optimization, refactoring, bug fixing, feature additions, migration to newer React versions, and modernization of legacy codebases. We work with your existing setup whether it uses Webpack, Vite, Create React App, or Next.js.',
  },
  {
    question: 'What React ecosystem tools do you use?',
    answer: 'Our developers use state management tools (Redux, Zustand, Jotai, Context API, Recoil), testing frameworks (Jest, React Testing Library, Cypress, Playwright), build tools (Vite, Webpack, Turbopack), CI/CD platforms, and debugging tools. We also use package managers (npm, yarn, pnpm) and monorepo tools (Turborepo, Nx) for scalable project organization.',
  },
];

const relatedServices = [
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'API Development', href: '/services/technical/api-development' },
  { label: 'Database Services', href: '/services/technical/database-services' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function ReactDevelopmentPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/react-development"
      serviceSchemaName="React Development Services"
      serviceSchemaDescription="Hire vetted React developers and frontend engineers for custom React applications, Next.js development, component libraries, and React Native mobile apps with secure milestone payments."
      heroEyebrow="React Development"
      heroTitle="Hire React Developers | Frontend Engineering Experts"
      heroIntro="React powers some of the world's most interactive web applications—but building robust, scalable React applications requires more than just component assembly. State management complexity, performance optimization, architectural decisions, and browser compatibility challenges can derail even experienced development teams. TaskLynk connects you with vetted React developers—experts in hooks, context API, state management, and Next.js—who build production-ready React applications with secure milestone payments, real-time collaboration, and dedicated project management."
      faqs={faqs}
      relatedServices={relatedServices}
    >
      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Who This Service Is For
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                This service is for teams and businesses that need expert React development. <strong>Startups</strong> building their first React application or MVP who need rapid development with clean, maintainable code. <strong>Established companies</strong> with existing frontend teams that need to augment capacity for large-scale React projects or specific technical challenges. <strong>Product managers</strong> overseeing React-based applications who need senior frontend engineering expertise. <strong>Agencies</strong> handling client React projects who need experienced developers on demand. <strong>Enterprises</strong> migrating legacy frontend systems to modern React architectures. <strong>Academic researchers</strong> building interactive data visualization dashboards or experimental platforms using React and D3. <strong>Developers who need help</strong> with specific React challenges like performance optimization, refactoring legacy code, or integrating complex third-party libraries.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need a React specialist—whether for Next.js server-side rendering, React Native mobile apps, component library development, or performance optimization—our marketplace provides vetted frontend engineering experts. We also support complementary services including <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">full web development</Link>, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database services</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link> for interactive dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                What We Offer: Production-Grade React Engineering
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our React development service covers the complete spectrum of frontend engineering needs, from component design and architecture to performance optimization and deployment. We specialize in building <strong>scalable React applications</strong> using modern best practices including functional components, hooks, custom hooks, and component composition patterns. Our senior developers make critical architectural decisions about state management (Redux, Zustand, Context API), data fetching strategies (React Query, SWR, custom hooks), routing (React Router, Next.js routing), and code organization (feature-based, modular, or monorepo structures) that ensure your application remains maintainable as it grows.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>Next.js development</strong>, our specialists leverage server-side rendering, static site generation, incremental static regeneration, and API routes to build applications with optimal performance and SEO. We implement middleware for authentication, authorization, and request processing, and use Next.js Image Optimization, Font Optimization, and built-in CSS support. For <strong>React Native and mobile development</strong>, we build cross-platform applications for iOS and Android using React Native and Expo, handling native module integration, platform-specific UI, push notifications, and app store deployment. All projects include comprehensive testing using Jest, React Testing Library, Cypress, or Playwright, ensuring your application is reliable and bug-free.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">React &amp; Next.js Apps</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scalable single-page applications, server-side rendered apps, and static sites with optimized performance and SEO.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">React Native Mobile</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cross-platform iOS and Android apps using React Native and Expo with native module integration.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Component Libraries</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom design systems, reusable component libraries, and integration with MUI, Tailwind, Chakra UI, and Ant Design.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Testing &amp; QA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive testing with Jest, React Testing Library, Cypress, and Playwright to ensure reliability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                State Management, Performance, and Architecture
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                React applications grow complex quickly, and poor architectural decisions early in development can lead to unmaintainable codebases, performance bottlenecks, and team coordination problems. Our senior React developers address these challenges through <strong>strategic state management</strong>—choosing the right tool for your needs. For simple applications, React's built-in Context API and hooks provide lightweight state sharing. For complex applications with deeply nested component trees and cross-cutting state concerns, we implement Redux Toolkit, Zustand, or Jotai with well-defined slice architectures and middleware. We also implement data fetching libraries like React Query or SWR that handle caching, background updates, and request deduplication automatically.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>performance optimization</strong>, our developers use profiling tools to identify bottlenecks, implement code splitting and lazy loading for faster initial loads, memoize expensive computations using useMemo and useCallback, optimize rendering with React.memo and virtualization for large lists, and leverage Next.js features like Image Optimization and font optimization. We also implement service workers for offline support, implement proper error boundaries, and ensure accessibility compliance (WCAG 2.1). For <strong>legacy codebase modernization</strong>, we refactor class components to functional components with hooks, migrate to newer React versions, upgrade dependencies, and improve test coverage. <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">Explore our full web development capabilities</Link> or <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development services</Link> to understand the complete technical stack we support.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for React Development
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                The React ecosystem moves fast, and finding developers who not only know the latest patterns but also understand when and how to apply them correctly is essential for building maintainable, scalable applications. TaskLynk's marketplace connects you with senior React developers who have demonstrated expertise through portfolio projects, code reviews, and technical assessments. Every developer in our network has a minimum of 3 years of professional React experience and has worked on production applications serving real users. Our screening process evaluates not just syntax knowledge, but understanding of React's rendering model, state management trade-offs, performance implications, and modern best practices.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical vetting, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each development milestone before payment is released, protecting you from upfront payment risks. <strong>Dedicated project managers</strong> are fluent in technical terminology and coordinate between you and the developer, tracking progress against sprint goals and ensuring requirements alignment. <strong>Real-time collaboration</strong> tools allow direct communication with your developer, code review sessions, and demo walkthroughs. For full-stack projects, we can assemble teams combining <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">backend API specialists</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database engineers</Link>, and <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">frontend developers</Link>—all under one project manager. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your React project</Link> today to receive bids from qualified developers within hours. For frontend engineers, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link> to connect with projects worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
