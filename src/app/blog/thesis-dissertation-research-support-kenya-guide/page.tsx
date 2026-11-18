import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, AlertTriangle, ArrowRight, Flag, ShieldCheck } from "lucide-react";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StripeGradientMesh } from "@/components/ui/stripe-animated-gradient";
import { RoadmapIllustration, StageIcon } from "@/components/blog-guides/thesis-support/roadmap-illustration";
import { blogMeta } from "./meta";

const PATH = "/blog/thesis-dissertation-research-support-kenya-guide";
const PAGE_TITLE = "Thesis Support Kenya: Stage-by-Stage Guide";
const PAGE_DESC =
  "A practical Kenyan guide to thesis and dissertation support: proposal, methodology, Chapter Four, referencing, proofreading and viva preparation, done ethically.";

export const metadata: Metadata = generateCanonicalMetadata(PATH, {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords: blogMeta.keywords,
  openGraph: {
    type: "article",
    title: PAGE_TITLE,
    description: PAGE_DESC,
    publishedTime: "2026-10-29",
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESC },
});

type Stage = {
  id: string;
  title: string;
  intro: string[];
  checklist: string[];
  good: string[];
  problems: string[];
  subhead: string;
  subtext: string;
};

const stages: Stage[] = [
  {
    id: "topic",
    title: "Stage 1: Refining your topic",
    intro: [
      "Most thesis trouble starts here. A topic such as \"challenges facing small businesses in Kenya\" sounds reasonable, but it is far too broad for an undergraduate project, a Masters dissertation or even a PhD. A workable topic names a specific population, a place, a time frame and a problem that can actually be measured or explored.",
      "Good topic refinement is a conversation, not a lecture. You bring your interests, your programme requirements and the guidance from your supervisor. A research consultant helps you test the idea: is there enough literature, can you reach the respondents, can you finish within your semester or academic year, and does the topic match the expectations of your department?",
    ],
    checklist: [
      "The topic names a population, a location and a clear problem",
      "You have found at least a handful of recent, relevant studies",
      "Your supervisor or department has confirmed the area is acceptable",
      "Data collection is realistic given your budget, time and access",
    ],
    good: [
      "A narrow, answerable problem statement in one or two sentences",
      "A clear gap you can explain in plain language",
      "Access to respondents or secondary data already confirmed",
    ],
    problems: [
      "A topic copied from a past project with no fresh angle",
      "A scope so wide that no single study could answer it",
      "No plan for how data will actually be collected",
    ],
    subhead: "Questions to ask before you commit",
    subtext:
      "Ask yourself whether you would still care about this topic in six months, whether your institution has supervisors who understand it, and whether ethical approval or a research permit is likely to be difficult. Answering these early saves months of rework later.",
  },
  {
    id: "proposal",
    title: "Stage 2: Research proposal, objectives and hypotheses",
    intro: [
      "The proposal is the contract between you and your department. It usually contains the background, problem statement, objectives, research questions or hypotheses, a short literature review, the methodology, a work plan and a budget. Kenyan universities often review proposals at a departmental defence, so clarity matters as much as content.",
      "Research proposal help is most valuable when it focuses on alignment. Each objective should connect to a research question, each question to a variable or theme, and each variable to a measurement approach. When these threads line up, examiners can see the logic immediately. When they do not, the proposal is usually sent back for corrections.",
    ],
    checklist: [
      "General and specific objectives use measurable verbs",
      "Every objective has a matching research question or hypothesis",
      "The conceptual framework shows the relationships you will study",
      "The work plan fits the deadlines set by your school",
    ],
    good: [
      "Objectives, questions and hypotheses that mirror each other",
      "A justification that explains why the study matters locally",
      "A realistic timeline and a modest, honest budget",
    ],
    problems: [
      "Objectives written as activities, such as \"to study\" with no measurable outcome",
      "Hypotheses that cannot be tested with the planned data",
      "A proposal that reads like a collection of copied paragraphs",
    ],
    subhead: "Writing hypotheses that can be tested",
    subtext:
      "A good hypothesis states a relationship between variables and can be supported or rejected by evidence. If your study is exploratory and qualitative, research questions are usually a better fit than formal hypotheses. Your supervisor will normally guide this choice, and a consultant can help you explain it clearly.",
  },
  {
    id: "literature",
    title: "Stage 3: Literature review and theoretical framework",
    intro: [
      "A literature review is not a list of summaries. It is an argument that shows what is known, where studies disagree and what remains unanswered. Strong reviews are organised by theme or variable, not by author, and they end by pointing directly at the gap your study addresses.",
      "Literature review support can include learning how to search databases efficiently, building a simple matrix of sources, identifying a suitable theory, and structuring your own synthesis. The thinking and the writing remain yours. What changes is that you have a guide who shows you how scholars in your field build an argument from sources.",
    ],
    checklist: [
      "Sources are mostly recent, peer-reviewed and relevant to your context",
      "The review is organised by theme, with clear synthesis",
      "A theory or conceptual model underpins the study",
      "A reference manager holds every source from the start",
    ],
    good: [
      "Paragraphs that compare and contrast studies",
      "Local Kenyan and regional evidence alongside global work",
      "A closing section that states the gap clearly",
    ],
    problems: [
      "Long strings of author summaries with no analysis",
      "Heavy reliance on blogs and unverified websites",
      "Citations that do not match the reference list",
    ],
    subhead: "Using a reference manager from day one",
    subtext:
      "Tools such as Zotero and Mendeley store your sources, attach PDFs and format citations automatically. Setting one up in the first week prevents the late-night panic of rebuilding a reference list by hand.",
  },
  {
    id: "methodology",
    title: "Stage 4: Methodology, questionnaires and sampling",
    intro: [
      "Research methodology consultation is among the most requested forms of support, and for good reason. Choices about design, population, sample size, sampling technique, instruments, validity, reliability and ethics shape everything that follows. A weak method cannot be rescued by good writing.",
      "Your choice between quantitative, qualitative and mixed methods should follow your research questions, not personal comfort. Survey designs suit questions about prevalence and relationships. Interviews and focus groups suit questions about meaning and experience. Mixed methods suit studies that need both breadth and depth.",
    ],
    checklist: [
      "The research design matches the objectives and questions",
      "The target population and sampling frame are clearly defined",
      "Sample size is justified with a recognised approach",
      "The questionnaire or interview guide has been piloted",
      "Consent, confidentiality and permits are planned",
    ],
    good: [
      "Questionnaire items that map directly to variables",
      "A pilot study with reliability results reported honestly",
      "Ethical approval and a research permit obtained before collecting data",
    ],
    problems: [
      "Leading or double-barrelled questions",
      "A sample chosen for convenience but described as random",
      "Data collection started before approval was granted",
    ],
    subhead: "Sampling in the Kenyan context",
    subtext:
      "Many students work with counties, schools, hospitals, SACCOs or small firms where complete sampling frames do not exist. In that case, explain honestly what you did and why, and acknowledge the limits. Examiners respect transparency far more than a method that sounds impressive but is not what you actually did.",
  },
  {
    id: "data",
    title: "Stage 5: Data collection, cleaning and analysis",
    intro: [
      "Once you have responses, the real work begins. Quantitative data needs cleaning: checking for missing values, outliers, coding errors and scale direction. Qualitative data needs careful transcription, coding and a clear approach to themes. Skipping these steps leads to results that look neat but cannot be trusted.",
      "Many students feel least confident here. Support might mean learning which statistical test fits your data, how to run it in SPSS, Stata, R or Excel, and how to read the output. For interviews, it might mean learning how to code transcripts and build themes in NVivo or by hand. You can explore related help through our pages on [data analysis and statistics](/catalogue/data-analysis-statistics) and [qualitative and mixed methods research](/catalogue/qualitative-mixed-methods-research).",
    ],
    checklist: [
      "Raw data is backed up and a clean copy is kept separately",
      "Assumptions of each test are checked before interpretation",
      "Qualitative codes and themes can be traced to quotations",
      "Analysis choices are recorded so they can be defended",
    ],
    good: [
      "A test chosen because the data and question require it",
      "Clear tables with sensible labels and notes",
      "Findings that you can explain in your own words",
    ],
    problems: [
      "Running many tests and reporting only favourable ones",
      "Interpreting a p-value as proof rather than evidence",
      "Themes that appear with no supporting quotations",
    ],
    subhead: "Understand every number you report",
    subtext:
      "If you cannot explain why a test was chosen or what a coefficient means, you will struggle in your defence. Good analytical support leaves you able to explain your own results confidently.",
  },
  {
    id: "results",
    title: "Stage 6: Chapter Four and Chapter Five",
    intro: [
      "Chapter Four results presentation is where many dissertations lose marks. The chapter should follow the order of your objectives, present descriptive findings first, then inferential results, and interpret each table in plain language. Tables should be readable on their own, with titles, notes and consistent decimal places.",
      "Chapter Five then discusses what the findings mean. It compares your results with the literature you reviewed, draws conclusions tied to each objective, and offers recommendations for practice, policy and further research. Recommendations should flow from evidence. A common weakness is a list of generic suggestions that could belong to any study.",
    ],
    checklist: [
      "Results follow the order of the objectives",
      "Every table and figure is introduced and interpreted in the text",
      "Discussion links each finding back to earlier studies",
      "Conclusions and recommendations match the evidence",
      "Limitations are stated honestly",
    ],
    good: [
      "Short interpretive paragraphs beneath each table",
      "Discussion that explains agreement and disagreement with past work",
      "Recommendations specific to the institutions studied",
    ],
    problems: [
      "Pasting raw software output with no interpretation",
      "Conclusions that introduce new findings",
      "Recommendations that do not follow from the data",
    ],
    subhead: "Presenting results without overwhelming the reader",
    subtext:
      "Use tables for precise values and charts for patterns, and avoid showing the same data twice. Keep each paragraph focused on one finding. Your examiners will read many dissertations, so clear structure is a kindness to them and a benefit to you.",
  },
  {
    id: "polish",
    title: "Stage 7: Referencing, proofreading and similarity checks",
    intro: [
      "Referencing errors are among the easiest marks to lose and the easiest to fix. Most Kenyan universities specify APA, Harvard or a faculty style guide. Follow the version your school requires, and check the official guidance, such as the [APA Style website](https://apastyle.apa.org), when in doubt.",
      "Academic proofreading in Kenya typically means a careful pass for grammar, clarity, consistency, formatting and citation accuracy. It is not rewriting your ideas. Many students also check similarity reports through their institution, since universities commonly use tools such as [Turnitin](https://www.turnitin.com). A similarity report is a prompt to review your citations and paraphrasing, not a score to chase blindly.",
    ],
    checklist: [
      "In-text citations match the reference list exactly",
      "Headings, numbering and tables follow your school template",
      "Spelling and grammar are consistent, using one English variant",
      "Quotations and paraphrases are properly attributed",
    ],
    good: [
      "A consistent referencing style from start to finish",
      "Clear sentences that sound like the student wrote them",
      "A final read-through after all supervisor corrections",
    ],
    problems: [
      "Mixed referencing styles in a single document",
      "Paraphrasing that stays too close to the original wording",
      "Formatting changed at the last minute and left broken",
    ],
    subhead: "Preparing for corrections",
    subtext:
      "Supervisors rarely return a draft with no comments. Keep a simple log of every correction and how you addressed it. This helps you respond professionally and shows your supervisor that you take feedback seriously.",
  },
  {
    id: "viva",
    title: "Stage 8: Viva and defence preparation",
    intro: [
      "Viva preparation is about confidence and understanding. Panels typically ask why you chose the topic, why you selected the method, how you handled limitations, and what your findings contribute. They also test whether the work is genuinely yours by asking you to explain choices in detail.",
      "Useful preparation includes a short presentation of about ten to fifteen slides, a list of likely questions, and at least one mock defence where a mentor plays the panel. The goal is to help you speak clearly about your own research, which is exactly why the understanding you build in earlier stages matters so much.",
    ],
    checklist: [
      "You can summarise the study in two minutes without notes",
      "You can justify every major method choice",
      "You have rehearsed answers on limitations and contribution",
      "Slides are clean, readable and free of dense paragraphs",
    ],
    good: [
      "Calm, direct answers that admit what the study cannot claim",
      "Slides that support the talk instead of replacing it",
      "Clear knowledge of every table in your own chapters",
    ],
    problems: [
      "Reading slides word for word",
      "Defensive reactions to reasonable criticism",
      "Being unable to explain an analysis technique that was used",
    ],
    subhead: "Journal manuscripts after the defence",
    subtext:
      "Many Masters and PhD students want to publish. Turning a thesis into an article means cutting heavily, choosing a suitable journal, following its author guidelines and responding to reviewers. Support at this point is about editing, structuring and understanding the peer review process, while the authorship and scholarly claims remain yours.",
  },
];

