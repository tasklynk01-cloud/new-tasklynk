import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Lightbulb, AlertTriangle, BarChart3, ChevronDown } from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { AnalyticsIllustration } from '@/components/blog-guides/statistical-data-analysis/analytics-illustration';
import { blogMeta } from './meta';

const PATH = '/blog/statistical-data-analysis-services-kenya-guide';
const SITE = 'https://www.tasklynk.co.ke';
const TITLE = 'Statistical Data Analysis in Kenya: A Practical Guide';
const DESCRIPTION =
  'Learn how statistical data analysis works in Kenya: SPSS, Stata, R and Python, choosing tests, regression, ANOVA, SEM, sample size and expert support.';

export const metadata: Metadata = generateCanonicalMetadata(PATH, {
  title: TITLE,
  description: DESCRIPTION,
  keywords: blogMeta.keywords,
  openGraph: {
    type: 'article',
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-10-29T00:00:00Z',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
});

type Sub = { h: string; p: string[] };
type Section = { id: string; title: string; intro: string[]; subs: Sub[] };

const sections: Section[] = [
  {
    id: 'what-it-means',
    title: 'What statistical data analysis support really means',
    intro: [
      'Statistical data analysis is the process of turning raw numbers into evidence that can answer a question. In a Kenyan university it usually appears at the point where a student has finished collecting questionnaires and suddenly faces a spreadsheet with hundreds of rows, a supervisor who wants results chapters, and software that looks unfamiliar. In an NGO or a small business it appears when a donor report, a market study or a monitoring and evaluation framework needs defensible figures.',
      'Good support does not replace your thinking. It sits beside you, explains the choices, runs the procedures with you, and helps you understand the output well enough to defend it. That is the difference between a table you can explain in a viva and a table you simply pasted into a document.',
    ],
    subs: [
      {
        h: 'Who usually needs help',
        p: [
          'Undergraduate students working on a final year project often need help with descriptive statistics, cross-tabulations and simple tests. Masters students tend to need regression, ANOVA, reliability analysis and factor analysis. PhD candidates frequently work with structural equation modelling, multilevel models, panel data or time series. Researchers in public health, agriculture, education, finance and the social sciences all meet these needs at different levels.',
          'Organisations in Nairobi, Mombasa, Kisumu, Nakuru and Eldoret also look for data analysis services when they need survey results, programme evaluation, customer insight or baseline and endline comparisons. The tools are the same, but the reporting style changes from an academic chapter to a clear business or donor brief.',
        ],
      },
      {
        h: 'What support can and cannot be',
        p: [
          'Ethical support focuses on your own research, your own data and your own understanding. It can include planning the analysis, checking assumptions, demonstrating the software steps, reviewing your interpretation and explaining results in plain language so you can write them up yourself. It should never be used to submit someone else work as your own. Your institution sets the rules for what help is allowed, and you remain responsible for following them.',
        ],
      },
    ],
  },
  {
    id: 'kenyan-context',
    title: 'Why the Kenyan context matters',
    intro: [
      'Research in Kenya has its own texture. Many studies rely on primary data collected through questionnaires, interviews and household surveys, often across counties with different languages, literacy levels and connectivity. Sampling frames are not always tidy, response rates vary, and field budgets are tight. Statistical choices need to respect those realities instead of copying a textbook example from a different setting.',
    ],
    subs: [
      {
        h: 'Common data situations in Kenyan research',
        p: [
          'Likert scale questionnaires are extremely common in business, education and social science dissertations. Health students often work with binary outcomes such as vaccinated or not vaccinated, which points toward logistic regression. Agriculture and environmental students handle experimental designs where ANOVA and post hoc comparisons are central. Economics and finance students work with panel or time series data, where econometric tests for stationarity, heteroskedasticity and autocorrelation matter.',
          'Each of these situations has a sensible default approach and a handful of traps. A specialist who has seen many similar datasets can point out the trap early, which saves weeks of rework near the submission deadline.',
        ],
      },
      {
        h: 'Supervisor and committee expectations',
        p: [
          'Supervisors in Kenyan universities usually expect a clear link between each objective, hypothesis, test and table. They also expect reliability and validity evidence for scales, a statement of assumptions checked, and an honest discussion of limitations. Planning your analysis around those expectations from the start makes the results chapter far easier to write.',
        ],
      },
    ],
  },
  {
    id: 'planning',
    title: 'Plan the analysis before you collect the data',
    intro: [
      'The cheapest time to fix a statistical problem is before fieldwork. Once questionnaires have been administered, you cannot add the variable you forgot or enlarge a sample that was too small. A short planning session with an analyst can prevent both.',
    ],
    subs: [
      {
        h: 'Turn objectives into testable hypotheses',
        p: [
          'Start with each research objective and write the question in a form that data can answer. An objective such as to establish the effect of mobile banking on SME growth becomes a hypothesis that mobile banking usage has no significant effect on SME growth, tested against an alternative. This is the logic behind hypothesis testing: you assume no effect, then ask whether your data are surprising enough to reject that assumption.',
          'Decide the variables, their measurement levels and the intended test for each hypothesis in a simple matrix. That matrix becomes the skeleton of your methodology and results chapters.',
        ],
      },
      {
        h: 'Sample size calculation',
        p: [
          'Sample size calculation answers the question of how many responses you need. For a survey estimating a proportion, the familiar formula uses the confidence level, the margin of error and the expected proportion, and a finite population correction when the population is small. For comparing groups or detecting an effect, a power analysis uses the expected effect size, the significance level and the desired power, commonly 0.80.',
          'Free tools such as G*Power can run these calculations, and a specialist can help you choose defensible assumptions and cite them properly. Remember to inflate the target for expected non-response, since the number you plan is not the number you will usually get back.',
        ],
      },
    ],
  },
  {
    id: 'cleaning',
    title: 'Clean and prepare your data',
    intro: [
      'Most analysis time is spent before any test is run. Data cleaning is unglamorous, but it decides whether the results can be trusted.',
    ],
    subs: [
      {
        h: 'Coding, missing values and outliers',
        p: [
          'Create a codebook that records every variable name, label, scale and value code. Check for impossible values, duplicate records and inconsistent coding, for example a Likert item entered as 55 instead of 5. Then examine missing data. Small amounts of random missingness can often be handled with listwise deletion or simple imputation, while larger or patterned gaps need more careful treatment such as multiple imputation.',
          'Outliers deserve a decision, not an automatic deletion. Check whether they are data entry errors, genuine extreme cases or a sign that your variable needs a transformation. Document what you did so a reader can follow the reasoning.',
        ],
      },
      {
        h: 'Reverse-coded items and composite scores',
        p: [
          'Scales often contain negatively worded items that must be reverse coded before you compute a total or mean score. After that, test internal consistency with Cronbach alpha and review item-total correlations. A scale with weak reliability may need an item removed or a different treatment, and it is better to discover that now than during your defence.',
        ],
      },
    ],
  },
  {
    id: 'choosing-tests',
    title: 'Choose the right statistical test',
    intro: [
      'Choosing a test is a matter of matching three things: the question you are asking, the type of data you have and the assumptions your data can support. The table below summarises the tests that Kenyan students and professionals meet most often.',
    ],
    subs: [
      {
        h: 'Parametric and non-parametric options',
        p: [
          'Parametric tests such as the t-test and ANOVA assume approximately normal residuals and similar variances across groups. When those assumptions fail badly, especially with small samples, non-parametric alternatives such as the Mann-Whitney U test or the Kruskal-Wallis test are safer. Large samples are more forgiving, but you should still check, report and justify your choice.',
        ],
      },
      {
        h: 'Effect sizes and practical significance',
        p: [
          'A p-value only tells you whether an effect is distinguishable from zero given your sample. It does not tell you whether the effect matters. Report effect sizes and confidence intervals alongside p-values so that readers can judge practical importance. The American Psychological Association guidance on reporting is a useful reference for this.',
        ],
      },
    ],
  },
  {
    id: 'regression-anova',
    title: 'Regression analysis and ANOVA in practice',
    intro: [
      'Regression and ANOVA are the workhorses of dissertation analysis. They are closely related, and understanding that relationship makes both easier to explain.',
    ],
    subs: [
      {
        h: 'Linear and multiple regression',
        p: [
          'Regression analysis estimates how an outcome changes as one or more predictors change. Before trusting the output, check linearity, independence of errors, constant variance, normality of residuals and multicollinearity, usually through variance inflation factors. When people search for regression analysis help, the most common problem is not running the model but interpreting coefficients, R squared and the F test correctly.',
          'Report unstandardised coefficients with their standard errors and confidence intervals, and explain what a one unit change means in the real setting of your study.',
        ],
      },
      {
        h: 'Logistic regression and other models',
        p: [
          'When the outcome is binary, such as whether a farmer adopted a new practice, logistic regression models the log odds and reports odds ratios. Ordinal outcomes call for ordinal regression, and count outcomes for Poisson or negative binomial models. Choosing the right family of model matters more than the software you use.',
        ],
      },
      {
        h: 'One-way, factorial and repeated measures ANOVA',
        p: [
          'ANOVA compares means across three or more groups. A significant overall F test tells you that at least one group differs, and post hoc tests such as Tukey identify which ones. Factorial designs add interaction effects, and repeated measures designs handle the same participants measured more than once. Check Levene test results for equal variances, and report effect sizes such as partial eta squared.',
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Factor analysis, reliability and structural equation modelling',
    intro: [
      'Postgraduate research often involves latent constructs such as customer satisfaction, organisational commitment or health literacy that cannot be measured directly. Multivariate methods help you build and test measurement of those constructs.',
    ],
    subs: [
      {
        h: 'Exploratory and confirmatory factor analysis',
        p: [
          'Exploratory factor analysis looks for the underlying structure in a set of items. Check sampling adequacy with the Kaiser-Meyer-Olkin measure and Bartlett test of sphericity, decide how many factors to keep using eigenvalues, scree plots or parallel analysis, and choose a rotation that fits your theory. Confirmatory factor analysis then tests whether a hypothesised structure fits new data.',
        ],
      },
      {
        h: 'Structural equation modelling',
        p: [
          'Structural equation modelling combines measurement models with path relationships between constructs. It lets you test mediation and moderation in a single framework. You will need to report fit indices such as CFI, TLI, RMSEA and SRMR, and justify any modification you make. Structural equation modelling needs adequate sample size and a strong theoretical basis, so plan for it early rather than adding it at the end.',
          'Software options include R with the lavaan package, Stata, AMOS and SmartPLS for variance-based approaches. A specialist can help you choose between covariance-based and variance-based methods and explain what each assumes.',
        ],
      },
      {
        h: 'Econometrics for panel and time series data',
        p: [
          'Economics and finance projects often use panel regressions with fixed or random effects, selected using the Hausman test, or time series models that begin with unit root testing. Diagnostics for heteroskedasticity and serial correlation are expected, and robust standard errors are a common remedy. Stata remains very popular for this kind of work in Kenyan universities.',
        ],
      },
    ],
  },
  {
    id: 'software',
    title: 'SPSS, Stata, R, Python and jamovi: choosing your software',
    intro: [
      'There is no single best package. The right choice depends on your discipline, your supervisor, your budget and the method you need.',
    ],
    subs: [
      {
        h: 'SPSS for survey and social science data',
        p: [
          'IBM SPSS Statistics is widely taught in Kenyan universities because its menu-driven interface lowers the barrier to entry. Many students look for SPSS data analysis help because the output is long and the labels are technical. Learning which table to read, such as the model summary, ANOVA table and coefficients table in a regression, is often more valuable than running the procedure itself.',
        ],
      },
      {
        h: 'Stata, R and Python for flexible workflows',
        p: [
          'Stata is favoured in economics, public health and development research because of its panel data and survey commands. R is free, powerful and excellent for graphics and reproducible reports. Python, with libraries such as statsmodels, pandas and scikit-learn, suits students who also work with machine learning or large datasets. All three reward scripted workflows, which make it easy to rerun an analysis after a supervisor requests a change.',
        ],
      },
      {
        h: 'Free alternatives such as jamovi',
        p: [
          'If a licence is a problem, jamovi offers a friendly spreadsheet-style interface built on R, and it handles many common tests at no cost. It is a sensible option for learners who want transparent, repeatable analysis without a large budget.',
        ],
      },
    ],
  },
  {
    id: 'reporting',
    title: 'Interpret and report your results',
    intro: [
      'Running the test is only half the work. The results chapter must tell a clear story that connects each table to an objective.',
    ],
    subs: [
      {
        h: 'Write results in plain, precise language',
        p: [
          'State the test, the statistic, the degrees of freedom, the p-value and the effect size, then say in plain words what it means for the objective. Avoid saying that results prove a hypothesis. Say instead that the evidence supports or does not support it. Keep tables clean, label them clearly and follow the referencing and formatting style your institution requires.',
        ],
      },
      {
        h: 'Discuss limitations honestly',
        p: [
          'Every study has limits: sampling method, self-reported data, cross-sectional design or small subgroups. Naming them shows maturity and protects you in a viva. A good discussion links your findings to earlier literature and explains where and why they agree or differ.',
        ],
      },
    ],
  },
  {
    id: 'tasklynk',
    title: 'How TaskLynk supports your analysis',
    intro: [
      'TaskLynk is a managed platform. You describe your need, a project manager reviews it and coordinates a vetted specialist who matches your method and software. Communication stays organised in one place, and you can ask for explanations of every step so that you understand the work.',
    ],
    subs: [
      {
        h: 'Support that builds your understanding',
        p: [
          'Typical requests include planning an analysis, calculating a sample size, running and explaining procedures in SPSS, Stata, R or Python, checking assumptions, reviewing your interpretation and preparing you for questions from your panel. If you want to learn the tools yourself, the data analysis training and tutoring category is designed for that. For wider research design and writing, see our thesis and dissertation research support category.',
        ],
      },
      {
        h: 'Pricing and next steps',
        p: [
          'Pricing depends on the scope, the method, the dataset and your timeline, and it is confirmed by quotation before work begins. You can read how this works on the pricing page, learn more on the data analysis service page, or send details through the contact page. Everything you receive is meant to support your own research, analysis and revision, and you remain responsible for how it is used within your institution rules.',
        ],
      },
    ],
  },
];

const tests = [
  ['Independent samples t-test', 'Do two separate groups have different means?', 'Continuous outcome, two groups', 'Comparing exam scores of two teaching methods'],
  ['Paired t-test', 'Did the same people change between two time points?', 'Continuous, paired measurements', 'Blood pressure before and after an intervention'],
  ['One-way ANOVA', 'Do three or more groups differ in their means?', 'Continuous outcome, one categorical factor', 'Maize yield across three fertiliser types'],
  ['Chi-square test', 'Are two categorical variables associated?', 'Two categorical variables', 'Gender and mobile money usage'],
  ['Pearson correlation', 'How strongly are two variables linearly related?', 'Two continuous variables', 'Study hours and grade point average'],
  ['Multiple linear regression', 'Which predictors explain a continuous outcome?', 'Continuous outcome, mixed predictors', 'Factors influencing SME revenue'],
  ['Logistic regression', 'What predicts the odds of a yes or no outcome?', 'Binary outcome, mixed predictors', 'Adoption of a new farming practice'],
  ['Mann-Whitney U or Kruskal-Wallis', 'Do groups differ when normality fails?', 'Ordinal or non-normal continuous', 'Satisfaction ranks across branches'],
  ['Factor analysis', 'Which items group into underlying constructs?', 'Many correlated scale items', 'Grouping items of a service quality scale'],
];

const faqs = [
  {
    q: 'Can someone help me with SPSS data analysis for my project?',
    a: 'Yes. Support can include planning the analysis, running procedures with you, checking assumptions and explaining the output so you can write and defend the results yourself. Your institution rules about permitted help still apply.',
  },
  {
    q: 'How do I know which statistical test to use?',
    a: 'Match the research question, the type of data and the assumptions. Compare means with t-tests or ANOVA, test association with chi-square or correlation, and predict outcomes with regression. The comparison table in this guide is a good starting point.',
  },
  {
    q: 'How do I calculate the sample size for my study?',
    a: 'Use a formula based on confidence level, margin of error and expected proportion for surveys, or a power analysis based on effect size, significance level and power for comparisons. Add an allowance for non-response.',
  },
  {
    q: 'Do you support structural equation modelling and factor analysis?',
    a: 'Specialists can guide exploratory and confirmatory factor analysis and structural equation modelling in tools such as R, Stata and AMOS, including fit indices and reporting. The right method depends on your theory and sample.',
  },
  {
    q: 'How much does data analysis support cost?',
    a: 'Pricing depends on the scope, the method, the dataset and the timeline. It is confirmed by quotation before any work starts, so you know the cost in advance.',
  },
  {
    q: 'Is it acceptable to get help with data analysis?',
    a: 'Learning support, tutoring, explanation and review are widely accepted, but rules differ between institutions. Use help to understand your own data and findings, and follow your university policy on what is permitted.',
  },
];

const toc = [
  ...sections.map((s, i) => ({ id: s.id, label: `${i + 1}. ${s.title}` })),
  { id: 'faq', label: 'Frequently asked questions' },
];

const linkCls =
  'font-medium text-[#2a0e74] underline decoration-[#FF7A3D] underline-offset-2 hover:text-[#E9662F] dark:text-orange-300';
const extCls = linkCls;

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: '2026-10-29',
    dateModified: '2026-10-29',
    author: { '@type': 'Organization', name: 'TaskLynk' },
    publisher: { '@type': 'Organization', name: 'TaskLynk' },
    mainEntityOfPage: `${SITE}${PATH}`,
    keywords: blogMeta.keywords.join(', '),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: TITLE, item: `${SITE}${PATH}` },
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

export default function StatisticalDataAnalysisGuidePage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] text-[#22183D] dark:bg-[#140E24] dark:text-[#EDE6FA] relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
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

      <header className="border-b border-[#DDD3E9]/40 bg-transparent relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20 relative z-10">
          <div>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#5b4b80] dark:text-[#bfb2dc]">
              <Link href="/" className="hover:text-[#E9662F]">Home</Link> / <Link href="/blog" className="hover:text-[#E9662F]">Blog</Link> / Data analysis
            </nav>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#22183D] px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              <BarChart3 className="h-3.5 w-3.5 text-[#FF7A3D]" aria-hidden="true" /> {blogMeta.category}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl tracking-tight text-[#22183D] dark:text-white">
              Statistical Data Analysis in Kenya: A Practical Guide
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#3d2f63] dark:text-[#d6cbee] font-normal leading-relaxed">
              From sample size calculation to SPSS output, regression, ANOVA and structural equation modelling, this guide explains how to plan, run and report your analysis with confidence.
            </p>
            <p className="mt-4 text-xs sm:text-sm text-[#5b4b80] dark:text-[#bfb2dc] font-medium">
              Published 29 October 2026 · {blogMeta.readTime}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalogue/data-analysis-statistics"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A3D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E9662F] shadow-md shadow-[#FF7A3D]/25 transition-all hover:scale-[1.02]"
              >
                Browse data analysis support <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center rounded-xl border border-[#2a0e74] px-6 py-3 text-sm font-semibold text-[#2a0e74] hover:bg-[#2a0e74] hover:text-white dark:border-orange-300 dark:text-orange-300 transition-all">
                Ask a question
              </Link>
            </div>
          </div>
          <AnalyticsIllustration className="mx-auto w-full max-w-md drop-shadow-xl" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Table of contents" className="rounded-2xl border border-[#E4D9F5] bg-white p-5 dark:border-white/10 dark:bg-[#1c1334]">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#2a0e74] dark:text-orange-300">In this guide</p>
            <ol className="space-y-2 text-sm">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-[#3d2f63] hover:text-[#E9662F] dark:text-[#d6cbee]">{t.label}</a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="min-w-0">
          <p className="mb-10 text-lg leading-8">
            Searching for statistical data analysis in Kenya often starts with a deadline and a confusing dataset. This guide walks through the full journey in plain language, so that whether you are an undergraduate, a Masters or PhD candidate, an NGO analyst or a small business owner, you know what good analysis looks like and where to find support. If you would like to see the available options straight away, visit our{' '}
            <Link href="/catalogue/data-analysis-statistics" className={linkCls}>data analysis and statistics support catalogue</Link>.
          </p>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="relative mb-14 scroll-mt-24">
              <span aria-hidden="true" className="pointer-events-none absolute -top-4 right-0 select-none text-5xl sm:text-6xl font-bold text-[#2a0e74]/5 dark:text-white/5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="relative mb-4 text-xl sm:text-2xl font-bold tracking-tight text-[#22183D] dark:text-white">{s.title}</h2>
              {s.intro.map((p, k) => (
                <p key={k} className="mb-4 leading-relaxed text-[#4A4160] dark:text-[#DDD3E9]/90 font-normal">{p}</p>
              ))}
              {s.subs.map((sub) => (
                <div key={sub.h} className="mt-6">
                  <h3 className="mb-2 text-lg sm:text-xl font-semibold text-[#2a0e74] dark:text-orange-300">{sub.h}</h3>
                  {sub.p.map((p, k) => (
                    <p key={k} className="mb-4 leading-relaxed text-[#4A4160] dark:text-[#DDD3E9]/90 font-normal">{p}</p>
                  ))}
                </div>
              ))}

              {s.id === 'kenyan-context' && (
                <blockquote className="my-8 rounded-2xl bg-[#22183D] p-6 text-xl font-semibold leading-8 text-white">
                  <span className="text-[#FF7A3D]">A result you cannot explain is not a result you can defend.</span> Aim to understand every table in your own chapter.
                </blockquote>
              )}

              {s.id === 'planning' && (
                <div className="my-6 flex gap-3 rounded-2xl border-l-4 border-[#FF7A3D] bg-[#F5EEFB] p-5 dark:bg-[#1c1334]">
                  <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-[#E9662F]" aria-hidden="true" />
                  <p className="leading-7"><strong>Tip:</strong> Build a one page analysis matrix with each objective, variable, scale, test and expected table before you print a single questionnaire. Share it with your supervisor for early feedback.</p>
                </div>
              )}

              {s.id === 'cleaning' && (
                <div className="my-6 flex gap-3 rounded-2xl border-l-4 border-red-500 bg-red-50 p-5 dark:bg-red-950/30">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <p className="leading-7"><strong>Common mistake:</strong> Deleting outliers or missing cases without recording why. Keep an analysis log so every decision can be explained and repeated.</p>
                </div>
              )}

              {s.id === 'choosing-tests' && (
                <div className="my-6 overflow-x-auto rounded-2xl border border-[#E4D9F5] bg-white dark:border-white/10 dark:bg-[#1c1334]">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <caption className="p-4 text-left text-base font-semibold">Common statistical tests at a glance</caption>
                    <thead className="bg-[#22183D] text-white">
                      <tr>
                        <th scope="col" className="p-3">Test</th>
                        <th scope="col" className="p-3">Question it answers</th>
                        <th scope="col" className="p-3">Data type</th>
                        <th scope="col" className="p-3">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((r) => (
                        <tr key={r[0]} className="border-t border-[#E4D9F5] align-top even:bg-[#FAF8FD] dark:border-white/10 dark:even:bg-[#140E24]">
                          <th scope="row" className="p-3 font-semibold">{r[0]}</th>
                          <td className="p-3">{r[1]}</td>
                          <td className="p-3">{r[2]}</td>
                          <td className="p-3">{r[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {s.id === 'regression-anova' && (
                <div className="my-6 flex gap-3 rounded-2xl border-l-4 border-red-500 bg-red-50 p-5 dark:bg-red-950/30">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <p className="leading-7"><strong>Common mistake:</strong> Reporting a significant p-value as proof of cause. Regression shows association, and causal claims need a design that supports them.</p>
                </div>
              )}

              {s.id === 'software' && (
                <p className="mt-4 rounded-2xl bg-[#F5EEFB] p-5 leading-8 dark:bg-[#1c1334]">
                  Official resources worth bookmarking: the{' '}
                  <a href="https://www.ibm.com/products/spss-statistics" target="_blank" rel="noopener noreferrer" className={extCls}>IBM SPSS Statistics page</a>,{' '}
                  <a href="https://www.stata.com" target="_blank" rel="noopener noreferrer" className={extCls}>Stata</a>,{' '}
                  <a href="https://www.r-project.org" target="_blank" rel="noopener noreferrer" className={extCls}>the R Project</a>,{' '}
                  <a href="https://pypi.org/project/statsmodels/" target="_blank" rel="noopener noreferrer" className={extCls}>statsmodels for Python</a> and{' '}
                  <a href="https://www.jamovi.org" target="_blank" rel="noopener noreferrer" className={extCls}>jamovi</a>.
                </p>
              )}

              {s.id === 'reporting' && (
                <p className="mt-4 leading-8">
                  For reporting conventions, the{' '}
                  <a href="https://www.apa.org" target="_blank" rel="noopener noreferrer" className={extCls}>American Psychological Association</a>{' '}
                  publishes widely used guidance on presenting statistics.
                </p>
              )}

              {s.id === 'tasklynk' && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['/catalogue/data-analysis-statistics', 'Data analysis and statistics support'],
                    ['/catalogue/thesis-dissertation-research-support', 'Thesis and dissertation research support'],
                    ['/catalogue/data-analysis-training-tutoring', 'Data analysis training and tutoring'],
                    ['/services/data-analysis', 'Data analysis service overview'],
                    ['/pricing', 'How pricing and quotations work'],
                    ['/blog', 'More guides on the TaskLynk blog'],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="flex items-center justify-between rounded-xl border border-[#E4D9F5] bg-white p-4 font-medium hover:border-[#FF7A3D] dark:border-white/10 dark:bg-[#1c1334]">
                        {label} <ArrowRight className="h-4 w-4 text-[#FF7A3D]" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section id="faq" className="mb-14 scroll-mt-24">
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-[#E4D9F5] bg-white p-5 dark:border-white/10 dark:bg-[#1c1334]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {f.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#FF7A3D] transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 leading-7">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-[#22183D] to-[#2a0e74] p-8 text-white sm:p-10">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to understand your data?</h2>
            <p className="mt-3 max-w-xl leading-7 text-white/90">
              Explore our data analysis and statistics category, share your objectives and dataset, and receive a quotation based on your scope. A project manager coordinates a vetted specialist to support your own research.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalogue/data-analysis-statistics" className="inline-flex items-center gap-2 rounded-full bg-[#FF7A3D] px-6 py-3 font-semibold text-white hover:bg-[#E9662F]">
                Explore data analysis support <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center rounded-full border border-white/60 px-6 py-3 font-semibold hover:bg-white/10">
                Contact TaskLynk
              </Link>
            </div>
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
