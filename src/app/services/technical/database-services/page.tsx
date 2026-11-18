import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, ShieldCheck, BarChart3, Server, Clock, Users, CheckCircle, Layout } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Database Development & Management Services | TaskLynk Marketplace',
  'Hire vetted database engineers for PostgreSQL, MySQL, MongoDB, Redis, and Supabase. Schema design, optimization, migration, backup, and security. Secure milestone payments and expert DBA support.',
  '/services/technical/database-services'
);

const faqs = [
  {
    question: 'Which databases do you specialize in?',
    answer: 'We specialize in PostgreSQL, MySQL, MongoDB, Redis, Microsoft SQL Server, Oracle, SQLite, MariaDB, Amazon DynamoDB, and Supabase. Our freelancers hold certifications and have hands-on experience with each database technology, including cloud deployment on AWS RDS, Google Cloud SQL, Azure Database, and managed services.',
  },
  {
    question: 'What database design services do you offer?',
    answer: 'We provide relational database design (entity-relationship modeling, normalization, schema design), NoSQL schema design (document, key-value, column-family, graph models), data modeling best practices, indexing strategies, partitioning, and performance optimization. We ensure your database schema is scalable, maintainable, and optimized for your specific query patterns.',
  },
  {
    question: 'Do you handle database migrations and upgrades?',
    answer: 'Yes. We perform database migrations between versions, platforms (MySQL to PostgreSQL, Oracle to cloud), and architectures (monolithic to distributed). We also handle schema migrations, data migration with validation, rollback planning, and zero-downtime migration strategies for production systems. All migrations include pre-migration testing and post-migration verification.',
  },
  {
    question: 'How do you handle database security and compliance?',
    answer: 'We implement encryption at rest and in transit, role-based access control, audit logging, SQL injection prevention, data masking, and backup/recovery strategies. We follow compliance frameworks including GDPR, HIPAA, SOC 2, and PCI-DSS. We also conduct security assessments and vulnerability scanning for database environments.',
  },
  {
    question: 'Do you provide performance optimization and tuning?',
    answer: 'Yes. We analyze query performance, optimize slow-running queries using EXPLAIN plans, recommend and implement index strategies, configure database parameters, optimize storage layouts, and implement caching layers using Redis or Memcached. We also design read replicas, connection pooling, and load balancing for high-traffic applications.',
  },
  {
    question: 'Do you offer ongoing database administration support?',
    answer: 'Yes. We provide part-time and full-time DBA support for PostgreSQL, MySQL, MongoDB, and Redis. Services include monitoring, backups, performance tuning, security patching, capacity planning, disaster recovery, and 24/7 on-call support for critical systems. We can assign dedicated DBAs or provide fractional DBA services for growing teams.',
  },
];

