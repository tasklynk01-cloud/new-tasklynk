import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ClipboardCheck, Search, BarChart3, Users, Award, ShieldCheck } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Survey & Questionnaire Design Services | Get Valid, Reliable Data',
  'Professional survey and questionnaire design services following best practices for cognitive testing, scale development, and instrument validation. Get reliable data from your first question to your last.',
  '/services/research/survey-design'
);

const faqs = [
  {
    question: 'What does survey design include?',
    answer: 'Our service covers the complete survey design lifecycle: research question formulation, literature-based item selection, scale construction, questionnaire flow and layout design, cognitive testing and pilot testing, validity and reliability assessment, platform selection and setup (Qualtrics, SurveyMonkey, Google Forms), and deployment strategy. We also provide documentation of design decisions and best-practice guidelines for data collection.',
  },
  {
    question: 'Do you help with scale construction and validation?',
    answer: 'Yes. We design multi-item scales using established psychometric principles, conduct exploratory and confirmatory factor analysis during pilot testing, calculate Cronbach\'s alpha and composite reliability, assess convergent and discriminant validity, and ensure items are internally consistent. We can adapt existing validated scales or develop new ones tailored to your specific construct.',
  },
  {
    question: 'Which survey platforms do you set up and configure?',
    answer: 'We have experience setting up and configuring surveys on Qualtrics, SurveyMonkey, Google Forms, Typeform, Alchemer/SurveyGizmo, LimeSurvey, and custom survey applications. We handle platform-specific features including branching logic, display logic, randomization, embedded data, survey flow configuration, and integration with data analysis pipelines.',
  },
  {
    question: 'How do you ensure my survey questions are unbiased?',
    answer: 'We apply cognitive interviewing principles to identify and eliminate leading, double-barreled, ambiguous, or culturally biased questions. Our specialists conduct readability assessments, test question interpretation with focus groups, and apply principles of neutral wording, balanced scales, and logical flow. We also ensure questions respect cultural sensitivity and research ethics, particularly for vulnerable populations.',
  },
  {
    question: 'Can you design surveys for different populations and languages?',
    answer: 'Yes. We specialize in culturally adapted survey design for diverse populations including children, elderly participants, non-native language speakers, and communities with varying literacy levels. We provide translation and back-translation services, cognitive debriefing in target languages, and culturally appropriate adaptation of scales and items. In Kenya, we have experience designing surveys in Swahili, English, and local languages.',
  },
  {
    question: 'What is pilot testing and why is it important?',
    answer: 'Pilot testing involves administering your survey to a small representative sample (typically 20-50 participants) to identify problems with question clarity, flow, length, and scale performance. We analyze pilot results for item discrimination, reliability, and response patterns, then refine the instrument before full-scale deployment. This step prevents costly mid-study revisions and improves data quality significantly.',
  },
];

