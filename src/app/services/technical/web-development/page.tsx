import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Code2, Smartphone, ShieldCheck, Clock, Users, CheckCircle, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Hire Web Developers | Custom Websites & Web Applications',
  'Hire vetted web developers for custom websites, e-commerce platforms, SaaS applications, and responsive web development. Secure milestone payments, real-time collaboration, and expert full-stack talent.',
  '/services/technical/web-development'
);

const faqs = [
  {
    question: 'What types of websites do you build?',
    answer: 'We build everything from landing pages and corporate websites to e-commerce platforms, SaaS applications, marketplaces, dashboards, and custom web applications. Our network includes frontend specialists, backend engineers, full-stack developers, UI/UX designers, and DevOps engineers who can handle projects of any complexity and scale.',
  },
  {
    question: 'Do you handle both frontend and backend development?',
    answer: 'Yes. Our freelancers include full-stack developers who handle both frontend (HTML, CSS, JavaScript, React, Vue, Angular) and backend (Node.js, Python, PHP, Ruby, Go, Rust, Java) development. We also have specialists who focus exclusively on frontend or backend if you have an existing team and need augmentation in a specific area.',
  },
  {
    question: 'What tech stacks do your developers specialize in?',
    answer: 'Our network covers modern JavaScript ecosystems (Next.js, React, Vue, Angular, Svelte), backend frameworks (Express, NestJS, Django, Flask, FastAPI, Laravel, Ruby on Rails, Spring Boot), database technologies (PostgreSQL, MySQL, MongoDB, Redis, Supabase, Firebase), cloud platforms (AWS, GCP, Azure, Vercel, Cloudflare), and mobile-first responsive frameworks. When you post a project, we match you with developers experienced in your specific tech stack.',
  },
  {
    question: 'Can you deploy and host my website?',
    answer: 'Yes. Our developers handle deployment to platforms like Vercel, Netlify, AWS, GCP, Azure, and DigitalOcean. We configure CI/CD pipelines, set up domain names, SSL certificates, CDN distribution, performance optimization, and monitoring. We also provide documentation and training so you can manage your hosting independently if needed.',
  },
  {
    question: 'What is included in the development process?',
    answer: 'We follow an agile development process with iterative deliverables. This includes project scoping, wireframing, UI/UX design, frontend development, backend development, database design, API integration, testing (unit, integration, end-to-end), deployment, and post-launch support. We provide regular updates and demo sessions throughout the project, ensuring you can review progress and request changes.',
  },
  {
    question: 'Do you handle domain registration and hosting setup?',
    answer: 'Yes. We can assist with domain registration, DNS configuration, hosting setup, SSL certificate installation, and deployment. We work with your preferred providers or recommend cost-effective solutions based on your project requirements. We also provide documentation for ongoing management.',
  },
];

