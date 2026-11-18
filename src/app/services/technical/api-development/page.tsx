import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Globe, ShieldCheck, Layout, Clock, Users, CheckCircle, BarChart3 } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'API Development Services | Build Robust Backend APIs',
  'Hire vetted API developers for RESTful and GraphQL API design, microservices architecture, authentication, rate limiting, and API testing. Secure milestone payments and expert backend engineering.',
  '/services/technical/api-development'
);

const faqs = [
  {
    question: 'What types of APIs do you build?',
    answer: 'We build RESTful APIs (JSON and XML), GraphQL APIs (queries, mutations, subscriptions), gRPC services, WebSocket APIs for real-time communication, and SOAP APIs for legacy integration. We also implement microservices architectures, serverless functions, and API gateways for scalable backend systems.',
  },
  {
    question: 'What programming languages and frameworks do you use?',
    answer: 'Our API developers specialize in Node.js (Express, NestJS, Fastify), Python (Django REST Framework, FastAPI, Flask), Ruby (Ruby on Rails, Sinatra), PHP (Laravel, Symfony), Go (Gin, Echo), Java (Spring Boot), and Rust (Actix, Axum). We choose the best stack based on your requirements, team familiarity, and scalability needs.',
  },
  {
    question: 'Do you implement authentication and authorization?',
    answer: 'Yes. We implement JWT-based authentication, OAuth 2.0, session-based authentication, API key authentication, and role-based access control (RBAC). We also handle password hashing, token refresh mechanisms, permission systems, and integration with identity providers like Auth0, Firebase Auth, or custom auth systems. All authentication follows security best practices.',
  },
  {
    question: 'Can you help with existing APIs that need fixing or scaling?',
    answer: 'Yes. We provide API audits, performance optimization, bug fixing, refactoring, security hardening, documentation generation, version migration, and scalability improvements. We work with your existing codebase, whether it uses REST, GraphQL, gRPC, or other protocols, and can modernize legacy APIs to meet current performance and security standards.',
  },
  {
    question: 'Do you provide API documentation?',
    answer: 'Yes. We generate comprehensive API documentation using OpenAPI/Swagger, GraphQL SDL (Schema Definition Language) with GraphiQL, Postman collections, and automated documentation tools like Swagger UI, Redoc, or Stoplight. Documentation includes endpoint descriptions, request/response schemas, authentication instructions, error codes, and example requests.',
  },
  {
    question: 'What testing do you perform on APIs?',
    answer: 'We implement comprehensive API testing including unit tests, integration tests, contract testing, security scanning, performance/load testing (JMeter, k6, Artillery), and end-to-end testing. We use testing frameworks like Jest, Pytest, Mocha, Chai, Supertest, Postman/Newman, and GraphQL Playground. We also implement API monitoring and logging for production environments.',
  },
];

