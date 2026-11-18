import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Users, MapPin, ClipboardCheck, Database, BarChart3, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Research Data Collection Services | Surveys, Interviews & Fieldwork',
  'Professional research data collection services including online surveys, interviews, focus groups, fieldwork coordination, and transcription. Hire vetted research data collectors.',
  '/services/research/data-collection'
);

const faqs = [
  {
    question: 'What data collection methods do you support?',
    answer: 'We support online surveys (Qualtrics, Google Forms, SurveyMonkey, Typeform), telephone interviews, face-to-face interviews, focus groups, ethnographic fieldwork, observational studies, archival data extraction, web scraping, and experimental data collection. We also handle secondary data collection from government databases, academic repositories, and organizational records.',
  },
  {
    question: 'Can you help design my survey or interview protocol?',
    answer: 'Yes. Our research data collection specialists design survey instruments and interview guides that align with your research questions and methodology. We help with question formulation, scale selection, interview flow, pilot testing, and validation. We also ensure questions are culturally appropriate and linguistically clear for your target population.',
  },
  {
    question: 'Do you provide transcription services?',
    answer: 'Yes. We offer professional transcription services for interviews, focus groups, and audio recordings. We provide both automated and human transcription with speaker identification, timestamping, and quality verification. Transcripts can be delivered in Word, PDF, or structured formats for qualitative analysis software (NVivo, Atlas.ti).',
  },
  {
    question: 'How do you ensure data quality during collection?',
    answer: 'We implement multiple quality control measures: trained enumerators with field experience, pilot testing of instruments, real-time data validation during collection, outlier detection protocols, supervisor spot-checks, and completeness verification. For interview studies, we use semi-structured guides with flexibility for probing while maintaining consistency across participants.',
  },
  {
    question: 'Can you collect data in local languages?',
    answer: "Yes. Our field teams include native speakers of Swahili, Kikuyu, Luo, Kalenjin, Kamba, and other Kenyan languages. We provide translation and back-translation services for survey instruments, conduct interviews in participants\' preferred language, and offer culturally adapted protocols that respect local customs and research ethics.",
  },
  {
    question: 'What sample sizes can you handle?',
    answer: 'We handle projects ranging from small qualitative studies (5-20 interviews or focus groups) to large-scale surveys (thousands of respondents). For large projects, we coordinate teams of trained enumerators with centralized quality control. You specify your target sample size and geographic scope, and we develop a sampling and collection plan that meets your requirements.',
  },
];