const relatedServices = [
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Research Assistance', href: '/services/research/research-assistance' },
  { label: 'Literature Research', href: '/services/research/literature-research' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function SurveyDesignPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/survey-design"
      serviceSchemaName="Survey & Questionnaire Design Services"
      serviceSchemaDescription="Professional survey and questionnaire design services with cognitive testing, scale development, instrument validation, and platform configuration for valid, reliable data collection."
      heroEyebrow="Survey Design"
      heroTitle="Survey & Questionnaire Design Services | Get Valid, Reliable Data"
      heroIntro="A poorly designed survey is worse than no survey at all. Ambiguous questions, biased scales, confusing flow, and untested instruments produce data that looks comprehensive but tells you nothing reliable about your research question. TaskLynk connects you with vetted survey design specialists—experts in questionnaire construction, scale development, cognitive testing, and instrument validation—who craft surveys that produce valid, reliable, actionable data. With secure milestone payments, NDA protection, and dedicated project management, your survey instruments are built to the highest methodological standards."
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
                This service is for researchers and organizations developing survey instruments but needing expert design support. <strong>PhD and Master's students</strong> designing quantitative research instruments for dissertations, theses, or capstone projects who need to ensure their survey questions produce valid and reliable data. <strong>Faculty researchers</strong> developing survey protocols for grant-funded studies, particularly those involving complex constructs, multi-dimensional scales, or culturally adapted instruments. <strong>Market research firms</strong> that need professionally designed questionnaires for customer satisfaction surveys, brand awareness studies, or product feedback collection. <strong>NGOs and development organizations</strong> conducting baseline surveys, program evaluation studies, or impact assessments that require culturally sensitive, locally validated instruments. <strong>Healthcare professionals</strong> developing patient satisfaction surveys, clinical outcome measures, or public health questionnaires. <strong>Government agencies</strong> conducting demographic surveys, citizen satisfaction studies, or policy evaluation instruments. <strong>Businesses</strong> needing employee engagement surveys, organizational climate assessments, or market entry research instruments.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you're preparing to collect primary data through surveys or questionnaires and want to ensure your instrument produces valid, reliable results, our survey design service provides the expertise. We also support complementary services including <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection coordination</Link>, <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, and <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">research assistance</Link> for ongoing support.
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
                What We Offer: Methodologically Sound Survey Instruments
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our survey design service follows established psychometric and methodological standards to ensure your instrument produces valid, reliable, and actionable data. We begin with a <strong>requirements consultation</strong> to understand your research questions, target population, survey objectives, and methodological approach. Our specialists then translate these requirements into a structured questionnaire using best practices in item construction, scale selection, and question sequencing. We carefully consider question wording to avoid leading, ambiguous, or double-barreled items, and we design logical flow that minimizes cognitive burden and survey fatigue while maximizing response rates and data quality.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For <strong>scale development</strong>, we construct multi-item scales using established psychometric principles, drawing on existing validated instruments where appropriate and developing new scales for novel constructs. We ensure items are internally consistent, measure what they intend to measure, and discriminate between different levels of the construct. For <strong>cognitive testing</strong>, we conduct think-aloud protocols and cognitive interviews with representative participants to identify comprehension issues, interpretation biases, or response strategy problems. This iterative process ensures questions mean what we think they mean to the people answering them. We then implement <strong>pilot testing</strong> with a small representative sample, analyze results for reliability (Cronbach's alpha, test-retest) and validity (construct, content, criterion), and refine the instrument based on empirical evidence before full-scale deployment.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Scale Construction</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-item scale design, factor analysis, reliability testing, and validity assessment following psychometric best practices.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Cognitive Testing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Think-aloud interviews, cognitive debriefing, and comprehension testing to identify and eliminate question bias.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Platform Configuration</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Survey setup on Qualtrics, SurveyMonkey, Google Forms with branching logic, randomization, and embedded data.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Pilot Testing &amp; Validation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Statistical analysis of pilot results, reliability coefficients, and instrument refinement based on empirical evidence.
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
                Survey Types and Methodologies We Specialize In
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our survey design specialists are trained in multiple survey methodologies, each suited to different research contexts and objectives. <strong>Cross-sectional surveys</strong> capture a single snapshot of opinions, behaviors, or characteristics at one point in time, ideal for descriptive studies, market research, and population prevalence estimation. We design these to minimize non-response bias, optimize question order, and include appropriate demographic controls. <strong>Longitudinal surveys</strong> track the same respondents over multiple time points to study change, trends, or causal relationships. Our specialists design these with careful attention to panel attrition mitigation, wave timing, and recall period consistency.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                <strong>Panel surveys</strong> repeatedly sample from a fixed panel of respondents, and our specialists design protocols for consistent measurement, panel maintenance, and data quality monitoring across waves. <strong>Mixed-mode surveys</strong> combine online, telephone, mail, and face-to-face components, and we design integrated instruments that maintain measurement equivalence across modes. <strong>Mobile-first surveys</strong> are optimized for smartphone completion, with touch-friendly scales, vertical scrolling, and appropriate question length for mobile respondents. <strong>Complex sample surveys</strong> with stratification, clustering, and multi-stage sampling require careful design to support proper weighting and variance estimation, and our specialists have deep experience with these designs. For academic researchers, we also design <strong>clinical survey instruments</strong>, <strong>educational assessment surveys</strong>, and <strong>organizational climate surveys</strong> following discipline-specific best practices.
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
                Why TaskLynk for Survey Design
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Survey design is where research methodology meets human psychology. A well-designed survey requires not just statistical knowledge, but understanding of how people read, interpret, and respond to questions—and how survey design flaws can systematically bias results. TaskLynk's marketplace connects you with survey design specialists who have deep training in psychometrics, cognitive psychology, and survey methodology. Every survey designer in our network has completed graduate-level coursework in questionnaire design or survey methodology, has conducted cognitive testing on at least five major survey projects, and has demonstrable experience with instrument validation and scale development.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond methodological expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each design phase before payment, <strong>dedicated project managers</strong> who coordinate between you and the specialist, and <strong>NDA protection</strong> for your research protocols and instrument designs. For students and researchers, we also offer <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection coordination</Link>, <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, and <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">research assistance</Link> for ongoing support. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures methodological rigor, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your survey design project</Link> today to be matched with a qualified specialist within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
