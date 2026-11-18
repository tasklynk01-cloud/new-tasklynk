import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { siteConfig } from '@/lib/seo-config';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { BlueprintIllustration } from '@/components/blog-guides/technical-services/blueprint-hero';
import { blogMeta } from './meta';

const path = `/blog/${blogMeta.slug}`;

export const metadata: Metadata = generateCanonicalMetadata(path, {
  title: 'Software Development Services in Kenya: A Practical Guide',
  description:
    'Plan web, React, API, database and automation work in Kenya with a managed specialist. Learn how to write a brief, review milestones and keep code ownership.',
  keywords: blogMeta.keywords,
  openGraph: {
    type: 'article',
    title: 'Software Development Services in Kenya: A Practical Guide',
    description: blogMeta.excerpt,
    publishedTime: blogMeta.date,
    siteName: 'TaskLynk',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software Development Services in Kenya: A Practical Guide',
    description: blogMeta.excerpt,
  },
});

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
const linkCls =
  'font-semibold text-[#c2410c] underline decoration-[#FF7A3D]/50 underline-offset-2 hover:text-[#E9662F] dark:text-[#ffb18a]';

const services = [
  { href: '/services/technical/web-development', name: 'Web development', text: 'Business sites, portals, dashboards and web applications.' },
  { href: '/services/technical/react-development', name: 'React development', text: 'Component based interfaces and Next.js front ends.' },
  { href: '/services/technical/api-development', name: 'API development', text: 'Documented endpoints and integrations between systems.' },
  { href: '/services/technical/database-services', name: 'Database services', text: 'Schema design, queries and data structure reviews.' },
  { href: '/services/technical/automation-services', name: 'Automation services', text: 'Scripts and workflows that remove repeated manual work.' },
  { href: '/services/technical/ai-development', name: 'AI development', text: 'Practical AI features scoped to a clear business need.' },
];

const steps = [
  { n: '01', t: 'Brief', d: 'You describe the goal, users, deadline and any existing systems.' },
  { n: '02', t: 'Scope', d: 'The project manager and specialist agree deliverables and milestones.' },
  { n: '03', t: 'Build', d: 'Work happens in a repository and a staging environment you can see.' },
  { n: '04', t: 'Review', d: 'You test each milestone and send clear, written feedback.' },
  { n: '05', t: 'Handover', d: 'Code, documentation and access move to accounts that you own.' },
];

const checklist = [
  'Code ownership is stated in writing before the build starts.',
  'The repository sits in an account owned by the client, or is transferred at handover.',
  'Passwords, API keys and database credentials are never shared in chat messages.',
  'Secrets live in environment variables or a secrets manager, never in the code.',
  'A staging environment exists so changes are tested before they reach real users.',
  'Customer data used for testing is minimal, anonymised where possible and removed afterwards.',
  'Third party libraries are named in the handover notes with their licences.',
  'Backups and a rollback plan are agreed before the first release.',
];

