import { buildServices } from './builder';

const C = 'data-analysis-statistics' as const;

export const dataAnalysisServices = buildServices('statistical', C, [
  {
    slug: 'spss-data-analysis',
    name: 'SPSS Data Analysis',
    summary: 'Clean, analyse and interpret your survey or experimental data in SPSS.',
    detail:
      'A specialist prepares your dataset in SPSS, selects tests that match your objectives and the level of measurement of your variables, and reports the results in formatted tables with a clear explanation.',
    useCases: ['Survey data for a thesis or dissertation', 'Programme evaluation data for an NGO', 'Experimental or quasi-experimental study results'],
    deliverables: ['Cleaned SPSS dataset (.sav)', 'Syntax file and output log', 'Formatted results tables', 'Plain language interpretation of key findings'],
    tools: ['SPSS'],
    legacyHref: '/services/data-analysis/spss-data-analysis-services',
    legacyOrderKey: 'spss',
    related: ['descriptive-inferential-statistics', 'reliability-validity-testing', 'quantitative-data-interpretation'],
    keywords: ['SPSS data analysis Kenya', 'SPSS analysts Nairobi', 'SPSS help for dissertation'],
  },
  {
    slug: 'hypothesis-testing',
    name: 'Hypothesis Testing',
    summary: 'Choose and run the right test for each hypothesis, then report it correctly.',
    detail:
      'You share your hypotheses and data. The specialist checks assumptions, selects the appropriate parametric or non-parametric test, runs it and reports the test statistic, significance level and effect size in the format your institution expects.',
    useCases: ['Testing group differences in a thesis', 'Confirming relationships between variables', 'Reporting results in APA style'],
    deliverables: ['Assumption check summary', 'Test results with statistics and effect sizes', 'Decision on each hypothesis', 'Short written interpretation'],
    related: ['t-tests-non-parametric-tests', 'normality-testing', 'anova-ancova'],
  },
  {
    slug: 'descriptive-inferential-statistics',
    name: 'Descriptive and Inferential Statistics',
    summary: 'Summarise your sample and draw supported conclusions about the population.',
    detail:
      'Descriptive statistics describe your sample with frequencies, means and spread. Inferential statistics estimate and test what the sample suggests about the wider population. This service covers both, sized to your objectives.',
    useCases: ['Chapter Four demographic and descriptive results', 'Baseline and endline survey summaries', 'Preparing data for deeper modelling'],
    deliverables: ['Descriptive tables and charts', 'Inferential test results where required', 'Interpretation notes', 'Cleaned dataset'],
    related: ['spss-data-analysis', 'quantitative-data-interpretation', 'correlation-analysis'],
  },
  {
    slug: 'correlation-analysis',
    name: 'Correlation Analysis',
    summary: 'Measure the strength and direction of relationships between variables.',
    detail:
      'The specialist selects Pearson, Spearman or another suitable correlation measure, checks assumptions, produces a correlation matrix and explains what the coefficients do and do not tell you.',
    useCases: ['Exploring relationships before regression', 'Testing association hypotheses', 'Presenting a correlation matrix in a report'],
    deliverables: ['Correlation matrix with significance levels', 'Scatterplots where useful', 'Interpretation of strength and direction'],
    related: ['linear-logistic-regression', 'hypothesis-testing', 'normality-testing'],
  },
  {
    slug: 'linear-logistic-regression',
    name: 'Linear and Logistic Regression Analysis',
    summary: 'Model how predictors relate to a continuous or binary outcome.',
    detail:
      'The specialist builds linear, multiple or logistic regression models, checks assumptions such as multicollinearity and residual patterns, and explains coefficients, odds ratios and model fit.',
    useCases: ['Predicting an outcome from several factors', 'Testing the effect of interventions', 'Reporting regression tables for a thesis'],
    deliverables: ['Model specification summary', 'Regression tables with coefficients and fit statistics', 'Assumption diagnostics', 'Interpretation of results'],
    related: ['correlation-analysis', 'mediation-moderation-analysis', 'econometrics-time-series'],
    keywords: ['regression analysis help Kenya', 'logistic regression SPSS', 'multiple regression thesis'],
  },
  {
    slug: 'anova-ancova',
    name: 'ANOVA and ANCOVA',
    summary: 'Compare means across three or more groups, with or without covariates.',
    detail:
      'The specialist runs one-way, factorial or repeated measures ANOVA or ANCOVA, checks assumptions, performs post hoc comparisons and reports effect sizes with a clear explanation of which groups differ.',
    useCases: ['Comparing outcomes across treatment groups', 'Controlling for baseline differences', 'Testing interaction effects'],
    deliverables: ['ANOVA or ANCOVA tables', 'Post hoc comparisons', 'Effect sizes and assumption checks', 'Interpretation summary'],
    related: ['t-tests-non-parametric-tests', 'hypothesis-testing', 'normality-testing'],
  },
  {
    slug: 'chi-square-tests',
    name: 'Chi-Square Tests',
    summary: 'Test associations between categorical variables.',
    detail:
      'The specialist runs chi-square tests of independence or goodness of fit, checks expected counts, applies alternatives such as Fisher exact test when needed and reports the results with cross tabulations.',
    useCases: ['Association between gender and a categorical outcome', 'Comparing proportions across groups', 'Survey cross tabulations'],
    deliverables: ['Cross tabulations', 'Test results and effect size (for example Cramer V)', 'Interpretation in plain language'],
    related: ['hypothesis-testing', 'descriptive-inferential-statistics', 'spss-data-analysis'],
  },
  {
    slug: 't-tests-non-parametric-tests',
    name: 'T-Tests and Non-Parametric Tests',
    summary: 'Compare two groups or paired measurements, including when assumptions fail.',
    detail:
      'Independent and paired t-tests are run when assumptions hold. When they do not, the specialist applies Mann-Whitney, Wilcoxon, Kruskal-Wallis or similar tests and explains why the alternative was chosen.',
    useCases: ['Before and after comparisons', 'Two group comparisons with small samples', 'Ordinal or skewed data'],
    deliverables: ['Test results with statistics and effect sizes', 'Reasoning for the chosen test', 'Short interpretation'],
    related: ['normality-testing', 'hypothesis-testing', 'anova-ancova'],
  },
  {
    slug: 'normality-testing',
    name: 'Normality Testing',
    summary: 'Check whether your data meet the assumptions required by your planned tests.',
    detail:
      'The specialist examines distributions with tests such as Shapiro-Wilk and Kolmogorov-Smirnov, graphical checks and skewness and kurtosis, then recommends suitable tests or transformations.',
    useCases: ['Deciding between parametric and non-parametric tests', 'Justifying a method in your methodology chapter', 'Screening data before modelling'],
    deliverables: ['Normality test results', 'Histograms and Q-Q plots', 'Recommendation on test selection or transformation'],
    related: ['hypothesis-testing', 't-tests-non-parametric-tests', 'anova-ancova'],
  },
  {
    slug: 'reliability-validity-testing',
    name: 'Reliability and Validity Testing',
    summary: 'Evaluate whether your questionnaire measures consistently and accurately.',
    detail:
      'The specialist calculates internal consistency such as Cronbach alpha, reviews item statistics and, where suitable, checks construct validity so that you can justify your instrument.',
    useCases: ['Pilot study of a questionnaire', 'Scale validation for a thesis', 'Improving a survey instrument'],
    deliverables: ['Reliability statistics by scale', 'Item-total analysis with suggestions', 'Short validity discussion you can adapt'],
    related: ['exploratory-confirmatory-factor-analysis', 'spss-data-analysis', 'descriptive-inferential-statistics'],
    keywords: ['Cronbach alpha SPSS', 'questionnaire reliability test Kenya', 'validity and reliability analysis'],
  },
  {
    slug: 'sample-size-power-calculations',
    name: 'Sample-Size and Statistical Power Calculations',
    summary: 'Plan a sample large enough to detect the effects you care about.',
    detail:
      'The specialist selects an appropriate formula or power analysis, documents assumptions and gives you a justified sample size that you can cite in your proposal or protocol.',
    useCases: ['Research proposal methodology section', 'Ethics or grant applications', 'Planning a survey or trial'],
    deliverables: ['Sample size or power calculation', 'Assumptions and formula used', 'Short paragraph you can adapt for your methodology'],
    tools: ['G*Power', 'R', 'Stata', 'Excel'],
    inputs: ['Study design and primary outcome', 'Expected effect size or prevalence, if known', 'Population size and desired confidence level', 'Preferred significance and power levels', 'Your deadline'],
    related: ['hypothesis-testing', 'descriptive-inferential-statistics'],
  },
  {
    slug: 'mediation-moderation-analysis',
    name: 'Mediation and Moderation Analysis',
    summary: 'Test how and when one variable influences another.',
    detail:
      'The specialist specifies mediation or moderation models, runs them using suitable tools, tests indirect effects and interactions and explains the results with diagrams and tables.',
    useCases: ['Testing a conceptual framework', 'Understanding mechanisms behind an effect', 'Exploring conditional relationships'],
    deliverables: ['Model diagram', 'Indirect effect and interaction results', 'Tables and interpretation'],
    tools: ['SPSS (PROCESS macro)', 'R', 'Stata', 'SmartPLS'],
    related: ['linear-logistic-regression', 'structural-equation-modelling', 'exploratory-confirmatory-factor-analysis'],
  },
  {
    slug: 'exploratory-confirmatory-factor-analysis',
    name: 'Exploratory and Confirmatory Factor Analysis',
    summary: 'Identify and confirm the underlying structure of your measurement scales.',
    detail:
      'Exploratory factor analysis reveals how items group together. Confirmatory factor analysis tests whether a proposed structure fits the data. The specialist reports loadings, fit indices and the reasoning behind decisions.',
    useCases: ['Developing or adapting a scale', 'Testing a measurement model before SEM', 'Reducing many items to a smaller set of factors'],
    deliverables: ['Factor structure and loadings', 'Fit indices for confirmatory models', 'Decision log and interpretation'],
    tools: ['SPSS', 'R', 'Stata', 'SmartPLS', 'AMOS'],
    related: ['reliability-validity-testing', 'structural-equation-modelling', 'mediation-moderation-analysis'],
  },
  {
    slug: 'structural-equation-modelling',
    name: 'Structural Equation Modelling (SEM)',
    summary: 'Test complex relationships between observed and latent variables.',
    detail:
      'The specialist builds and evaluates covariance-based or variance-based SEM models, checks fit and reports path coefficients so that your conceptual framework is tested rigorously.',
    useCases: ['Testing a conceptual framework with several constructs', 'Combining measurement and structural models', 'PLS-SEM for smaller samples'],
    deliverables: ['Model specification and diagram', 'Fit indices or PLS quality criteria', 'Path coefficients and interpretation'],
    tools: ['SmartPLS', 'AMOS', 'R (lavaan)', 'Stata'],
    related: ['exploratory-confirmatory-factor-analysis', 'mediation-moderation-analysis', 'reliability-validity-testing'],
    keywords: ['SEM analysis help Kenya', 'SmartPLS analysis', 'structural equation modelling support'],
  },
  {
    slug: 'econometrics-time-series',
    name: 'Econometrics and Time-Series Analysis',
    summary: 'Analyse economic and time-ordered data with appropriate models.',
    detail:
      'The specialist handles panel data models, unit root and cointegration tests, ARIMA and related forecasting models, and diagnostic checks, using software that suits your field.',
    useCases: ['Panel data regression for an economics thesis', 'Forecasting sales or prices', 'Policy impact studies'],
    deliverables: ['Model specification and diagnostics', 'Estimation tables', 'Interpretation and, if needed, forecasts'],
    tools: ['Stata', 'R', 'EViews', 'Python'],
    related: ['linear-logistic-regression', 'financial-modelling-forecasting', 'quantitative-data-interpretation'],
    keywords: ['econometrics help Kenya', 'time series analysis Stata', 'panel data analysis support'],
  },
  {
    slug: 'quantitative-data-interpretation',
    name: 'Quantitative Data Interpretation',
    summary: 'Turn statistical output into clear, accurate findings you can explain.',
    detail:
      'If you already have output but are unsure what it means, a specialist reviews it, explains each result in plain language and helps you word your findings accurately for your report or presentation.',
    useCases: ['Understanding SPSS or Stata output', 'Writing the interpretation for your own results chapter', 'Preparing to explain findings to a supervisor'],
    deliverables: ['Annotated explanation of your output', 'Suggested wording for key findings', 'Notes on limitations'],
    legacyHref: '/services/data-analysis/quantitative-data-analysis',
    related: ['spss-data-analysis', 'descriptive-inferential-statistics', 'hypothesis-testing'],
  },
]);

