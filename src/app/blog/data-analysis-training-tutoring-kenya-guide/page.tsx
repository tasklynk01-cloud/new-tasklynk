import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, Clock, GraduationCap, Lightbulb, ArrowRight } from 'lucide-react';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import MainHeader from '@/components/site/main-header';
import SiteFooter from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { blogMeta } from './meta';

const PATH = '/blog/data-analysis-training-tutoring-kenya-guide';
const SITE = 'https://www.tasklynk.co.ke';
const TITLE = 'Data Analysis Training and Tutoring in Kenya Guide';
const DESCRIPTION =
  'Learn SPSS, Excel, R, Python, Stata and Power BI with a tutor in Kenya. Compare tools, skill levels, formats and a sample 4 week learning plan.';

export const metadata = generateCanonicalMetadata(PATH, {
  title: TITLE,
  description: DESCRIPTION,
  keywords: blogMeta.keywords,
  openGraph: {
    type: 'article',
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-10-29',
    siteName: 'TaskLynk',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
});

const A = 'text-[#E9662F] underline decoration-[#FF7A3D]/40 underline-offset-2 hover:text-[#FF7A3D] dark:text-[#FF9A6B]';

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={A}>
    {children}
  </a>
);
const Int = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className={A}>
    {children}
  </Link>
);

const P = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 leading-8 text-[#3b3254] dark:text-[#d9d2ea]">{children}</p>
);
const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mb-4 mt-12 scroll-mt-24 text-2xl font-bold text-[#22183D] dark:text-white sm:text-3xl">
    {children}
  </h2>
);
const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2 mt-7 text-lg font-semibold text-[#2a0e74] dark:text-[#e3d6ff] sm:text-xl">{children}</h3>
);

const tools = [
  { name: 'SPSS', badge: 'bg-blue-600', best: 'Surveys, theses and point and click statistics', level: 'Beginner friendly' },
  { name: 'Excel', badge: 'bg-green-700', best: 'Everyday analysis, pivot tables and dashboards', level: 'Beginner friendly' },
  { name: 'R', badge: 'bg-sky-700', best: 'Statistics, modelling and reproducible reports', level: 'Intermediate to advanced' },
  { name: 'Python', badge: 'bg-yellow-700', best: 'Data cleaning, automation and machine learning', level: 'Intermediate to advanced' },
  { name: 'Stata', badge: 'bg-red-700', best: 'Econometrics, panel data and health research', level: 'Intermediate' },
  { name: 'Power BI', badge: 'bg-amber-700', best: 'Business dashboards and reporting', level: 'Beginner to intermediate' },
];

const plan = [
  ['Week 1', 'Data foundations', 'Variable types, data entry, cleaning, coding and a codebook', 'A clean dataset with a short data dictionary'],
  ['Week 2', 'Describe and visualise', 'Frequencies, means, spread, tables and charts in the chosen tool', 'A descriptive summary of your own data'],
  ['Week 3', 'Test and interpret', 'Hypotheses, t tests, chi square, correlation, simple regression, p values and effect sizes', 'Two tests run and explained in plain language'],
  ['Week 4', 'Report and present', 'Writing results, formatting tables, a short dashboard or figure set, review', 'A results section draft that you can defend'],
];