const faqs = [
  { q: 'How do I hire a developer in Kenya through TaskLynk?', a: 'Describe your project, choose the closest technical service and submit the brief. A project manager reviews it, confirms that a suitable specialist is available and then agrees scope and milestones with you.' },
  { q: 'Can TaskLynk integrate M-Pesa into my application?', a: 'Payment integrations are a common API development task. The specialist works with the official provider documentation and your own provider account. You should confirm the exact scope in the brief and in the quotation.' },
  { q: 'Who owns the code at the end of the project?', a: 'Ownership terms should be agreed in writing before work starts. The intended outcome is that the client receives the code, documentation and access to the repository at handover.' },
  { q: 'How much does a project cost?', a: 'There is no fixed price list because projects differ widely. Cost is confirmed by quotation or by milestones after the scope is understood. You can read the general pricing approach on the pricing page.' },
  { q: 'Can a student get help with a final year project?', a: 'Yes, within academic rules. Specialists can explain concepts, review your design and give feedback on your code so that you learn. You remain responsible for the work you submit.' },
  { q: 'What if no specialist is available for my request?', a: 'Services are published only after suitable specialist availability is confirmed. If your request does not fit, the project manager will tell you honestly rather than accept work that cannot be delivered well.' },
];

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: blogMeta.title,
  description: blogMeta.excerpt,
  datePublished: blogMeta.date,
  dateModified: blogMeta.date,
  inLanguage: 'en-KE',
  mainEntityOfPage: `${siteConfig.url}${path}`,
  author: { '@type': 'Organization', name: 'TaskLynk' },
  publisher: { '@type': 'Organization', name: 'TaskLynk', url: siteConfig.url },
  keywords: blogMeta.keywords.join(', '),
};
const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.url}/blog` },
    { '@type': 'ListItem', position: 3, name: blogMeta.title, item: `${siteConfig.url}${path}` },
  ],
};
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-24 border-l-4 border-[#FF7A3D] pl-4 text-2xl font-bold text-[#22183D] sm:text-3xl dark:text-white">
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-lg font-semibold text-[#2a0e74] sm:text-xl dark:text-[#e9defa]">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-300">{children}</p>;
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] text-slate-800 dark:bg-[#140E24] dark:text-slate-200 relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <MainHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-[#DDD3E9]/40 bg-transparent relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20 relative z-10">
            <div>
              <nav aria-label="Breadcrumb" className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
                <Link href="/" className="hover:underline">Home</Link> / <Link href="/blog" className="hover:underline">Blog</Link> / Technical Services
              </nav>
              <p className="mt-6 inline-block rounded-full bg-[#5B3594] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                Technical Services Blueprint
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#22183D] sm:text-4xl lg:text-5xl dark:text-white">
                Software Development Services in Kenya: A Practical Guide
              </h1>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#4A4160] dark:text-[#DDD3E9]/90 font-normal">
                A plain language blueprint for startups, SMEs, NGOs and students who want to plan web, React, API, database and automation work, and keep control of the result.
              </p>
              <p className="mt-4 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">
                {blogMeta.date} · {blogMeta.readTime}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/catalogue/technical-services" className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A3D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E9662F] shadow-md shadow-[#FF7A3D]/25 transition-all hover:scale-[1.02]">
                  Browse technical services <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#brief" className="inline-flex items-center rounded-xl border border-[#2a0e74] px-6 py-3 text-sm font-semibold text-[#2a0e74] hover:bg-[#2a0e74] hover:text-white dark:border-[#e9defa] dark:text-[#e9defa] transition-all">
                  Jump to the brief template
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-[#FF7A3D]/40 bg-white p-3 shadow-sm dark:bg-[#140E24]">
              <BlueprintIllustration />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <nav aria-label="Contents" className="mt-10 rounded-xl border border-[#2a0e74]/20 bg-white p-5 dark:border-white/10 dark:bg-[#1b1233]">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#2a0e74] dark:text-[#e9defa]">Contents</p>
            <ol className="mt-3 grid list-decimal gap-1 pl-5 text-sm sm:grid-cols-2">
              {[
                ['why', 'Why technical work needs a plan'],
                ['map', 'The service map'],
                ['web', 'Web development in Nairobi'],
                ['react', 'React development'],
                ['api', 'API development'],
                ['db', 'Database design'],
                ['auto', 'Business process automation'],
                ['more', 'AI, programming support and writing'],
                ['brief', 'Project brief template'],
                ['life', 'Delivery lifecycle'],
                ['security', 'Security and ownership'],
                ['students', 'Student projects'],
                ['pricing', 'Pricing and availability'],
                ['faq', 'FAQ'],
              ].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="hover:text-[#E9662F] hover:underline">{label}</a></li>
              ))}
            </ol>
          </nav>

          <article>
            <H2 id="why">Why technical work needs a plan</H2>
            <P>
              Almost every organisation in Kenya now depends on software in some form. A shop in Nairobi takes orders through a website, a school in Eldoret keeps records in a database, an NGO in Kisumu tracks field data on phones, and a startup in Mombasa connects its app to mobile payments. Behind each of these is code that someone designed, wrote and maintained. When that work is planned well, the software quietly supports the business. When it is rushed, the result is often a site that breaks on a Friday evening or a system that nobody can change.
            </P>
            <P>
              This guide explains how to approach software development services in Kenya in a calm and practical way. It covers the main kinds of technical work, how to write a useful brief, what a healthy delivery process looks like and how to protect your code and your data. It is written for founders, office managers, project officers and students, not only for engineers.
            </P>
            <H3>Why many projects fail before any code is written</H3>
            <P>
              Most disappointing projects share the same early mistakes. The goal is vague, the audience is not defined, the deadline is fixed without checking the scope, and nobody writes down what finished means. A developer then has to guess, and every guess is a risk. A clear brief costs an hour or two of thought and often saves weeks of rework.
            </P>
            <H3>Why a managed route helps</H3>
            <P>
              If you want to hire a developer in Kenya directly, you carry the whole burden of vetting skills, agreeing scope and chasing progress. TaskLynk offers a managed alternative. A project manager coordinates a vetted specialist for you, helps translate your request into clear deliverables and keeps communication organised. You can see the full range on the <Link href="/catalogue/technical-services" className={linkCls}>technical services catalogue</Link>, and you can read the overview on the <Link href="/services/technical-services" className={linkCls}>technical services page</Link>. Managed IT freelancers are not a replacement for an in house engineering team, but for a defined project they give you a sensible balance between flexibility and accountability.
            </P>

            <H2 id="map">The service map</H2>
            <P>
              Before choosing a service, it helps to know what each one is for. The map below links to the six technical service pages that exist on TaskLynk. Pick the one closest to your need, and the project manager will help you combine them if your project crosses boundaries.
            </P>
          </article>
        </div>

        {/* Service map */}
        <section aria-label="Service map" className="bg-[#F5EEFB] py-10 dark:bg-[#1b1233]">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group rounded-xl border border-[#2a0e74]/20 bg-white p-5 transition hover:-translate-y-1 hover:border-[#FF7A3D] dark:border-white/10 dark:bg-[#140E24]">
                <p className="font-mono text-xs text-[#c2410c] dark:text-[#ffb18a]">{'<service />'}</p>
                <h3 className="mt-2 text-lg font-bold text-[#22183D] dark:text-white">{s.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{s.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#c2410c] group-hover:text-[#E9662F] dark:text-[#ffb18a]">
                  View service <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <article>
            <H2 id="web">Web development in Nairobi and across Kenya</H2>
            <P>
              Web development Nairobi teams and freelancers offer ranges from a simple brochure site to a full customer portal. The right choice depends on what your visitors need to do. A restaurant needs a menu, a location and a way to reserve a table. A logistics company may need a dashboard where clients track deliveries. These are very different builds even though both are called websites. You can read more about the scope of this work on the <Link href="/services/technical/web-development" className={linkCls}>web development service page</Link>.
            </P>
            <H3>Design for the phone first</H3>
            <P>
              Most Kenyan internet users reach the web through a phone, often on a mobile data bundle that they watch closely. Pages should therefore load quickly, use compressed images and avoid heavy scripts that serve no purpose. Ask your specialist how the site will behave on a mid range Android phone with a slow connection. The documentation at <a href="https://developer.mozilla.org" {...ext} className={linkCls}>MDN Web Docs</a> is an excellent neutral reference for web standards, accessibility and performance, and a good specialist will follow it.
            </P>
            <H3>Search visibility and content</H3>
            <P>
              A site that nobody finds does not help the business. Sensible structure, clear page titles, readable headings and honest content make a real difference. Search optimisation is not a trick, it is mostly careful craft. If you also need copy, product descriptions or documentation, the technical writing support described later in this guide can sit alongside the build.
            </P>
            <H3>Hosting and maintenance</H3>
            <P>
              Many first time clients forget to ask who will host the site, who pays for the domain and who applies updates after launch. Write these answers into the brief. Keep the domain registration in your own name, and make sure you know where backups are stored. A site without maintenance slowly becomes a security risk.
            </P>

            <H2 id="react">React development for modern interfaces</H2>
            <P>
              React is a widely used library for building user interfaces from reusable components. It suits applications where the screen changes often in response to user actions, such as dashboards, booking tools, learning platforms and internal admin systems. The official site at <a href="https://react.dev" {...ext} className={linkCls}>react.dev</a> explains the core ideas, and the <a href="https://nextjs.org" {...ext} className={linkCls}>Next.js documentation</a> covers a popular framework built on top of it, including routing, server rendering and deployment.
            </P>
            <H3>When React is a good fit</H3>
            <P>
              Choose React development when your product has many interactive parts, when you expect the interface to grow, or when you want a design system that stays consistent across screens. For a five page company site, a simpler approach may be cheaper and easier to maintain. An honest specialist will tell you this, and you should value that advice. The <Link href="/services/technical/react-development" className={linkCls}>React development service page</Link> describes what can be requested.
            </P>
            <H3>Code quality you can check</H3>
            <P>
              You do not need to read code to judge quality. Ask for a short README that explains how to run the project, a clear folder structure, and a list of the main components. Ask whether the project includes type checking and basic tests for the most important flows. These are signs of a specialist who expects someone else to take over the work one day, which is exactly the attitude you want.
            </P>

            <H2 id="api">API development and system integration</H2>
            <P>
              An API is a defined way for one piece of software to talk to another. When your website sends an order to your stock system, or when your app asks a payment provider to start a request, an API carries the message. API development is the work of designing, building, securing and documenting those connections. It is often the least visible part of a project and one of the most important. Details of what can be requested are on the <Link href="/services/technical/api-development" className={linkCls}>API development service page</Link>.
            </P>
            <H3>Payments and local integrations</H3>
            <P>
              M-Pesa integration, in general terms, means connecting your application to the payment provider so that customers can pay and your system can confirm the result. The specialist works from the official provider documentation and your own provider account, and you remain the owner of the business credentials. Testing in a sandbox before using real money is essential. Treat any promise to integrate payments in an afternoon with caution, because confirmation handling, failures and reconciliation take careful work.
            </P>
            <H3>Documentation and security</H3>
            <P>
              A good API is documented so that another developer can use it without asking questions. The OpenAPI approach, described at <a href="https://swagger.io" {...ext} className={linkCls}>Swagger</a>, is a common way to describe endpoints clearly. Security matters equally. The <a href="https://owasp.org" {...ext} className={linkCls}>OWASP</a> community publishes widely respected guidance on common web and API risks, such as weak authentication and exposed data, and it is a sensible checklist to hand to any specialist.
            </P>

            <H2 id="db">Database design services</H2>
            <P>
              A database is the memory of your system. If it is designed badly, every feature built on top becomes slower, more fragile and more expensive. Database design services cover choosing the right structure for your data, defining tables and relationships, writing efficient queries and planning how data is backed up and restored. See the <Link href="/services/technical/database-services" className={linkCls}>database services page</Link> for the scope.
            </P>
            <H3>Start with the questions you need to answer</H3>
            <P>
              Good design begins with the reports and decisions the business needs. A clinic may need to know how many patients return within a month. A cooperative may need to see contributions by member and by season. Once those questions are written down, the structure of the data becomes much clearer. If your main need is turning stored data into insight, the <Link href="/catalogue/business-data-analysis-reporting" className={linkCls}>business data analysis and reporting catalogue</Link> is a natural companion.
            </P>
            <H3>Choose proven tools</H3>
            <P>
              Relational databases remain a strong default for most business systems. The <a href="https://www.postgresql.org" {...ext} className={linkCls}>PostgreSQL project</a> publishes thorough documentation on modelling, indexing and reliability. Your specialist may recommend another tool for a good reason, and you should ask them to explain the trade offs in plain language. Data about people deserves particular care, so also discuss who may see what, and how long records are kept.
            </P>

            <H2 id="auto">Business process automation in Kenya</H2>
            <P>
              Business process automation Kenya organisations adopt usually starts with a small irritation. Someone copies figures from one spreadsheet to another every Monday. Someone retypes form submissions into a system. Someone sends the same reminder to forty people by hand. Automation replaces these repeated steps with scripts or workflows that run reliably. The <Link href="/services/technical/automation-services" className={linkCls}>automation services page</Link> lists what can be requested.
            </P>
            <H3>Find the right task to automate</H3>
            <P>
              The best candidates are tasks that are frequent, rule based and tedious. Tasks that need judgement, or that change every week, are poor candidates. List the steps, note who does them and how long they take, and share that list in your brief. The specialist can then tell you honestly whether automation is worth the effort.
            </P>
            <H3>Keep a human in the loop</H3>
            <P>
              Automation should make mistakes easier to spot, not harder. Ask for logs that show what ran and when, alerts when something fails and a simple way to pause the process. An SME with a small team cannot afford a silent failure that goes unnoticed for a month.
            </P>

            <H2 id="more">AI development, programming support and technical writing</H2>
            <H3>AI development with a clear purpose</H3>
            <P>
              AI features can help with tasks such as classifying messages, summarising documents or answering common customer questions. They work best when the problem is narrow and the data is available. Define what a good result looks like and how a person will check it. The <Link href="/services/technical/ai-development" className={linkCls}>AI development service page</Link> describes the type of work that can be requested. Be cautious of any claim that an AI feature will be perfect, because every such system needs review.
            </P>
            <H3>Programming support</H3>
            <P>
              Not every need is a full project. Sometimes a team has a bug that nobody can find, a script that needs improving, or code that needs a second pair of eyes. Programming support offers focused help of this kind, and it is often the quickest way to unblock a team.
            </P>
            <H3>Technical writing services</H3>
            <P>
              Technical writing services turn complex systems into clear instructions. This includes user guides, setup notes, API documentation and handover manuals. Documentation is often the first thing cut when a deadline is near, and the first thing missed when a developer leaves. Including it in the scope from the start protects the investment you have made in the software.
            </P>
          </article>
        </div>

        {/* Brief template */}
        <section id="brief" aria-labelledby="brief-title" className="scroll-mt-24 bg-[#22183D] py-12 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffb18a]">Template for customers</p>
            <h2 id="brief-title" className="mt-2 text-2xl font-bold sm:text-3xl">Project brief template</h2>
            <p className="mt-3 leading-7 text-slate-200">
              Copy the panel below into your request and replace each placeholder with your own details. It is a writing aid for you, not code from any product. The more specific your answers, the better the quotation and the milestones.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-[#FF7A3D]/50 bg-[#140E24] p-5 font-mono text-sm leading-7 text-[#f3e8ff]" aria-label="Project brief template with placeholders to fill in">
{`PROJECT BRIEF (fill in every field)