const relatedServices = [
  { label: 'API Development', href: '/services/technical/api-development' },
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'React Development', href: '/services/technical/react-development' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'SPSS Data Analysis', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function DatabaseServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/database-services"
      serviceSchemaName="Database Development & Management Services"
      serviceSchemaDescription="Professional database development and management services for PostgreSQL, MySQL, MongoDB, Redis, and Supabase. Schema design, optimization, migration, backup, security, and DBA support with vetted freelancers."
      heroEyebrow="Database Services"
      heroTitle="Database Development & Management Services"
      heroIntro="Your application is only as fast, reliable, and secure as its underlying data layer. A poorly designed database schema can create bottlenecks that slow your application to a crawl, while inadequate security can expose sensitive customer data to breaches. TaskLynk connects you with vetted database engineers—experts in PostgreSQL, MySQL, MongoDB, Redis, and Supabase—who design, optimize, migrate, and manage your data infrastructure. With secure milestone payments, NDA protection, and dedicated project management, your data layer is built to professional standards."
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
                This service is for teams and organizations that need professional database engineering. <strong>Startups</strong> building their first database-backed application who need expert schema design, technology selection, and performance optimization guidance. <strong>Enterprises</strong> with existing database infrastructure that needs optimization, migration, or security hardening. <strong>Development teams</strong> that need to augment database expertise for specific projects or ongoing maintenance. <strong>Data scientists and analysts</strong> who need help with data warehousing, ETL pipelines, and analytics database setup. <strong>E-commerce platforms</strong> requiring high-performance, scalable databases with real-time inventory and transaction processing. <strong>SaaS companies</strong> needing multi-tenant database architectures, data isolation strategies, and performance monitoring. <strong>Healthcare and fintech organizations</strong> requiring HIPAA or PCI-DSS compliant database environments with audit trails and encryption. <strong>Research institutions</strong> managing large datasets, experimental data archives, or analytical databases for statistical computing.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need database design, optimization, migration, administration, or security services—whether for a new application or an existing system—our database engineering service provides expert talent. We also support complementary services including <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link>, <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web development</Link>, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link> for analytics workflows.
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
                What We Offer: Professional Database Engineering and Administration
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our database services cover the complete data infrastructure lifecycle, from initial design and implementation through optimization, maintenance, and ongoing administration. We begin with <strong>database architecture and schema design</strong>—analyzing your application's data model, query patterns, and scalability requirements to design an optimal database structure. Our specialists choose between relational (PostgreSQL, MySQL), document (MongoDB), key-value (Redis), or hybrid architectures based on your use case, then design schemas that minimize redundancy, optimize for your most frequent queries, and scale with your growth. We implement proper normalization for transactional workloads, denormalization strategies for analytical queries, and indexing plans that balance read performance with write overhead.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>database optimization and performance tuning</strong>, we conduct comprehensive performance audits using EXPLAIN plans, query profiling tools, and monitoring dashboards. Our specialists identify slow queries, optimize execution plans, implement appropriate indexing strategies, configure database parameters for your workload, and design caching layers using Redis or Memcached to reduce database load. We also implement read replicas for high-traffic applications, connection pooling to manage concurrent connections efficiently, and partitioning strategies for large datasets. For <strong>database migration and modernization</strong>, we handle platform migrations (on-premises to cloud), version upgrades, schema evolution, and data migration with full validation. All migration projects include rollback planning, pre-migration testing, and post-migration verification to ensure zero data loss.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Schema Design &amp; Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Relational and NoSQL schema design, ER modeling, normalization, indexing strategies, and data modeling best practices.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Performance Optimization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Query profiling, EXPLAIN analysis, indexing, caching, read replicas, and connection pooling for optimal performance.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Migration &amp; Modernization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Platform migrations, version upgrades, schema evolution, and data migration with full validation and rollback planning.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Security &amp; Compliance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Encryption, access control, audit logging, vulnerability assessment, and compliance with GDPR, HIPAA, and PCI-DSS.
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
                Database Technologies We Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our database engineers are proficient across the full spectrum of database technologies. For <strong>relational databases</strong>, our specialists work with PostgreSQL (including advanced features like JSONB, full-text search, and custom extensions), MySQL (with performance tuning and replication), Microsoft SQL Server (including SSRS and SSIS), Oracle Database (with PL/SQL expertise), and MariaDB. For <strong>NoSQL databases</strong>, we handle MongoDB (document modeling, aggregation pipelines, indexing), Redis (caching strategies, data structures, pub/sub patterns), and other document or key-value stores. For <strong>cloud database services</strong>, we support AWS RDS, Google Cloud SQL, Azure Database, Amazon DynamoDB, Supabase, and managed database offerings from each cloud provider.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our specialists also handle <strong>data warehousing</strong> including Amazon Redshift, Google BigQuery, Snowflake, and Azure Synapse, with expertise in ETL/ELT pipeline design, star and snowflake schemas, and analytical query optimization. For <strong>database administration</strong>, we provide monitoring setup, backup and disaster recovery planning, security patching, capacity planning, and 24/7 on-call support for critical systems. For <strong>specialized analytics databases</strong>, we support integration with <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis environments</Link> and <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS statistical workflows</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures proper testing and validation at every stage. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your database project</Link> today.
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
                Why TaskLynk for Database Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Database engineering is foundational—get it wrong, and performance, security, and scalability issues compound over years. A poorly designed schema can make even a simple query take minutes. Inadequate security can expose sensitive customer data. Migration failures can result in data loss and downtime. TaskLynk's marketplace connects you with senior database engineers who have designed, optimized, and managed production databases handling millions of records and thousands of concurrent users. Every specialist in our network holds relevant certifications (PostgreSQL Professional, MySQL Certification, MongoDB Certification, AWS Database Specialty) and has verifiable experience with production systems.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each project phase before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the database engineer, track progress against milestones, and ensure requirements alignment. <strong>NDA protection</strong> safeguards your data architecture and infrastructure decisions. For full-stack projects, we can assemble teams combining <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API developers</Link>, <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web developers</Link>, and <Link href="/services/technical/react-development" className="text-primary font-semibold hover:underline">React frontend engineers</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures database quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your database project</Link> today to receive bids from qualified engineers within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