const faqs = [
  {
    q: "Is it legal and acceptable to get thesis support in Kenya?",
    a: "Seeking guidance, coaching, editing and methodological advice is a normal part of academic life, much like working with a supervisor or a writing centre. What is not acceptable is submitting work written by someone else as your own. Always follow the rules of your institution and the guidance of your supervisor.",
  },
  {
    q: "Can a consultant choose my topic for me?",
    a: "A consultant can help you refine, narrow and test a topic, but the final choice should be yours and should be approved by your supervisor or department.",
  },
  {
    q: "How much does thesis support cost?",
    a: "Cost depends on scope, level of study, the stage you are at and the time available. TaskLynk does not publish fixed prices for research work. You share your requirements and receive a quotation before anything begins. You can read more on the pricing page.",
  },
  {
    q: "Do you help with SPSS, Stata, R or NVivo?",
    a: "Yes, support can include learning how to prepare data, choose suitable tests, run them and interpret the output so that you can explain your own results.",
  },
  {
    q: "Can you help me prepare for a viva?",
    a: "Yes. Viva preparation can include a review of your own chapters, a list of likely questions, feedback on slides and a mock defence so you can practise explaining your study.",
  },
  {
    q: "Will support guarantee a pass or a particular grade?",
    a: "No. Marks are decided by your examiners and your institution. Good support improves your understanding and the clarity of your work, but no honest provider can promise a result.",
  },
];