const faqs = [
  {
    q: 'Which tool should I learn first for a university project in Kenya?',
    a: 'Start with what your department, supervisor or employer expects. Many Kenyan universities use SPSS or Stata for theses, while Excel and Power BI are common in business settings. A short discovery conversation with a tutor helps you choose before you spend time on the wrong tool.',
  },
  {
    q: 'Do I need to know statistics before I begin?',
    a: 'No. Beginner lessons start from variable types and simple summaries. The tutor builds the statistics alongside the software so that you understand why each step is taken.',
  },
  {
    q: 'Can lessons be held online?',
    a: 'Yes. Online sessions work well for screen sharing, live demonstrations and practice on your own dataset. Learners in Nairobi, Mombasa, Kisumu, Eldoret and beyond can join from home, a campus library or an office.',
  },
  {
    q: 'Will the tutor do my analysis for me?',
    a: 'Training is about helping you perform and understand your own analysis. The tutor explains, demonstrates and reviews your work, and you remain responsible for your own results and for following your institution rules.',
  },
  {
    q: 'How much does training cost?',
    a: 'Pricing depends on the tool, level, session length, number of sessions and whether the format is individual or small group. It is quoted per session or per course and confirmed by quotation before you commit. See the pricing page for how quotations work.',
  },
  {
    q: 'What should I bring to the first session?',
    a: 'Bring your research questions or learning goals, any dataset you already have (with sensitive details removed), your supervisor feedback if relevant, and a laptop with the software installed or a free alternative such as jamovi or R.',
  },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blogMeta.title,
    description: DESCRIPTION,
    datePublished: '2026-10-29',
    dateModified: '2026-10-29',
    mainEntityOfPage: `${SITE}${PATH}`,
    author: { '@type': 'Organization', name: 'TaskLynk' },
    publisher: { '@type': 'Organization', name: 'TaskLynk', url: SITE },
    keywords: blogMeta.keywords.join(', '),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: blogMeta.title, item: `${SITE}${PATH}` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
];

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      role="img"
      aria-label="Illustration of a laptop showing a bar chart, with a graduation cap, a pencil and a stack of books"
      className="h-auto w-full max-w-md"
    >
      <rect x="0" y="0" width="420" height="320" rx="28" fill="#EADFFB" />
      <rect x="40" y="215" width="150" height="20" rx="4" fill="#2a0e74" />
      <rect x="50" y="193" width="130" height="22" rx="4" fill="#FF7A3D" />
      <rect x="45" y="173" width="140" height="20" rx="4" fill="#6b4bc4" />
      <rect x="120" y="40" width="250" height="150" rx="10" fill="#22183D" />
      <rect x="132" y="52" width="226" height="126" rx="4" fill="#FAF8FD" />
      <rect x="150" y="130" width="28" height="38" fill="#a78bfa" />
      <rect x="190" y="105" width="28" height="63" fill="#FF7A3D" />
      <rect x="230" y="85" width="28" height="83" fill="#6b4bc4" />
      <rect x="270" y="68" width="28" height="100" fill="#FF7A3D" />
      <polyline points="164,122 204,96 244,78 284,62" fill="none" stroke="#22183D" strokeWidth="3" />
      <rect x="95" y="190" width="300" height="14" rx="7" fill="#2a0e74" />
      <polygon points="320,255 350,240 380,255 350,270" fill="#22183D" />
      <rect x="336" y="262" width="28" height="18" fill="#2a0e74" />
      <line x1="380" y1="255" x2="380" y2="285" stroke="#FF7A3D" strokeWidth="3" />
      <circle cx="380" cy="288" r="5" fill="#FF7A3D" />
      <rect x="215" y="262" width="95" height="8" rx="4" fill="#FF7A3D" transform="rotate(-12 215 262)" />
      <polygon points="212,264 202,268 214,270" fill="#22183D" />
    </svg>
  );
}

