import type { CatalogueBundle } from '../types';

export const BUNDLES: CatalogueBundle[] = [
  {
    slug: 'survey-analysis-package',
    name: 'Survey Analysis Package',
    tagline: 'End-to-end processing and statistical analysis for your survey research.',
    description:
      'A complete survey analytics solution bringing together data hygiene, descriptive summaries, hypothesis testing, visualization, and a narrative findings report. Designed for researchers and survey teams seeking rigorous, ready-to-use results.',
    idealFor: [
      'Postgraduate students completing survey-based research',
      'NGO monitoring teams processing baseline or evaluation data',
      'Market researchers analyzing structured questionnaires',
    ],
    includes: [
      { serviceSlug: 'excel-data-cleaning-analysis', note: 'Dataset inspection, variable hygiene, and missing value treatment' },
      { serviceSlug: 'descriptive-inferential-statistics', note: 'Frequencies, percentages, means, and standard deviations' },
      { serviceSlug: 'hypothesis-testing', note: 'Parametric or non-parametric tests mapped to study hypotheses' },
      { serviceSlug: 'charts-graphs-data-visualization', note: 'High-resolution APA or executive formatted charts and figures' },
      { serviceSlug: 'quantitative-data-interpretation', note: 'Plain English interpretation explaining what the numbers mean' },
    ],
    deliverables: [
      'Cleaned and validated survey dataset (.sav and .xlsx)',
      'Complete statistical analysis output log and syntax script',
      'Formatted APA results tables and high-resolution charts',
      'Comprehensive narrative results report with key findings interpretation',
    ],
    turnaround: 'Typically 3 to 7 business days depending on questionnaire length and sample size.',
    discountPercent: 15,
    fixedPrice: null,
    published: true,
    orderable: true,
  },
  {
    slug: 'thesis-data-analysis-package',
    name: 'Thesis Data Analysis Package',
    tagline: 'Objective-to-method alignment, statistical execution, and Chapter Four interpretation.',
    description:
      'Structured statistical guidance crafted specifically for thesis and dissertation candidates. We map each of your study objectives to the appropriate analytical technique, clean your research data, execute the models, format publication-ready tables, and provide a walkthrough so you can defend your findings with confidence.',
    idealFor: [
      'Masters candidates preparing dissertation Chapter Four results',
      'PhD researchers executing complex empirical models',
      'Candidates preparing for oral defence (viva voce) questions on statistics',
    ],
    includes: [
      { serviceSlug: 'thesis-data-analysis', note: 'Mapping research objectives directly to statistical procedures' },
      { serviceSlug: 'data-transformation-preparation', note: 'Data preparation, recoding, and normality/reliability screening' },
      { serviceSlug: 'chapter-four-results-presentation', note: 'Results tables, graphical figures, and APA-compliant structure' },
      { serviceSlug: 'quantitative-data-interpretation', note: 'Thorough narrative explanation of every test result' },
      { serviceSlug: 'one-to-one-research-methodology-consultation', note: 'Live walkthrough session to answer questions and prepare for defence' },
    ],
    deliverables: [
      'Objective-by-objective statistical output tables',
      'Full syntax/script file for complete methodological reproducibility',
      'Draft-ready Chapter Four narrative results interpretation writeup',
      '1-on-1 virtual consultation walkthrough with the assigned specialist',
    ],
    turnaround: 'Typically 5 to 10 business days with milestone reviews.',
    discountPercent: 18,
    fixedPrice: null,
    published: true,
    orderable: true,
  },
  {
    slug: 'business-reporting-package',
    name: 'Business Reporting Package',
    tagline: 'From scattered spreadsheets to executive dashboards and automated management reports.',
    description:
      'Turn disparate commercial records, M-Pesa receipts, and operations logs into a unified management information system. Includes spreadsheet sanitization, KPI metric definitions, Power BI or Excel dashboard development, management commentary, and staff handover.',
    idealFor: [
      'Growing SMEs seeking actionable visibility into sales and margins',
      'NGOs managing multi-donor project indicators and expenditure tracking',
      'Business consultants presenting findings to executive boards',
    ],
    includes: [
      { serviceSlug: 'excel-data-cleaning-analysis', note: 'Spreadsheet audit, error removal, and automated data consolidation' },
      { serviceSlug: 'kpi-tracking-performance-reporting', note: 'Formulation of key indicators and target performance thresholds' },
      { serviceSlug: 'power-bi-dashboard-development', note: 'Interactive dashboard with dynamic drill-downs and filters' },
      { serviceSlug: 'management-reports', note: 'Executive summary report highlighting trends, bottlenecks, and recommendations' },
      { serviceSlug: 'recurring-report-automation', note: 'Documentation, handover guide, and refresh protocols' },
    ],
    deliverables: [
      'Consolidated clean master data model',
      'Interactive Power BI (.pbix) or Excel automated dashboard',
      'Executive summary management report (PDF / Word)',
      'Technical handover documentation and 45-minute staff walkthrough session',
    ],
    turnaround: 'Typically 7 to 14 business days depending on data sources.',
    discountPercent: 20,
    fixedPrice: null,
    published: true,
    orderable: true,
  },
  {
    slug: 'data-analysis-skills-package',
    name: 'Data Analysis Skills Package',
    tagline: 'Practical tool mastery: hands-on lessons, practice datasets, and a guided project.',
    description:
      'An accelerated practical learning pathway designed to build genuine autonomy. Select your tool of choice (SPSS, Excel, R, Python, Stata, or Power BI) and progress from foundational setup through real data manipulation to presenting an end-to-end analytical project with expert feedback.',
    idealFor: [
      'Students and researchers who want to analyze their own current or future projects',
      'Professionals seeking high-demand data skills on their CV',
      'Organisations training staff to handle internal monitoring independently',
    ],
    includes: [
      { serviceSlug: 'spss-for-beginners', note: 'Foundational training in the selected tool with structured modules' },
      { serviceSlug: 'excel-for-data-analysis-training', note: 'Practical exercises and real-world scenario workbooks' },
      { serviceSlug: 'statistics-hypothesis-testing-training', note: 'Conceptual clarity on distributions, tests, and interpretation' },
      { serviceSlug: 'data-interpretation-reporting-training', note: 'Guided analysis project executed by the learner with specialist mentoring' },
    ],
    deliverables: [
      'Four to six 75-minute live 1-on-1 virtual training sessions',
      'Practice dataset library and reusable analysis templates',
      'Detailed review and critique of the learner capstone project',
      'Follow-up Q&A session 2 weeks after course completion',
    ],
    turnaround: 'Flexible scheduling over 2 to 6 weeks to fit the learner calendar.',
    discountPercent: 15,
    fixedPrice: null,
    published: true,
    orderable: true,
  },
];

export function getBundle(slug: string): CatalogueBundle | undefined {
  return BUNDLES.find((b) => b.slug === slug);
}