const relatedServices = [
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'React Development', href: '/services/technical/react-development' },
  { label: 'Database Services', href: '/services/technical/database-services' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function ApiDevelopmentPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/api-development"
      serviceSchemaName="API Development Services"
      serviceSchemaDescription="Professional API development services for RESTful and GraphQL APIs, microservices architecture, authentication, rate limiting, and API testing. Hire vetted backend engineers with secure milestone payments."
      heroEyebrow="API Development"
      heroTitle="API Development Services | Build Robust Backend APIs"
      heroIntro="In today's connected world, your application's value is often measured by how well it integrates—with other services, platforms, and data sources. A poorly designed API creates friction for developers, limits scalability, and opens security vulnerabilities. TaskLynk connects you with vetted API developers—experts in RESTful design, GraphQL, microservices architecture, and authentication—who build secure, scalable, and well-documented APIs. With secure milestone payments, real-time collaboration, and dedicated project management, your backend infrastructure is built to professional standards."
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
                This service is for teams and businesses that need robust API development. <strong>Startups</strong> building their first API or backend service who need expert guidance on architecture and best practices. <strong>Enterprises</strong> modernizing legacy systems with well-designed APIs for internal integration, partner ecosystems, or customer-facing applications. <strong>Mobile app developers</strong> who need a reliable backend API to serve mobile clients with optimal performance and security. <strong>Product teams</strong> building SaaS platforms that require scalable, well-documented APIs for third-party integration. <strong>Frontend teams</strong> who need a backend API but lack dedicated backend engineering resources. <strong>Data science teams</strong> that need APIs to serve machine learning models or analytical endpoints to applications. <strong>E-commerce platforms</strong> requiring payment integration, inventory APIs, and order management systems. <strong>Fintech companies</strong> needing secure financial APIs with compliance and audit trails.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need a backend API—RESTful or GraphQL—built to professional standards with proper authentication, documentation, and scalability, our API development service provides expert engineering talent. We also support complementary services including <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">full web development</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database design and management</Link>, and <Link href="/services/technical/react-development" className="text-primary font-semibold hover:underline">React frontend development</Link>.
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
                What We Offer: Scalable, Secure API Engineering
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our API development service covers the complete backend engineering lifecycle, from architecture design and implementation through testing, deployment, and documentation. We begin with <strong>API architecture design</strong>—selecting the appropriate API style (RESTful, GraphQL, gRPC, or WebSocket) based on your use case, designing resource models, defining endpoint contracts, and planning for scalability and extensibility. Our senior API architects make critical decisions about data modeling, caching strategies, pagination, versioning, rate limiting, and error handling that ensure your API remains performant and maintainable as it grows.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we implement the API using modern frameworks and best practices. For <strong>RESTful APIs</strong>, we follow resource-oriented design principles, implement proper HTTP methods and status codes, use JSON for request/response payloads, and design clean, predictable URL structures. For <strong>GraphQL APIs</strong>, we design schema definitions, resolver functions, query/mutation patterns, and subscription endpoints that provide flexible, efficient data access. We implement robust <strong>authentication and authorization</strong> using JWT, OAuth 2.0, API keys, session management, and role-based access control. Every API includes comprehensive <strong>documentation</strong> generated using OpenAPI/Swagger, GraphiQL, or Postman collections, ensuring other developers can integrate easily and confidently.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">API Architecture Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  RESTful, GraphQL, gRPC, or WebSocket API design with resource modeling, versioning strategy, pagination, and caching architecture.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Authentication &amp; Security</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  JWT, OAuth 2.0, API key auth, RBAC, input validation, rate limiting, and security headers following OWASP best practices.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Testing &amp; Documentation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unit tests, integration tests, contract testing, load testing, and auto-generated OpenAPI/Swagger documentation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">CI/CD &amp; Monitoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated testing pipelines, deployment automation, monitoring, logging, and alerting for production APIs.
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
                Technologies and Frameworks We Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our API developers are proficient across the full backend technology stack. For <strong>Node.js</strong>, our specialists use Express.js for lightweight APIs, NestJS for enterprise-grade applications with built-in dependency injection and modular architecture, and Fastify for high-performance microservices. For <strong>Python</strong>, we use FastAPI for async-first modern APIs, Django REST Framework for full-featured web applications with built-in admin, and Flask for lightweight microservices. For <strong>Gem Ruby</strong>, we use Ruby on Rails with its API-only mode and Sinatra for simple endpoints. For <strong>PHP</strong>, we use Laravel with its elegant syntax and built-in features. For <strong>Java</strong>, we use Spring Boot with Spring Security and Spring Data. For <strong>Go</strong>, we use Gin, Echo, and Fiber for high-performance, low-latency APIs. For <strong>Database integration</strong>, our specialists work with PostgreSQL, MySQL, MongoDB, Redis, and Supabase.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>microservices architecture</strong>, we design and implement services using Docker containers, Kubernetes orchestration, message queues (RabbitMQ, Apache Kafka, Redis Pub/Sub), and service meshes (Istio, Linkerd). For <strong>cloud deployment</strong>, we support AWS (API Gateway, Lambda, ECS, EKS), Google Cloud Platform (Cloud Run, Cloud Functions, GKE), Azure (Functions, App Service, AKS), and serverless platforms (Vercel, Netlify). For <strong>real-time communication</strong>, we implement WebSocket APIs and Server-Sent Events for chat applications, live dashboards, and notification systems. For <strong>API security</strong>, we implement input validation, SQL injection prevention, CORS handling, CSRF protection, and security headers. <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">For database-specific needs</Link>, see our dedicated database services, or <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">explore full web development</Link> for complete stack integration.
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
                Why TaskLynk for API Development
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                API development is more than writing endpoints—it requires deep understanding of architecture, security, scalability, and integration patterns. A poorly designed API becomes a technical debt that haunts your product for years, creating friction for developers, limiting scalability, and exposing security vulnerabilities. TaskLynk's marketplace connects you with senior API architects and backend engineers who have not only written production APIs but have designed and maintained systems handling millions of requests. Every API developer in our network has been vetted through code review assessments, security best practices evaluations, and portfolio verification of completed projects that are live in production.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical vetting, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each API milestone (design, implementation, testing, documentation) before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the developer, track progress against deliverables, and ensure the API meets your requirements. For full-stack projects, we can assemble teams combining <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">frontend developers</Link>, <Link href="/services/technical/react-development" className="text-primary font-semibold hover:underline">React specialists</Link>, and <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database engineers</Link>—all coordinated under one manager. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality API delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your API project</Link> today to receive bids from qualified backend engineers within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