const outbound = [
  { href: "https://apastyle.apa.org", label: "APA Style" },
  { href: "https://www.cue.or.ke", label: "Commission for University Education" },
  { href: "https://www.zotero.org", label: "Zotero" },
  { href: "https://www.mendeley.com", label: "Mendeley" },
  { href: "https://www.scribbr.com", label: "Scribbr" },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: blogMeta.title,
  description: PAGE_DESC,
  datePublished: blogMeta.date,
  dateModified: blogMeta.date,
  author: { "@type": "Organization", name: "TaskLynk" },
  publisher: { "@type": "Organization", name: "TaskLynk" },
  mainEntityOfPage: `https://www.tasklynk.co.ke${PATH}`,
  keywords: blogMeta.keywords.join(", "),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tasklynk.co.ke/" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.tasklynk.co.ke/blog" },
    { "@type": "ListItem", position: 3, name: blogMeta.title, item: `https://www.tasklynk.co.ke${PATH}` },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function renderInline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return p;
    const external = m[2].startsWith("http");
    const cls = "font-semibold text-[#E9662F] underline underline-offset-2 hover:text-[#FF7A3D] dark:text-[#FF9a6a]";
    return external ? (
      <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className={cls}>
        {m[1]}
      </a>
    ) : (
      <Link key={i} href={m[2]} className={cls}>
        {m[1]}
      </Link>
    );
  });
}