organisation:      [name, sector, county]
project_goal:      [one sentence: what should change?]
users:             [who will use it, how many, which devices]
service_needed:    [web | react | api | database | automation | ai]
existing_systems:  [website, spreadsheets, payment provider, etc.]
must_have:         [3 to 5 features that are essential]
nice_to_have:      [features that can wait]
integrations:      [payments, SMS, email, other systems]
deadline:          [date and the reason for it]
budget_approach:   [milestones or quotation, no figures required]
ownership:         [who owns code, domain and hosting]
documentation:     [user guide, API notes, handover manual]
contact_person:    [name and preferred time to talk]`}
            </pre>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <article>
            <H2 id="life">The delivery lifecycle: brief, scope, build, review, handover</H2>
            <P>
              A predictable process reduces anxiety for everyone. The five stages below describe how a well managed technical project moves from an idea to a working result. On TaskLynk, the project manager keeps the stages visible so that you always know where the work stands.
            </P>
          </article>
        </div>
        <section aria-label="Delivery lifecycle" className="bg-[#F5EEFB] py-10 dark:bg-[#1b1233]">
          <ol className="mx-auto grid max-w-5xl gap-4 px-4 sm:px-6 md:grid-cols-5">
            {steps.map((s) => (
              <li key={s.n} className="relative rounded-xl border-2 border-dashed border-[#2a0e74]/30 bg-white p-4 dark:border-white/20 dark:bg-[#140E24]">
                <span className="font-mono text-2xl font-bold text-[#FF7A3D]">{s.n}</span>
                <h3 className="mt-1 font-bold text-[#22183D] dark:text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <article>
            <H3>Brief and scope</H3>
            <P>
              The brief is your description of the problem. The scope is the shared agreement on what will be delivered. Keep them separate in your mind. A brief says that you need customers to book appointments online. A scope says which pages, which confirmation messages, which admin screens and which payment options are included. Anything outside the scope should be handled as a clearly agreed change, not a surprise.
            </P>
            <H3>Build and review in small steps</H3>
            <P>
              Ask for work in milestones that you can test, rather than one large delivery at the end. After each milestone, use the feature as a real user would, and send feedback in writing with screenshots where possible. Specific comments such as the confirmation message does not appear after payment are far more useful than general remarks that something feels wrong.
            </P>
            <H3>Handover</H3>
            <P>
              Handover is more than sending a file. It includes the repository, the documentation, the list of services and accounts used, and a short walk through of how to run and update the system. Confirm that you can log in to everything with accounts that you control before the project is closed.
            </P>

            <H2 id="security">Security and ownership checklist</H2>
            <P>
              Trust is important, but trust should be backed by habits. The checklist below sets out practical protections for any software project, whether it is a small website or a larger system.
            </P>
          </article>
        </div>
        <section aria-label="Security and ownership checklist" className="py-6">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="rounded-2xl border border-[#2a0e74]/20 bg-white p-6 dark:border-white/10 dark:bg-[#1b1233]">
              <p className="flex items-center gap-2 font-bold text-[#22183D] dark:text-white">
                <ShieldCheck className="h-5 w-5 text-[#FF7A3D]" aria-hidden="true" /> Security and ownership checklist
              </p>
              <ul className="mt-4 space-y-3">
                {checklist.map((c) => (
                  <li key={c} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c2410c] dark:text-[#ff9b66]" aria-hidden="true" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <article>
            <H3>Why credentials never belong in chat</H3>
            <P>
              Chat messages are stored, forwarded and sometimes screenshotted. A password pasted into a conversation can outlive the project by years. If a specialist needs access, create a limited account with only the permissions required, share it through an agreed secure channel and remove it when the work ends. This protects you, and it protects the specialist as well.
            </P>
            <H3>Staging before production</H3>
            <P>
              A staging environment is a private copy of your system where changes can be tested safely. It lets you review a new checkout flow without risking real orders. Insist on it for anything that handles money or personal data.
            </P>

            <H2 id="students">Student projects and academic integrity</H2>
            <P>
              Many university and college students in Kenya need help with software projects, from a first web application to a final year system. The right kind of help builds understanding. A specialist can explain how a database should be structured, review your design, point out weaknesses in your code and suggest how to test it. That kind of guidance supports your own learning.
            </P>
            <P>
              It is not acceptable to submit work written by someone else as your own, and TaskLynk does not encourage it. Always follow your institution rules on what help is allowed, and be ready to explain every part of your project in your own words. Use guidance sessions to ask why, not only how. The student who understands the design will defend it confidently, and that confidence is worth far more than a finished file.
            </P>

            <H2 id="pricing">Pricing, availability and how to start</H2>
            <P>
              Software projects vary too much for a single price list, so TaskLynk does not publish invented figures. Cost is confirmed by quotation or by milestones once your scope is understood. For general information on how pricing works, see the <Link href="/pricing" className={linkCls}>pricing page</Link>.
            </P>
            <P>
              Services are published only after suitable specialist availability is confirmed. This means that you are matched with someone who can genuinely do the work, rather than being promised a service that cannot be staffed. If you are unsure which service fits, <Link href="/contact" className={linkCls}>contact the team</Link> and describe your goal in a few sentences. You can also read more practical advice in the <Link href="/blog" className={linkCls}>TaskLynk blog</Link>.
            </P>
            <H3>A short starting plan</H3>
            <P>
              Write the goal in one sentence. Fill in the brief template above. Choose the closest service from the service map. Submit your request through the <Link href="/catalogue/technical-services" className={linkCls}>technical services catalogue</Link>. Review the proposed scope with the project manager, and agree milestones before any work begins. Following these steps will not remove every risk, but it will remove the most common ones.
            </P>
          </article>

          <section id="faq" aria-labelledby="faq-title" className="mt-14 scroll-mt-24">
            <h2 id="faq-title" className="border-l-4 border-[#FF7A3D] pl-4 text-2xl font-bold text-[#22183D] sm:text-3xl dark:text-white">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-[#2a0e74]/20 bg-white p-4 open:border-[#FF7A3D] dark:border-white/10 dark:bg-[#1b1233]">
                  <summary className="cursor-pointer font-semibold text-[#22183D] dark:text-white">{f.q}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
        <section className="mt-10 bg-gradient-to-r from-[#22183D] to-[#2a0e74] py-14 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to plan your technical project?</h2>
            <p className="mt-3 leading-7 text-slate-200">
              Share your brief and a project manager will help you shape the scope with a vetted specialist.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/catalogue/technical-services" className="rounded-lg bg-[#FF7A3D] px-6 py-3 font-semibold text-[#22183D] hover:bg-[#E9662F] hover:text-white">
                Explore technical services
              </Link>
              <Link href="/contact" className="rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-[#22183D]">
                Talk to the team
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
