import type { Metadata } from 'next';
import Link from 'next/link';
import { FileSpreadsheet, BarChart3, Calculator, Database, PieChart, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Excel Data Analysis Services | Hire Expert Excel Analysts',
  'Professional Excel data analysis services including pivot tables, formulas, dashboards, statistical analysis, VBA automation, and data visualization. Hire vetted Excel experts.',
  '/services/data-analysis/excel-data-analysis'
);

const faqs = [
  {
    question: 'What Excel analysis do you provide?',
    answer: 'We provide pivot table analysis, advanced formulas (INDEX-MATCH, VLOOKUP, XLOOKUP, SUMIFS, COUNTIFS), data cleaning and transformation, dashboard creation with charts and interactive elements, statistical analysis (regression, descriptive statistics, hypothesis testing), data visualization, VBA automation and macros, What-If analysis, Monte Carlo simulation, and Power Query/Power Pivot integration. We also handle data import from external sources.',
  },
  {
    question: 'Can you create interactive dashboards in Excel?',
    answer: 'Yes. We create professional, interactive Excel dashboards with pivot charts, slicers, timelines, form controls (drop-downs, scroll bars, buttons), conditional formatting, dynamic charts, and summary KPIs. Dashboards are designed for easy filtering and data exploration, with clear visual hierarchies and professional formatting.',
  },
  {
    question: 'Do you provide VBA automation services?',
    answer: 'Yes. We create VBA macros and scripts to automate repetitive tasks, generate custom reports, perform data manipulation, interact with other Office applications (Word, PowerPoint, Outlook), and build user forms. We also convert manual processes into automated workflows, reducing errors and saving time.',
  },
  {
    question: 'Can you help with Excel homework and assignments?',
    answer: 'Yes. We provide step-by-step Excel assistance for assignments, including pivot table creation, formula writing, chart generation, data analysis, and statistical procedures. We explain our approach and provide documented solutions that help you understand the methodology and learn the skills.',
  },
  {
    question: 'What file formats do you support?',
    answer: 'We work with all Excel formats including .xlsx, .xls, .xlsm (macro-enabled), .xlsb (binary), and CSV files. We also handle Excel files with Power Query connections, Power Pivot data models, and embedded charts. We can export results to PDF, other Excel files, or integrate with other data analysis tools.',
  },
  {
    question: 'How quickly can you complete Excel analysis?',
    answer: 'Simple pivot table and formula tasks are typically completed within 24-48 hours. Dashboard creation takes 2-5 days depending on complexity. Advanced VBA automation projects take 3-10 days. Statistical analysis and modeling take 2-7 days. Express 12-hour service is available for urgent needs. You specify your deadline, and we match you with an Excel expert who can commit to it.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Virtual Assistance', href: '/services/business/virtual-assistance' },
  { label: 'Power BI Dashboard', href: '/services/data-analysis/power-bi-dashboard' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function ExcelDataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/excel-data-analysis"
      serviceSchemaName="Excel Data Analysis Services"
      serviceSchemaDescription="Professional Excel data analysis services including pivot tables, advanced formulas, dashboards, statistical analysis, VBA automation, and data visualization. Hire vetted Excel experts."
      heroEyebrow="Excel Analysis"
      heroTitle="Excel Data Analysis Services | Hire Expert Excel Analysts"
      heroIntro="Excel remains the world's most widely used analytical tool, but mastering its advanced capabilities—pivot tables, complex formulas, VBA automation, statistical analysis, and interactive dashboards—can make the difference between drowning in spreadsheets and confidently driving decisions with data. Whether you're a student struggling with Excel homework, a business professional needing advanced dashboards, or a researcher conducting statistical analysis, TaskLynk connects you with vetted Excel experts—specialists in formulas, pivot tables, VBA, Power Query, and data visualization—who deliver clean, documented, and insightful Excel analysis. With secure milestone payments, NDA protection, and dedicated project management, your Excel needs are in expert hands."
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
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                This service is for anyone who works with Excel and needs expert-level support. <strong>University students</strong> at all levels who need help with Excel assignments, statistics projects, business analytics coursework, or thesis data analysis requiring pivot tables, regression, or advanced formulas. <strong>Business professionals</strong>—sales managers needing pipeline dashboards, finance teams requiring financial modeling, marketing analysts conducting campaign analysis, operations managers analyzing efficiency metrics, and executives who need automated reporting that used to take hours. <strong>Small business owners</strong> who need inventory management spreadsheets, sales tracking dashboards, financial reporting templates, and automated invoicing systems. <strong>Researchers</strong> conducting data analysis for academic papers, dissertations, or consulting projects using Excel for descriptive statistics, regression analysis, or survey data analysis. <strong>Administrative professionals</strong> who need to automate repetitive spreadsheet tasks using VBA macros and formulas. <strong>Data entry clerks</strong> who need help cleaning, validating, and organizing large datasets. <strong>Consultants and analysts</strong> who need advanced Excel models, sensitivity analysis, or scenario planning tools for client projects.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you need Excel expertise—whether for pivot tables, complex formulas, VBA automation, dashboard creation, or statistical analysis—our service provides vetted Excel specialists. We also support complementary services including <Link href="/services/data-analysis/data-analysis-services" className="text-primary font-semibold hover:underline">general data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>, and <Link href="/services/data-analysis/power-bi-dashboard" className="text-primary font-semibold hover:underline">Power BI dashboards</Link>.
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
                What We Offer: Advanced Excel Analysis and Automation
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our Excel data analysis service covers the complete range of Excel capabilities, from basic data organization through advanced analytics, automation, and interactive dashboard creation. We begin with <strong>data cleaning and preparation</strong>—identifying and removing duplicates, handling missing values, standardizing formats, correcting data type errors, validating entries against rules, and restructuring data from wide to long format or vice versa. Our specialists handle data import from CSV, databases, web queries, and other sources, using Power Query for automated data refresh and transformation pipelines that can be re-run with new data.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For <strong>advanced formula development</strong>, we implement complex calculations using functions including INDEX-MATCH combinations, SUMIFS and COUNTIFS for conditional aggregation, INDIRECT and OFFSET for dynamic ranges, array formulas and dynamic arrays (UNIQUE, FILTER, SORT, SEQUENCE), and data validation rules for drop-down lists. For <strong>pivot table analysis</strong>, we create multi-dimensional summaries, calculated fields and items, slicers and timelines for interactive filtering, and pivot charts with custom formatting. For <strong>VBA automation</strong>, we write macros and scripts to automate repetitive tasks, create custom functions, build user forms, interact with other Office applications, and generate automated reports. For <strong>statistical analysis</strong>, we use Excel's built-in Analysis ToolPak and formulas to perform regression analysis, ANOVA, descriptive statistics, hypothesis testing, and Monte Carlo simulation.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Advanced Formulas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  INDEX-MATCH, VLOOKUP, XLOOKUP, SUMIFS, COUNTIFS, dynamic arrays, and data validation for complex calculations.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Pivot Tables &amp; Dashboards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-dimensional pivot tables, interactive dashboards with slicers, timelines, charts, and KPI indicators for data exploration.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Statistical Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Regression analysis, ANOVA, descriptive statistics, hypothesis testing, and Monte Carlo simulation using Analysis ToolPak.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">VBA Automation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom macros, automated reporting, user forms, and workflow automation to eliminate repetitive spreadsheet tasks.</p>
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
                Why TaskLynk for Excel Data Analysis
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Excel expertise is more than knowing which button to click—it requires understanding of data structures, formula logic, statistical methods, and automation principles that ensure reliable, maintainable spreadsheets. A spreadsheet with hidden errors, inefficient formulas, or poor structure can lead to costly mistakes and wasted time. TaskLynk's marketplace connects you with Excel experts who have not only mastered Excel's advanced features but also understand how to structure workbooks for clarity, maintainability, and scalability. Every Excel specialist in our network has verifiable experience with complex Excel projects, including financial models for real businesses, academic research analysis, automated reporting systems, and advanced dashboard development.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve deliverables before payment. <strong>Dedicated project managers</strong> coordinate between you and the specialist, ensure timeline adherence, and verify that work meets your requirements. <strong>NDA protection</strong> safeguards your data and business information. For broader analytical needs, we also offer <Link href="/services/data-analysis/data-analysis-services" className="text-primary font-semibold hover:underline">general data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>, and <Link href="/services/data-analysis/power-bi-dashboard" className="text-primary font-semibold hover:underline">Power BI dashboards</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your Excel project</Link> today to be matched with an expert within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