function SkillLadder() {
  const steps = [
    { n: 'Advanced', t: 'Modelling, scripting, reproducible workflows, panel and multivariate methods', w: 'w-full' },
    { n: 'Intermediate', t: 'Hypothesis tests, regression, data cleaning at scale, dashboards', w: 'w-4/5' },
    { n: 'Beginner', t: 'Data entry, variable types, descriptive statistics, basic charts', w: 'w-3/5' },
  ];
  return (
    <figure aria-label="Skill level ladder from beginner to advanced" className="my-6 space-y-3">
      {steps.map((s, i) => (
        <div
          key={s.n}
          className={`${s.w} rounded-xl border border-[#d9c8f3] bg-white p-4 dark:border-[#3a2c63] dark:bg-[#1c1433]`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7A3D] text-sm font-bold text-[#22183D]">
              {3 - i}
            </span>
            <span className="font-semibold text-[#22183D] dark:text-white">{s.n}</span>
          </div>
          <p className="mt-1 text-sm text-[#3b3254] dark:text-[#d9d2ea]">{s.t}</p>
        </div>
      ))}
    </figure>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#d9c8f3] bg-[#F5EEFB] p-5 dark:border-[#3a2c63] dark:bg-[#1c1433]">
      <h3 className="mb-3 text-lg font-semibold text-[#22183D] dark:text-white">{title}</h3>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-[#3b3254] dark:text-[#d9d2ea]">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#E9662F]" aria-hidden="true" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <MainHeader />
      <main>
        <header className="border-b border-[#DDD3E9]/40 bg-transparent relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16 relative z-10">
            <div>
              <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
                <Int href="/">Home</Int> / <Int href="/blog">Blog</Int> / <span>Training and tutoring</span>
              </nav>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EFE8F8] border border-[#DDD3E9] dark:border-[#3A2F5B] px-3.5 py-1 text-xs font-semibold text-[#5B3594] dark:bg-[#271E42] dark:text-[#EFE8F8]">
                <GraduationCap className="h-4 w-4 text-[#FF7A3D]" aria-hidden="true" /> Learning path classroom
              </p>
              <h1 className="text-3xl font-bold leading-tight text-[#22183D] dark:text-white sm:text-4xl lg:text-5xl tracking-tight">
                Data Analysis Training and Tutoring in Kenya: A Practical Learning Guide
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#6B627A] dark:text-[#DDD3E9]/90 font-normal">
                Pick the right tool, understand each skill level and follow a sample plan to learn SPSS, Excel, R,
                Python, Stata or Power BI with confidence.
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">
                <Clock className="h-4 w-4 text-[#FF7A3D]" aria-hidden="true" /> {blogMeta.readTime} · Published 29 October 2026
              </p>
            </div>
            <div className="flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article>
            <H2 id="why">Why learn data analysis with a tutor</H2>
            <P>
              Data skills have moved from a specialist subject to a basic requirement. A final year student in Nairobi
              needs to analyse questionnaire responses for a project. A graduate researcher in Kisumu must defend a
              methodology chapter in front of a panel. A programme officer at an NGO has to turn monitoring data into a
              donor report. An SME owner in Nakuru wants to understand which products actually earn money. Each of these
              people can learn the skill, and each one learns faster with guidance than with a pile of videos alone.
            </P>
            <P>
              Self study is valuable, but it often stalls at the same points: choosing a test, interpreting a table
              that looks nothing like the textbook example, or fixing an error message that makes no sense. A tutor
              shortens these delays. A good tutor listens to your actual research question, looks at your actual data
              and explains the reasoning in plain language, so that the next time you meet a similar problem you can
              handle it alone.
            </P>
            <P>
              This guide explains how data analysis training and tutoring work in practice, which tool suits which
              learner, what each skill level involves and what a sensible four week plan could look like. It is written
              for learners in Kenya, so the examples reflect common situations such as university theses, county level
              surveys, programme evaluations and small business reporting.
            </P>

            <H2 id="learner">Who this training is for</H2>
            <P>
              Training is designed around the learner, not the other way round. The most common learner groups are
              described below, along with what they usually need first.
            </P>
            <H3>Undergraduate and postgraduate students</H3>
            <P>
              Students usually need to analyse primary data collected through a questionnaire or interview guide. Their
              priorities are entering and cleaning data, running descriptive statistics, choosing suitable tests and
              writing results that match the objectives of the study. Many have a supervisor who expects a particular
              software package, so the choice of tool is often already decided.
            </P>
            <H3>Graduate researchers and academics</H3>
            <P>
              Researchers often already know the basics but want to move into regression, mixed models, panel data or
              reproducible workflows. They benefit from one to one sessions that focus on their own datasets and on
              the expectations of journals in their field.
            </P>
            <H3>NGO and public sector staff</H3>
            <P>
              Monitoring and evaluation officers need to summarise indicators, compare groups and present findings to
              non technical audiences. Training for this group leans towards Excel, Power BI, Google Forms exports and
              clear reporting, with enough statistics to avoid misleading conclusions.
            </P>
            <H3>SME owners and business analysts</H3>
            <P>
              Business learners want practical answers: sales trends, customer segments, stock movement and cost
              patterns. Excel and Power BI are usually the most direct route, and the lessons use the learner&apos;s own
              business records where possible.
            </P>

            <H2 id="paths">Choose your learning path: the main tools</H2>
            <P>
              No single tool is best for everyone. The right choice depends on your field, your supervisor or employer,
              your budget and how much programming you are willing to learn. The cards below summarise the six tools
              that appear most often in requests for data analysis training.
            </P>
            <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-[#d9c8f3] bg-white p-5 shadow-sm dark:border-[#3a2c63] dark:bg-[#1c1433]"
                >
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold text-white ${t.badge}`}>
                    {t.name}
                  </span>
                  <p className="mt-3 text-[#22183D] dark:text-white">{t.best}</p>
                  <p className="mt-2 text-sm font-medium text-[#6b4bc4] dark:text-[#c4b0ff]">{t.level}</p>
                </div>
              ))}
            </div>

            <H3>SPSS for beginners</H3>
            <P>
              If you want to learn SPSS in Kenya, you are in good company, because many universities teach it for
              social science, education, health and business research. Its menu driven design lets a beginner produce
              frequencies, cross tabulations, t tests, ANOVA, correlations and regression without writing code. A
              beginner course covers data entry, variable view, labelling, recoding, reliability checks and the correct
              reading of output tables. If a licence is a problem, <Ext href="https://www.jamovi.org">jamovi</Ext> is a
              free and friendly option with a similar spreadsheet style feel, and it is a good way to practise the
              same concepts.
            </P>
            <H3>Excel for data analysis</H3>
            <P>
              An Excel for data analysis course is often the best first step for working professionals. Lessons cover
              clean data layout, sorting and filtering, lookup functions, pivot tables, charts, conditional formatting
              and simple statistical functions. Learners who master these basics can already answer a large share of
              workplace questions, and they gain the habits needed to move later to heavier tools.
            </P>
            <H3>R programming for statistics</H3>
            <P>
              R is a free language built by statisticians. It shines for model fitting, graphics and reproducible
              reports. Learning R takes more patience at the start because you write commands, yet the payoff is a
              script that records every step of your analysis. You can read more about the language and download it
              from the <Ext href="https://www.r-project.org">R Project website</Ext>. Tutoring in R usually begins with
              importing data, using data frames, producing plots and running common tests, before moving on to
              regression and reporting.
            </P>
            <H3>Python for data analysis</H3>
            <P>
              Python is a general purpose language that has become very popular for analysis. With{' '}
              <Ext href="https://pandas.pydata.org">pandas</Ext> a learner can clean and reshape tables, merge files
              and produce summaries quickly. It suits learners who also want automation, web data collection or
              machine learning later. The language itself is documented at{' '}
              <Ext href="https://www.python.org">python.org</Ext>. A beginner path covers basic syntax, notebooks,
              pandas, plotting and a first look at statistical testing.
            </P>
            <H3>Stata training</H3>
            <P>
              Stata is widely used in economics, public health and development research, including many studies that
              use survey data or panel data. Its command style is compact and consistent, and its documentation is
              extensive. You can learn more about the software on the <Ext href="https://www.stata.com">Stata website</Ext>.
              Stata training typically covers importing data, labelling, do files, descriptive tables, regression,
              post estimation checks and exporting tables for a report.
            </P>
            <H3>Power BI training</H3>
            <P>
              For Power BI training in Kenya, the usual audience is business and programme staff who need dashboards
              that update when new data arrives. Lessons cover connecting to Excel or CSV files, shaping data in Power
              Query, building a simple model, writing basic measures and designing readable visuals. Microsoft maintains
              official guidance at <Ext href="https://learn.microsoft.com/power-bi">Microsoft Learn</Ext>, which is a
              helpful companion to live tutoring.
            </P>

            <H2 id="levels">The skill level ladder</H2>
            <P>
              Knowing where you stand saves time and money. Most learners fit one of three levels, and a short
              diagnostic conversation at the start of tutoring helps the tutor place you accurately. You can also move
              between levels in different tools, for example advanced in Excel and a beginner in R.
            </P>
            <SkillLadder />
            <H3>Beginner</H3>
            <P>
              A beginner has little or no experience of the tool. Sessions focus on orientation, data structure and
              first outputs. The goal is to be comfortable opening a file, understanding each variable and producing
              simple summaries that make sense.
            </P>
            <H3>Intermediate</H3>
            <P>
              An intermediate learner can already produce descriptive statistics and wants to test relationships and
              differences. This level introduces hypothesis testing, assumptions, regression and careful interpretation,
              as well as data cleaning for messy real world files.
            </P>
            <H3>Advanced</H3>
            <P>
              Advanced learners work on larger or more complex problems: multivariate methods, mixed effects, panel
              data, survey weighting, scripting and automation. Tutoring at this level often takes the form of a
              guided project where the tutor reviews decisions and suggests alternatives.
            </P>

            <H2 id="statistics">Statistics, hypothesis testing and research methods</H2>
            <P>
              Software is only half of the skill. The other half is knowing what the numbers mean. Good tutoring
              therefore blends tool lessons with the logic of statistics and the design of research.
            </P>
            <H3>Statistics and hypothesis testing</H3>
            <P>
              A tutor will usually explain the null and alternative hypotheses, the meaning of a p value, confidence
              intervals, effect size and the difference between statistical and practical significance. Learners then
              practise choosing a test: a t test for two group means, ANOVA for several groups, chi square for
              categorical association, correlation for linear relationships, and regression for prediction and
              adjustment. An online statistics tutor can walk you through each choice using your own research
              questions, which makes the ideas stick much better than abstract examples.
            </P>
            <H3>Quantitative research methods</H3>
            <P>
              Research methods tutoring covers sampling, questionnaire design, validity, reliability, ethics and the link
              between objectives and analysis. Many analysis problems are really design problems in disguise. If a
              sample is too small or a scale was built poorly, no software can repair it, and it is far better to
              discover this before data collection than after.
            </P>
            <H3>Qualitative software and mixed methods</H3>
            <P>
              Learners with interviews or focus group discussions may need training in qualitative coding tools,
              thematic analysis and ways to present themes with supporting evidence. Mixed methods learners also learn
              how to connect numerical results with narrative findings so that the two strands support each other.
            </P>
            <H3>Google Forms survey analysis</H3>
            <P>
              Many Kenyan learners collect data with Google Forms because it is free and easy to share. Training
              shows how to export responses to a spreadsheet, clean text answers, recode multiple choice items, handle
              missing responses and move the clean file into SPSS, R or Excel. Data interpretation lessons then help
              the learner describe patterns honestly and avoid claiming more than the sample supports.
            </P>

            <H2 id="formats">Formats, session length and materials</H2>
            <P>
              There is no single correct format. The right one depends on your schedule, your learning style and how
              much support you need.
            </P>
            <div className="my-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Individual lessons', 'One to one sessions focused on your questions and your data. Best for thesis work and for learners who want a flexible pace.'],
                ['Structured courses', 'A planned sequence of sessions with set topics and practice tasks. Best for learners who prefer a clear syllabus.'],
                ['Small groups', 'A few learners from the same class, team or organisation share sessions. Best for teams that use the same tool and want to split the cost.'],
                ['Guided projects', 'You complete a real analysis while the tutor reviews each step. Best for learners who already know the basics.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-[#d9c8f3] bg-white p-5 dark:border-[#3a2c63] dark:bg-[#1c1433]">
                  <h3 className="font-semibold text-[#22183D] dark:text-white">{t}</h3>
                  <p className="mt-2 text-[#3b3254] dark:text-[#d9d2ea]">{d}</p>
                </div>
              ))}
            </div>
            <H3>Session length</H3>
            <P>
              Sessions commonly run between sixty and ninety minutes, which is long enough to cover a topic and
              practise it without tiring the learner. Beginners often prefer shorter, more frequent sessions, while
              working professionals sometimes choose a longer weekend block. Your tutor can adjust the rhythm after the
              first lesson.
            </P>
            <H3>Prerequisites and materials</H3>
            <P>
              The main prerequisite is a willingness to practise between sessions. You need a reliable laptop, a stable
              internet connection for online lessons and the software installed, or a free alternative where a licence
              is not available. Useful materials include your research proposal, questionnaire, supervisor comments
              and a small sample dataset. Tutors can also supply practice files, short notes and exercises, which you
              keep for revision.
            </P>

            <H2 id="plan">A sample 4 week learning plan</H2>
            <P>
              The table below is an example plan only. It is not a fixed offering, and the real plan is adapted to your
              tool, your level and your goals. It shows how a motivated beginner or lower intermediate learner might
              move from raw data to a defensible results section in a month.
            </P>
            <div className="my-6 overflow-x-auto rounded-2xl border border-[#d9c8f3] dark:border-[#3a2c63]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="bg-[#F5EEFB] p-3 text-left font-semibold text-[#22183D] dark:bg-[#22183D] dark:text-white">
                  Example plan only: adapt to your tool and level
                </caption>
                <thead className="bg-[#2a0e74] text-white">
                  <tr>
                    <th scope="col" className="p-3">Week</th>
                    <th scope="col" className="p-3">Focus</th>
                    <th scope="col" className="p-3">Typical topics</th>
                    <th scope="col" className="p-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#3b3254] dark:bg-[#1c1433] dark:text-[#d9d2ea]">
                  {plan.map((r) => (
                    <tr key={r[0]} className="border-t border-[#e6dcf6] dark:border-[#3a2c63]">
                      <th scope="row" className="p-3 font-semibold text-[#22183D] dark:text-white">{r[0]}</th>
                      <td className="p-3">{r[1]}</td>
                      <td className="p-3">{r[2]}</td>
                      <td className="p-3">{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              Between sessions the learner completes short practice tasks on their own data. This independent practice
              is where most of the learning happens, and the tutor uses the next session to review mistakes and answer
              questions.
            </P>

            <H2 id="outcomes">What you should be able to do afterwards</H2>
            <P>
              Learning outcomes should be concrete. Here are example checklists that tutors and learners often agree
              on at the start. They describe skills, not results, because the quality of your analysis depends on your
              data and your effort.
            </P>
            <div className="my-6 grid gap-4 md:grid-cols-2">
              <Checklist
                title="Student and researcher outcomes"
                items={[
                  'Prepare and clean a dataset with a clear codebook',
                  'Choose a suitable test for each research objective',
                  'Read output tables and explain them in plain words',
                  'Write a results section that matches your objectives',
                  'Answer panel questions about your analysis choices',
                ]}
              />
              <Checklist
                title="Professional and business outcomes"
                items={[
                  'Build pivot tables and dashboards from your own records',
                  'Summarise programme indicators for a donor report',
                  'Spot errors and gaps in a messy spreadsheet',
                  'Present findings so that non technical readers follow them',
                  'Repeat the same analysis next month with new data',
                ]}
              />
            </div>

            <H2 id="integrity">Academic integrity and honest learning</H2>
            <P>
              Training is about building your own ability. A tutor can explain a concept, demonstrate a method on a
              practice file and review your work, but the analysis you submit must be yours, and you must follow the
              rules of your institution. If a project needs hands on help beyond learning, that is a different kind
              of service with its own conditions, and it should be agreed openly. Learners who keep this distinction
              clear end up with skills they can reuse, which is the real value of tutoring.
            </P>
            <P>
              Honest learning also means reporting limitations. A tutor should encourage you to describe the sample,
              admit the weaknesses of a scale and avoid claiming that a correlation proves a cause. These habits make
              your work more credible with supervisors, examiners and funders.
            </P>

            <H2 id="tasklynk">How TaskLynk supports learners</H2>
            <P>
              TaskLynk is a managed platform. When you request help, a project manager reviews your goals, level and
              schedule, and then coordinates a vetted specialist who suits the tool and the topic. You do not need to
              search for a tutor on your own or negotiate every detail. You can explore{' '}
              <Int href="/catalogue/data-analysis-training-tutoring">data analysis training and tutoring services</Int>{' '}
              to see the available formats.
            </P>
            <P>
              If your need is closer to doing a full analysis, see{' '}
              <Int href="/catalogue/data-analysis-statistics">data analysis and statistics support</Int>. For
              workplace reporting and dashboards, look at{' '}
              <Int href="/catalogue/business-data-analysis-reporting">business data analysis and reporting</Int>. For
              postgraduate work, there is{' '}
              <Int href="/catalogue/thesis-dissertation-research-support">thesis and dissertation research support</Int>.
              Pricing is set per session or per course and confirmed by quotation, and you can read how that works on the{' '}
              <Int href="/pricing">pricing page</Int>. Questions are welcome through the <Int href="/contact">contact page</Int>,
              and more guides are available on the <Int href="/blog">TaskLynk blog</Int>.
            </P>

            <H2 id="getting-started">How to get the most from your sessions</H2>
            <H3>Before the first session</H3>
            <P>
              Write down your research questions or your work problem in one or two sentences. Gather your data, even
              if it is incomplete. Install the software and test that it opens. List the three things that worry you
              most, such as choosing a test or reading regression output, so that the tutor can start with those.
            </P>
            <H3>During the sessions</H3>
            <P>
              Share your screen and do the clicks or commands yourself while the tutor guides you. Typing the code or
              choosing the menu options is how the skill moves into your own hands. Ask why at every step, and take
              short notes in your own words. If you do not understand an output, say so immediately rather than
              nodding along.
            </P>
            <H3>After each session</H3>
            <P>
              Repeat the exercise on a different variable or dataset within twenty four hours. Keep a simple log of
              what you did and what each result meant. Review the log before the next lesson. Over four weeks this
              habit builds a personal reference guide that is more useful than any generic notes.
            </P>

            <H2 id="mistakes">Common mistakes learners make</H2>
            <P>
              The first mistake is choosing a tool for its reputation rather than its fit. A learner who needs a quick
              dashboard may spend months on programming when Power BI would have done the job. The second is skipping
              data cleaning. Typing errors, inconsistent labels and missing values produce misleading outputs, and a
              tidy dataset is the foundation of every good analysis.
            </P>
            <P>
              The third mistake is running tests without a question. Analysis should follow your objectives, not the
              other way round. The fourth is copying output into a report without interpreting it. Examiners and
              managers want to know what the numbers mean for the study or the business. The fifth is waiting until
              the deadline is close. Learning takes repeated practice, so starting early lowers stress and improves
              results.
            </P>

            <H2 id="faq">Frequently asked questions</H2>
            <div className="my-6 space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-[#d9c8f3] bg-white p-4 dark:border-[#3a2c63] dark:bg-[#1c1433]"
                >
                  <summary className="cursor-pointer font-semibold text-[#22183D] dark:text-white">{f.q}</summary>
                  <p className="mt-3 leading-7 text-[#3b3254] dark:text-[#d9d2ea]">{f.a}</p>
                </details>
              ))}
            </div>

            <section
              aria-labelledby="cta-title"
              className="mt-12 rounded-3xl bg-gradient-to-r from-[#22183D] to-[#2a0e74] p-8 text-center text-white"
            >
              <h2 id="cta-title" className="text-2xl font-bold sm:text-3xl">Ready to start your learning path?</h2>
              <p className="mx-auto mt-3 max-w-xl text-[#e9e1f8]">
                Tell us your tool, your level and your goal. A project manager will coordinate a vetted specialist and
                confirm a quotation for your sessions.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catalogue/data-analysis-training-tutoring"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF7A3D] px-6 py-3 font-semibold text-[#22183D] hover:bg-[#E9662F]"
                >
                  Explore training and tutoring <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
                >
                  Contact us
                </Link>
              </div>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Learning tips">
            <div className="rounded-2xl border border-[#d9c8f3] bg-white p-5 dark:border-[#3a2c63] dark:bg-[#1c1433]">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#22183D] dark:text-white">
                <Lightbulb className="h-5 w-5 text-[#E9662F]" aria-hidden="true" /> Quick tips
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[#3b3254] dark:text-[#d9d2ea]">
                <li>Choose the tool your supervisor or employer expects.</li>
                <li>Practise on your own data between sessions.</li>
                <li>Keep a log of every step and result.</li>
                <li>Ask why, not only how.</li>
                <li>Start early and learn in short, regular blocks.</li>
              </ul>
            </div>
            <nav aria-label="On this page" className="rounded-2xl bg-[#F5EEFB] p-5 text-sm dark:bg-[#22183D]">
              <h2 className="mb-2 text-lg font-bold text-[#22183D] dark:text-white">On this page</h2>
              <ul className="space-y-1">
                {[
                  ['why', 'Why learn with a tutor'],
                  ['learner', 'Who it is for'],
                  ['paths', 'Choose your tool'],
                  ['levels', 'Skill levels'],
                  ['plan', 'Sample 4 week plan'],
                  ['outcomes', 'Outcomes'],
                  ['faq', 'FAQ'],
                ].map(([id, l]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-[#2a0e74] hover:underline dark:text-[#d9c8ff]">{l}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