const relatedServices = [
  { label: 'Survey Design Services', href: '/services/research/survey-design' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Research Assistance', href: '/services/research/research-assistance' },
  { label: 'Literature Research', href: '/services/research/literature-research' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Market Research Services', href: '/services/business/market-research' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Register as Freelancer', href: '/register/freelancer' },
];

export default function DataCollectionPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/data-collection"
      serviceSchemaName="Research Data Collection Services"
      serviceSchemaDescription="Professional research data collection services including online surveys, interviews, focus groups, fieldwork coordination, transcription, and secondary data extraction."
      heroEyebrow="Data Collection"
      heroTitle="Research Data Collection Services | Surveys, Interviews & Fieldwork"
      heroIntro="High-quality research depends on high-quality data. But designing surveys that produce valid responses, recruiting the right participants, conducting interviews that yield genuine insights, and managing fieldwork logistics—especially across multiple locations or languages—requires experience and local knowledge. TaskLynk connects you with vetted research data collection specialists who have conducted fieldwork across Kenya and beyond. From online survey deployment and interview protocol development to focus group facilitation and professional transcription, our marketplace delivers data collection that meets rigorous research standards. With secure milestone payments, NDA protection, and dedicated project management, your data collection is handled with precision."
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
                This service is for researchers and organizations that need professional data collection support. <strong>PhD and Master's students</strong> who need to collect primary data for dissertations, theses, or capstone projects but lack the experience or time to coordinate fieldwork themselves. <strong>Academic researchers</strong> conducting studies that require large-scale data collection across multiple sites or communities, often in geographically dispersed or linguistically diverse regions. <strong>Market research firms</strong> that need field teams for customer surveys, focus groups, or ethnographic studies but lack local presence in specific regions. <strong>NGOs and development organizations</strong> implementing program evaluations, baseline surveys, or impact assessments that require rigorous data collection protocols. <strong>Government agencies</strong> conducting demographic or socio-economic surveys, policy evaluation studies, or public opinion polling. <strong>Healthcare professionals</strong> conducting clinical interviews, patient satisfaction surveys, or community health assessments. <strong>Businesses</strong> needing employee engagement surveys, customer feedback collection, or market entry research in new regions.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you need help designing data collection instruments, recruiting participants, conducting interviews, managing field teams, or transcribing recordings, our research data collection service provides experienced specialists. We also support complementary services including <Link href="/services/research/survey-design" className="text-primary font-semibold hover:underline">survey design</Link>, <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">general research assistance</Link>, and <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis services</Link> for a complete end-to-end research solution.
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
                What We Offer: From Instrument Design to Quality-Verified Data
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our data collection service provides end-to-end support for every phase of primary data collection. We begin with <strong>instrument design and validation</strong>—developing survey questionnaires, interview guides, and observation protocols that align with your research questions and methodology. Our specialists are trained in question design best practices, scale construction, cognitive interviewing techniques, and cultural adaptation to ensure instruments produce valid and reliable measurements. We also conduct pilot testing with representative samples, analyze pilot results, and refine instruments before full-scale deployment—a critical step that many researchers skip, leading to costly mid-study instrument revisions.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Next, we handle <strong>participant recruitment and sampling</strong>. Our specialists develop sampling frames, calculate required sample sizes using power analysis, and implement appropriate sampling strategies (simple random, stratified, cluster, purposive, snowball) based on your study design. In Kenya, we leverage local networks, community connections, and institutional partnerships to reach target populations that are often difficult to access. For online surveys, we distribute links through relevant channels and monitor response rates. For qualitative studies, we recruit participants through purposeful sampling, ensuring diversity and variation in key demographic or experiential variables.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Survey Instruments</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Questionnaire design, scale development, interview guide creation, and pilot testing with cognitive validation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Fieldwork Coordination</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-site data collection, enumerator training, real-time monitoring, and quality control across Kenya and beyond.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Transcription &amp; Coding</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional transcription, speaker identification, qualitative coding, and structured data extraction with quality verification.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Ethical &amp; Secure</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  IRB protocol compliance, informed consent, data encryption, and participant privacy protection at every stage.
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
                Fieldwork and Geographic Coverage in Kenya and Beyond
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our data collection specialists have extensive experience conducting fieldwork across Kenya's diverse geographic and cultural landscape. In <strong>Nairobi and the Central Highlands</strong>, specialists have conducted urban household surveys, corporate interviews, and market research studies across all sub-counties. In <strong>Western Kenya</strong> (Kisumu, Kakamega, Busia), our teams have managed community health surveys, agricultural research studies, and educational assessments in both urban and rural settings. In <strong>Central Kenya</strong> (Nakuru, Nyeri, Murang'a), specialists have conducted demographic studies, socio-economic surveys, and focus groups in multiple local languages. In <strong>Eastern and Northern Kenya</strong> (Wajir, Garissa, Turkana, Marsabit), our specialists have experience with nomadic and semi-nastodic communities, conducting mobile data collection, community mapping, and participatory rural appraisal techniques.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond Kenya, our network includes specialists who have conducted research in <strong>Tanzania, Uganda, Rwanda, Ethiopia, South Africa</strong>, and other East African countries. For international projects, our specialists coordinate with local partners, navigate cross-border research ethics requirements, and adapt instruments to local contexts. For projects requiring specific language capabilities, we maintain a roster of native speakers in Swahili, Luo, Kalenjin, Kikuyu, Kamba, Dholuo, and other regional languages. This geographic and linguistic coverage ensures that your data collection maintains methodological rigor regardless of where or from whom you need to collect data.
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
                Why TaskLynk for Research Data Collection
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Data collection is where research methodology meets real-world complexity. A well-designed study can fail at the data collection stage if instruments aren't properly validated, participants aren't appropriately recruited, or fieldwork isn't managed with rigorous quality control. TaskLynk's marketplace connects you with specialists who have not just theoretical knowledge, but proven field experience conducting research across Kenya's diverse communities. Every data collection specialist in our network has completed at least two major data collection projects as lead coordinator, with verifiable references from academic institutions, NGOs, or research organizations.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond field experience, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each collection phase before payment, <strong>dedicated project managers</strong> who coordinate between you and field teams, and <strong>NDA and ethics compliance</strong> protection. For academic researchers, we also offer <Link href="/services/research/survey-design" className="text-primary font-semibold hover:underline">survey design services</Link> for instrument development, <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link> for statistical interpretation, and <Link href="/services/research/proofreading" className="text-primary font-semibold hover:underline">proofreading services</Link> for final reporting. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures data quality and ethical compliance, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your data collection project</Link> today. For research professionals, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link> to connect with researchers needing fieldwork support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