export default function ThesisDissertationResearchSupportGuide() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] text-[#22183D] dark:bg-[#140E24] dark:text-[#EDE8F7] relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <MainHeader />

      <header className="border-b border-[#DDD3E9]/40 bg-transparent px-4 pb-10 pt-12 text-center relative overflow-hidden sm:pt-16">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#5b4d80] dark:text-[#bfb4dc]">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/blog" className="hover:underline">Blog</Link> / Thesis support
        </nav>
        <p className="mb-3 inline-block rounded-full bg-[#FF7A3D]/15 px-4 py-1 text-xs sm:text-sm font-semibold text-[#E9662F] dark:text-[#FF9a6a]">
          {blogMeta.category} &middot; {blogMeta.readTime}
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl tracking-tight text-[#22183D] dark:text-white">
          Thesis and Dissertation Support in Kenya: Your Research Journey, Stage by Stage
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[#4a3c6e] dark:text-[#cfc6e6] sm:text-lg font-normal leading-relaxed">
          From a rough idea to a confident viva, here is a practical roadmap for undergraduate, Masters and PhD students, and an honest look at how ethical research support can help you do the work well.
        </p>
        <div className="mt-8">
          <RoadmapIllustration />
        </div>
      </header>

      <div className="sticky top-0 z-30 hidden border-b border-[#e3d9f3] bg-white/90 backdrop-blur dark:border-[#33264f] dark:bg-[#140E24]/90 lg:block">
        <nav aria-label="Journey progress" className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2 text-sm">
          {stages.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-full px-2 py-1 font-medium hover:bg-[#F5EEFB] dark:hover:bg-[#241a3d]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF7A3D] text-xs font-bold text-white">{i + 1}</span>
              <span className="capitalize">{s.id}</span>
            </a>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <section aria-labelledby="why" className="mb-12">
          <h2 id="why" className="mb-4 text-2xl font-bold sm:text-3xl">Why research support matters for Kenyan students</h2>
          <p className="mb-4 leading-relaxed">
            A thesis or dissertation is usually the longest and most demanding piece of writing a student will ever complete. Undergraduates carry a final year project, Masters students defend a dissertation, and PhD candidates spend years on original research. Along the way they juggle jobs, family, fees, supervisor schedules and strict institutional deadlines. It is no surprise that many people look for thesis support in Kenya.
          </p>
          <p className="mb-4 leading-relaxed">
            The best support does not replace your effort. It shortens the distance between confusion and clarity. A good mentor explains why a research gap matters, shows you how a methodology chapter is structured, and gives feedback on your drafts so you can improve them yourself. This guide walks through the full journey and shows where dissertation help in Kenya is genuinely useful.
          </p>
          <p className="leading-relaxed">
            You can also read about our wider <Link href="/services/academic-writing" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">academic writing services</Link>, or go straight to the <Link href="/catalogue/thesis-dissertation-research-support" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">thesis, dissertation and research support catalogue</Link> if you already know what you need.
          </p>
        </section>

        <section aria-labelledby="ethics" className="mb-14 rounded-2xl border border-[#FF7A3D]/40 bg-white p-6 shadow-sm dark:bg-[#1d1535]">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-[#FF7A3D]" aria-hidden="true" />
            <h2 id="ethics" className="text-2xl font-bold">Using support ethically and following institutional rules</h2>
          </div>
          <p className="mb-3 leading-relaxed">
            Academic integrity comes first. Universities in Kenya, guided by regulators such as the <a href="https://www.cue.or.ke" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">Commission for University Education</a>, expect assessed work to be the student&apos;s own. TaskLynk supports your own research, writing, understanding and revision. We do not encourage anyone to submit work produced by another person under their name.
          </p>
          <h3 className="mb-2 mt-4 text-lg font-semibold">What ethical support looks like</h3>
          <ul className="mb-3 list-disc space-y-1 pl-6">
            <li>Explaining concepts, methods and statistical tests so you understand them</li>
            <li>Giving feedback on drafts that you wrote and then revise yourself</li>
            <li>Proofreading for grammar, clarity, formatting and citation consistency</li>
            <li>Coaching you for your proposal defence or viva</li>
            <li>Sample structures and worked examples used for learning</li>
          </ul>
          <h3 className="mb-2 mt-4 text-lg font-semibold">What you should always do</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Read your institution&apos;s policy on editing, proofreading and outside help</li>
            <li>Tell your supervisor if you are unsure whether a form of help is allowed</li>
            <li>Keep your own notes, drafts and data so you can show how the work developed</li>
            <li>Use any material you receive as a learning resource, not as a finished submission</li>
          </ul>
        </section>

        <section aria-labelledby="journey" className="mb-14">
          <h2 id="journey" className="mb-3 text-2xl font-bold sm:text-3xl">The thesis journey, stage by stage</h2>
          <p className="mb-8 leading-relaxed">
            Think of your thesis as a path with clear milestones. Each stage below includes a short explanation, a checklist you can copy into your notes, and a comparison of what good work looks like against the problems we see most often.
          </p>

          <ol className="relative space-y-10 border-l-4 border-dashed border-[#FF7A3D]/60 pl-6 sm:pl-10">
            {stages.map((s, i) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[3.1rem] top-0 hidden sm:block">
                  <StageIcon n={i + 1} />
                </span>
                <article id={s.id} className="scroll-mt-24 rounded-2xl border border-[#e3d9f3] bg-white p-5 shadow-sm dark:border-[#33264f] dark:bg-[#1d1535] sm:p-7">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                    <Flag className="h-5 w-5 text-[#FF7A3D]" aria-hidden="true" />
                    {s.title}
                  </h3>
                  {s.intro.map((p, k) => (
                    <p key={k} className="mb-3 leading-relaxed">{renderInline(p)}</p>
                  ))}

                  <div className="my-5 rounded-xl bg-[#F5EEFB] p-4 dark:bg-[#241a3d]">
                    <h4 className="mb-2 font-semibold">Checklist for this stage</h4>
                    <ul className="space-y-2">
                      {s.checklist.map((c) => (
                        <li key={c} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#FF7A3D]" aria-hidden="true" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
                      <h4 className="mb-2 flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> What good looks like
                      </h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {s.good.map((g) => <li key={g}>{g}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                      <h4 className="mb-2 flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" /> Common problems
                      </h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {s.problems.map((g) => <li key={g}>{g}</li>)}
                      </ul>
                    </div>
                  </div>

                  <h4 className="mb-1 mt-5 font-semibold">{s.subhead}</h4>
                  <p className="leading-relaxed">{s.subtext}</p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="levels" className="mb-14">
          <h2 id="levels" className="mb-4 text-2xl font-bold sm:text-3xl">Support at undergraduate, Masters and PhD level</h2>
          <p className="mb-4 leading-relaxed">
            The journey looks different depending on your level, and good support adapts to it.
          </p>
          <h3 className="mb-2 text-xl font-semibold">Undergraduate projects</h3>
          <p className="mb-4 leading-relaxed">
            Final year projects are usually shorter, with a smaller sample and a simpler design. The biggest challenges are choosing a manageable topic, writing a clear problem statement and presenting descriptive results neatly. Support often focuses on structure, understanding basic statistics and making sure the document follows the school template.
          </p>
          <h3 className="mb-2 text-xl font-semibold">Masters dissertations</h3>
          <p className="mb-4 leading-relaxed">
            Masters work expects a stronger literature review, a justified methodology and deeper analysis. Students often need research methodology consultation, help choosing between regression, ANOVA or thematic analysis, and guidance on writing a discussion that engages with existing theory.
          </p>
          <h3 className="mb-2 text-xl font-semibold">PhD theses</h3>
          <p className="mb-4 leading-relaxed">
            Doctoral candidates must show an original contribution. Support here is more advanced: refining a theoretical framework, planning multi-phase or mixed-methods studies, handling large datasets, preparing for publications and rehearsing for a rigorous defence. The independence expected at this level makes ethical boundaries even more important.
          </p>
        </section>

        <section aria-labelledby="tasklynk" className="mb-14">
          <h2 id="tasklynk" className="mb-4 text-2xl font-bold sm:text-3xl">How TaskLynk coordinates research support</h2>
          <p className="mb-4 leading-relaxed">
            TaskLynk is a managed platform. You do not have to hunt through strangers online and hope for the best. You describe what you need, a project manager reviews the request, and a vetted specialist with relevant subject or method experience is matched to your project. The project manager stays involved to coordinate communication, timelines and quality checks.
          </p>
          <h3 className="mb-2 text-xl font-semibold">A simple working process</h3>
          <ol className="mb-4 list-decimal space-y-2 pl-6">
            <li>Tell us your level, programme, current stage and the kind of help you want.</li>
            <li>Share any guidelines from your school or supervisor.</li>
            <li>Receive a quotation based on scope, since pricing depends on the work involved.</li>
            <li>Work with your specialist through feedback, explanations and revision support.</li>
            <li>Use what you learn to improve your own chapters and prepare for submission.</li>
          </ol>
          <p className="mb-4 leading-relaxed">
            To see the kinds of help available, browse the <Link href="/catalogue/thesis-dissertation-research-support" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">thesis and dissertation research support services</Link>. For an overview of how costs are handled, visit the <Link href="/pricing" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">pricing page</Link>. If you are unsure where to begin, the <Link href="/contact" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">contact page</Link> is the easiest way to ask a question.
          </p>
        </section>

        <section aria-labelledby="tools" className="mb-14">
          <h2 id="tools" className="mb-4 text-2xl font-bold sm:text-3xl">Useful tools and trusted references</h2>
          <p className="mb-4 leading-relaxed">
            A few free or widely available resources make the journey smoother. Reference managers such as <a href="https://www.zotero.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">Zotero</a> and <a href="https://www.mendeley.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">Mendeley</a> keep your sources organised. The <a href="https://apastyle.apa.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">APA Style</a> site explains citation rules clearly, and <a href="https://www.scribbr.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">Scribbr</a> offers readable guides on methods, statistics and writing.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {outbound.map((o) => (
              <li key={o.href}>
                <a href={o.href} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[#e3d9f3] bg-white px-4 py-2 text-sm font-medium hover:border-[#FF7A3D] dark:border-[#33264f] dark:bg-[#1d1535]">
                  {o.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 leading-relaxed">
            Always check your own school guidelines first. When your department rules differ from a general guide, your department rules win.
          </p>
        </section>

        <section aria-labelledby="mistakes" className="mb-14">
          <h2 id="mistakes" className="mb-4 text-2xl font-bold sm:text-3xl">Common mistakes to avoid</h2>
          <h3 className="mb-2 text-xl font-semibold">Leaving everything to the last month</h3>
          <p className="mb-4 leading-relaxed">
            Research takes longer than expected. Ethics approval, permits, data collection and supervisor feedback all have delays. Build slack into your plan and start writing early, even if the first draft is rough.
          </p>
          <h3 className="mb-2 text-xl font-semibold">Ignoring supervisor feedback</h3>
          <p className="mb-4 leading-relaxed">
            Your supervisor knows what your panel expects. If outside support suggests something different from your supervisor, follow your supervisor and ask for a reason from both sides.
          </p>
          <h3 className="mb-2 text-xl font-semibold">Choosing support based only on price or promises</h3>
          <p className="leading-relaxed">
            Be careful with anyone who guarantees marks or promises completed work that you can hand in. Honest providers explain their process, state clearly what they will and will not do, and agree scope before work begins.
          </p>
        </section>

        <section aria-labelledby="faq" className="mb-14">
          <h2 id="faq" className="mb-4 text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-[#e3d9f3] bg-white p-4 dark:border-[#33264f] dark:bg-[#1d1535]">
                <summary className="cursor-pointer font-semibold marker:text-[#FF7A3D]">{f.q}</summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="next" className="mb-6">
          <h2 id="next" className="mb-3 text-2xl font-bold sm:text-3xl">Your next step</h2>
          <p className="leading-relaxed">
            Whatever your stage, begin with one small action: write your problem statement in two sentences, list your objectives, or build your reference library. Then ask for support where you are stuck. More guides are available on the <Link href="/blog" className="font-semibold text-[#E9662F] underline underline-offset-2 dark:text-[#FF9a6a]">TaskLynk blog</Link>.
          </p>
        </section>
      </main>

      <section aria-labelledby="cta" className="bg-gradient-to-r from-[#22183D] to-[#2a0e74] px-4 py-12 text-center text-white">
        <h2 id="cta" className="mx-auto max-w-2xl text-2xl font-bold sm:text-3xl">Ready to move to the next milestone?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[#e6defa]">
          Explore thesis, dissertation and research support coordinated by a project manager, and request a quotation that fits your scope.
        </p>
        <Link
          href="/catalogue/thesis-dissertation-research-support"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF7A3D] px-6 py-3 font-semibold text-white transition hover:bg-[#E9662F] focus:outline-none focus:ring-2 focus:ring-white"
        >
          Browse thesis and research support <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