const relatedServices = [
  { label: 'React Development', href: '/services/technical/react-development' },
  { label: 'API Development', href: '/services/technical/api-development' },
  { label: 'Database Services', href: '/services/technical/database-services' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function WebDevelopmentPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/web-development"
      serviceSchemaName="Web Development Services"
      serviceSchemaDescription="Custom web development services including websites, e-commerce platforms, SaaS applications, and responsive web apps. Hire vetted full-stack developers with secure milestone payments and project management."
      heroEyebrow="Web Development"
      heroTitle="Hire Web Developers | Custom Websites & Web Applications"
      heroIntro="Your website or web application is often the first interaction customers, clients, or users have with your brand. A slow, broken, or confusing web experience can cost you credibility, conversions, and customers. But finding developers who combine technical skill with user-centered design—and who deliver on time and within budget—is a challenge on generic freelance platforms. TaskLynk connects you with vetted web developers—frontend specialists, backend engineers, and full-stack experts—who build custom websites, e-commerce platforms, and SaaS applications with secure milestone payments, real-time collaboration, and dedicated project management."
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
                This service is for businesses, organizations, entrepreneurs, and individuals who need custom web solutions. <strong>Startups</strong> launching their first product or MVP who need a landing page, SaaS application, or marketplace platform built quickly and professionally. <strong>Established businesses</strong> needing website redesigns, e-commerce migration, or custom web applications to streamline operations and improve customer experience. <strong>NGOs and non-profits</strong> requiring informational websites, donation platforms, or impact reporting dashboards. <strong>Academics and researchers</strong> who need custom web applications for data collection, visualization, or experimental platforms. <strong>Professionals and agencies</strong> who need to augment their development capacity for client projects or specific technical challenges. <strong>Entrepreneurs</strong> building marketplace platforms, booking systems, or SaaS products who need full-stack development expertise. <strong>Businesses needing e-commerce</strong> solutions, inventory management systems, or customer portals.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need a custom website, web application, or e-commerce platform built to your specifications—with professional quality, reliable performance, and ongoing support—this service provides expert development talent. We also support complementary services including <Link href="/services/technical/react-development" className="text-primary font-semibold hover:underline">React development</Link>, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database services</Link>, and <Link href="/services/technical/ai-development" className="text-primary font-semibold hover:underline">AI development</Link> for advanced functionality. For ongoing development support, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our freelancer network</Link> or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your project</Link> today.
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
                What We Offer: Full-Stack Development with Agile Delivery
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our web development service covers the complete development lifecycle, from initial concept and requirements gathering through design, development, testing, deployment, and post-launch support. We follow an agile methodology with iterative sprints, regular demo sessions, and continuous feedback loops to ensure the final product meets your vision. We begin with <strong>requirements analysis and project scoping</strong>, working with you to define features, user stories, technical constraints, and success metrics. Our project managers then create a detailed project plan with milestones, deliverables, and timeline commitments.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we move to <strong>design and prototyping</strong>. Our UI/UX designers create wireframes and interactive prototypes that establish the user experience flow, information architecture, and visual design. We use modern design systems and accessibility standards to ensure your application is usable by all users. Then comes <strong>frontend development</strong> using modern JavaScript frameworks—React, Next.js, Vue, Angular, or Svelte—to build responsive, accessible interfaces that work flawlessly across devices. Our frontend specialists use component-based architecture, modern CSS frameworks, and performance optimization techniques to deliver fast, engaging user experiences. <strong>Backend development</strong> follows with robust server-side logic using Node.js, Python, PHP, Ruby, or Go, including API design, database integration, authentication, authorization, and third-party service integration.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Frontend Development</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Responsive, accessible interfaces using React, Next.js, Vue, Angular, Svelte with modern CSS frameworks and performance optimization.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Backend Engineering</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Robust server logic with Node.js, Python, PHP, Ruby, or Go, including API design, database integration, and authentication.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">E-Commerce Platforms</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom e-commerce solutions with payment integration, inventory management, product catalogs, and customer accounts.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Security &amp; Deployment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SSL setup, security audits, CI/CD pipelines, cloud hosting, and performance optimization with monitoring.
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
                Tech Stacks and Frameworks We Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our development network covers modern web technologies across the full stack. For <strong>frontend development</strong>, our specialists use React (including Next.js for server-side rendering and static site generation), Vue.js (with Nuxt.js), Angular, Svelte (with SvelteKit), and modern CSS frameworks including Tailwind CSS, Bootstrap, and Styled Components. We also implement responsive design principles, progressive web app (PWA) features, accessibility compliance (WCAG 2.1), and performance optimization using techniques like code splitting, lazy loading, and image optimization.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>backend development</strong>, our specialists work with Node.js (Express, NestJS, Fastify), Python (Django, Flask, FastAPI), PHP (Laravel, Symfony), Ruby (Ruby on Rails), Go, and Rust. We implement RESTful APIs, GraphQL endpoints, real-time communication using WebSockets or Server-Sent Events, and microservices architectures. For <strong>database design</strong>, our specialists use PostgreSQL, MySQL, MongoDB, Redis, Supabase, Firebase, and more. For <strong>cloud and deployment</strong>, we support AWS, GCP, Azure, Vercel, Netlify, DigitalOcean, and Cloudflare Workers. <strong>E-commerce</strong> platforms include custom builds, Shopify integration, WooCommerce, and headless commerce solutions with Stripe, PayPal, and M-Pesa payment integration.
              </p>
            </div>
            <div className="text-center mt-8">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6">
                <Link href="/services/technical/react-development">
                  Learn About React Development
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for Web Development
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Web development is an investment—not just in technology, but in your business's future growth and user experience. Choosing the wrong developer can result in missed deadlines, security vulnerabilities, poor performance, and a product that fails to meet user needs. TaskLynk's marketplace mitigates these risks by connecting you with vetted web developers who have passed rigorous technical assessments and have verifiable portfolios of completed projects. Every developer in our network has at least 3 years of professional experience and demonstrates proficiency in modern development practices including version control, testing, code review, and security best practices.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical vetting, our managed marketplace provides <strong>secure milestone escrow</strong>—your payment is held by TaskLynk and released only after you approve each deliverable milestone, protecting you from upfront payment risks. <strong>Dedicated project managers</strong> coordinate between you and the developer, track progress against milestones, and ensure requirements alignment throughout the project. <strong>Real-time collaboration</strong> tools allow you to communicate directly with your developer, share feedback, and review progress at every stage. For complex projects, we can assemble teams that include frontend developers, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">backend API specialists</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database engineers</Link>, and <Link href="/services/technical/ai-development" className="text-primary font-semibold hover:underline">AI integration specialists</Link>—all coordinated under a single project manager. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your web development project</Link> today to receive bids from qualified developers within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
