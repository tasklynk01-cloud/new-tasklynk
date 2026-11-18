import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mic, Tags, Lightbulb, Handshake, ShieldCheck, Clock } from 'lucide-react';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { blogMeta } from './meta';

const PATH = '/blog/qualitative-mixed-methods-research-support-kenya-guide';
const TITLE = 'Qualitative and Mixed-Methods Research Support in Kenya';
const DESCRIPTION =
  'Learn how transcription, coding, thematic analysis, NVivo and ATLAS.ti support, and mixed methods integration differ, with practical guidance for Kenyan researchers.';

export const metadata: Metadata = generateCanonicalMetadata(PATH, {
  title: TITLE,
  description: DESCRIPTION,
  keywords: blogMeta.keywords,
  openGraph: {
    type: 'article',
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-10-29',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
});

const faqs = [
  {
    q: 'What is the difference between transcription and coding?',
    a: 'Transcription converts audio or video into written text. Coding is an analytical step in which you label segments of that text with short descriptive tags. A transcript is raw material, while codes are the first layer of analysis.',
  },
  {
    q: 'Can someone else write my interpretation of the findings?',
    a: 'No. Interpretation belongs to the researcher. A specialist can explain methods, check that your themes are supported by the data and give feedback on your drafts, but you remain responsible for the conclusions and the writing.',
  },
  {
    q: 'Do you handle interviews held in Kiswahili or mixed with Sheng?',
    a: 'Many Kenyan interviews switch between English, Kiswahili, Sheng and mother tongues. When you request transcription, state the languages involved and whether you need a verbatim record, a translated version or both, so the right person can be matched to the work.',
  },
  {
    q: 'Which is better, NVivo or ATLAS.ti?',
    a: 'Both support rigorous qualitative work. The better choice is usually the one your supervisor, department or funder already uses, or the one whose interface suits your data. Support is available for either tool.',
  },
  {
    q: 'How is pricing decided?',
    a: 'Pricing depends on the number of recordings, their length, audio quality, languages and the type of support needed. TaskLynk confirms the cost through a quotation before work begins, so there are no surprises.',
  },
  {
    q: 'How are my recordings and transcripts kept safe?',
    a: 'Share only what is necessary, remove names and identifying details where possible, and use secure channels. Your consent forms should also explain who may access recordings. Raise any restrictions from your ethics approval when you submit the request.',
  },
];

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
    mainEntityOfPage: PATH,
    keywords: blogMeta.keywords.join(', '),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: '/blog' },
      { '@type': 'ListItem', position: 3, name: TITLE, item: PATH },
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

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
const linkCls =
  'font-medium text-[#c2501a] underline decoration-[#FF7A3D]/50 underline-offset-2 hover:text-[#E9662F] dark:text-[#ff9a68]';
const h2Cls = 'mt-14 text-2xl font-bold tracking-tight text-[#22183D] sm:text-3xl dark:text-white';
const h3Cls = 'mt-8 text-lg font-semibold text-[#2a0e74] dark:text-[#d9c8ff]';
const pCls = 'mt-4 leading-8 text-slate-700 dark:text-slate-300';

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-8 rounded-r-2xl border-l-4 border-[#FF7A3D] bg-[#F5EEFB] px-6 py-5 text-lg font-medium italic leading-8 text-[#22183D] dark:bg-[#1f1636] dark:text-[#f3eaff]">
      {children}
    </blockquote>
  );
}

function HeroArt() {
  return (
    <svg
      viewBox="0 0 640 300"
      role="img"
      aria-label="Illustration: speech bubbles flow into colour coded sticky notes, which then connect into a theme map of nodes and links"
      className="h-auto w-full"
    >
      <rect width="640" height="300" rx="24" fill="#FAF8FD" className="dark:fill-[#1b1230]" />
      {/* bubbles */}
      <g>
        <rect x="24" y="30" width="120" height="52" rx="18" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <path d="M50 82 L44 98 L68 82 Z" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <rect x="40" y="46" width="70" height="6" rx="3" fill="#cbb8f0" />
        <rect x="40" y="60" width="50" height="6" rx="3" fill="#cbb8f0" />
        <rect x="44" y="118" width="120" height="52" rx="18" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <path d="M130 170 L138 186 L112 170 Z" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <rect x="60" y="134" width="80" height="6" rx="3" fill="#cbb8f0" />
        <rect x="60" y="148" width="56" height="6" rx="3" fill="#cbb8f0" />
        <rect x="20" y="206" width="120" height="52" rx="18" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <path d="M46 258 L40 274 L64 258 Z" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
        <rect x="36" y="222" width="76" height="6" rx="3" fill="#cbb8f0" />
        <rect x="36" y="236" width="48" height="6" rx="3" fill="#cbb8f0" />
      </g>
      {/* flow arrows */}
      <g fill="none" stroke="#FF7A3D" strokeWidth="3" strokeLinecap="round">
        <path d="M156 58 C190 58 190 80 220 80" />
        <path d="M176 144 C200 144 200 150 220 150" />
        <path d="M150 232 C190 232 190 220 220 220" />
        <path d="M352 70 C380 70 380 120 408 120" />
        <path d="M352 150 C380 150 380 150 408 150" />
        <path d="M352 230 C380 230 380 180 408 180" />
      </g>
      {/* sticky notes */}
      <g>
        <rect x="222" y="50" width="130" height="56" rx="6" fill="#FFD27A" transform="rotate(-3 287 78)" />
        <rect x="222" y="124" width="130" height="56" rx="6" fill="#B9E4C9" transform="rotate(2 287 152)" />
        <rect x="222" y="198" width="130" height="56" rx="6" fill="#C9B8F5" transform="rotate(-2 287 226)" />
        <text x="238" y="84" fontSize="14" fontWeight="700" fill="#22183D">COST BARRIER</text>
        <text x="238" y="158" fontSize="14" fontWeight="700" fill="#22183D">TRUST IN STAFF</text>
        <text x="238" y="232" fontSize="14" fontWeight="700" fill="#22183D">DISTANCE</text>
      </g>
      {/* theme map */}
      <g stroke="#2a0e74" strokeWidth="2.5" fill="none">
        <line x1="520" y1="150" x2="450" y2="100" />
        <line x1="520" y1="150" x2="590" y2="90" />
        <line x1="520" y1="150" x2="455" y2="210" />
        <line x1="520" y1="150" x2="590" y2="220" />
      </g>
      <circle cx="520" cy="150" r="34" fill="#FF7A3D" />
      <text x="520" y="146" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">ACCESS</text>
      <text x="520" y="162" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">THEME</text>
      <circle cx="450" cy="100" r="16" fill="#FFD27A" stroke="#2a0e74" strokeWidth="2" />
      <circle cx="590" cy="90" r="16" fill="#B9E4C9" stroke="#2a0e74" strokeWidth="2" />
      <circle cx="455" cy="210" r="16" fill="#C9B8F5" stroke="#2a0e74" strokeWidth="2" />
      <circle cx="590" cy="220" r="16" fill="#ffffff" stroke="#2a0e74" strokeWidth="2" />
    </svg>
  );
}

const stages = [
  {
    n: '01',
    name: 'Transcription',
    icon: Mic,
    does: 'Turns audio or video into accurate written text, with speakers labelled and language choices recorded.',
    not: 'Does not label, interpret or judge the content.',
  },
  {
    n: '02',
    name: 'Coding',
    icon: Tags,
    does: 'Applies short labels to segments of text, guided by a codebook that you can defend and revise.',
    not: 'Does not decide what the findings mean.',
  },
  {
    n: '03',
    name: 'Interpretation',
    icon: Lightbulb,
    does: 'Groups codes into themes and explains what they say about your research questions. This stage is yours.',
    not: 'Cannot be handed to anyone else if the work is to remain your own.',
  },
  {
    n: '04',
    name: 'Full project support',
    icon: Handshake,
    does: 'Coordinates the whole journey: planning, tools, methodology guidance, feedback on drafts and structure.',
    not: 'Does not replace the researcher as author of the conclusions.',
  },
];

function Pipeline() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-3" role="region" aria-label="Four stage qualitative research pipeline" tabIndex={0}>
      <ol className="flex min-w-[860px] items-stretch gap-3 md:min-w-0">
        {stages.map((s, i) => (
          <li key={s.name} className="relative flex w-1/4 min-w-[205px] flex-col rounded-2xl border border-[#e3d6f5] bg-white p-5 shadow-sm dark:border-[#3a2a63] dark:bg-[#1b1230]">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-[#FF7A3D]">{s.n}</span>
              <s.icon className="h-6 w-6 text-[#2a0e74] dark:text-[#d9c8ff]" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#22183D] dark:text-white">{s.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{s.does}</p>
            <p className="mt-3 border-t border-dashed border-[#d9c8ff] pt-3 text-sm font-medium leading-6 text-[#2a0e74] dark:border-[#3a2a63] dark:text-[#d9c8ff]">{s.not}</p>
            {i < stages.length - 1 && (
              <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#FF7A3D] text-white md:flex">
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function MixedDiagram() {
  const box = (x: number, y: number, label: string, fill: string) => (
    <g>
      <rect x={x} y={y} width="78" height="34" rx="8" fill={fill} stroke="#2a0e74" strokeWidth="2" />
      <text x={x + 39} y={y + 22} textAnchor="middle" fontSize="13" fontWeight="700" fill="#22183D">{label}</text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 660 250"
      role="img"
      aria-label="Diagram of three mixed methods designs: convergent, where quantitative and qualitative strands run in parallel and merge; explanatory sequential, where quantitative leads to qualitative; and exploratory sequential, where qualitative leads to quantitative"
      className="h-auto w-full"
    >
      <rect width="660" height="250" rx="20" fill="#FAF8FD" className="dark:fill-[#1b1230]" />
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#FF7A3D" />
        </marker>
      </defs>
      {/* convergent */}
      <text x="110" y="28" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2a0e74">Convergent</text>
      {box(20, 50, 'QUAN', '#C9B8F5')}
      {box(20, 130, 'QUAL', '#FFD27A')}
      {box(150, 90, 'MERGE', '#B9E4C9')}
      <g stroke="#FF7A3D" strokeWidth="3" fill="none" markerEnd="url(#arr)">
        <path d="M100 67 C125 67 125 100 148 104" />
        <path d="M100 147 C125 147 125 124 148 118" />
      </g>
      {/* explanatory */}
      <text x="330" y="28" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2a0e74">Explanatory sequential</text>
      {box(260, 80, 'QUAN', '#C9B8F5')}
      {box(380, 80, 'qual', '#FFD27A')}
      <path d="M340 97 L376 97" stroke="#FF7A3D" strokeWidth="3" markerEnd="url(#arr)" />
      <text x="330" y="150" textAnchor="middle" fontSize="12" fill="#475569">Numbers first, then</text>
      <text x="330" y="166" textAnchor="middle" fontSize="12" fill="#475569">voices explain them</text>
      {/* exploratory */}
      <text x="550" y="28" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2a0e74">Exploratory sequential</text>
      {box(490, 80, 'QUAL', '#FFD27A')}
      {box(580, 150, 'quan', '#C9B8F5')}
      <path d="M568 100 C600 100 612 120 618 148" stroke="#FF7A3D" strokeWidth="3" fill="none" markerEnd="url(#arr)" />
      <text x="520" y="190" textAnchor="middle" fontSize="12" fill="#475569">Voices first, then a</text>
      <text x="520" y="206" textAnchor="middle" fontSize="12" fill="#475569">measure is built and tested</text>
    </svg>
  );
}

const codebook = [
  ['ACCESS_COST', 'Participant mentions money, fares or fees as a barrier to using a service.', 'Include: clinic fees, matatu fare. Exclude: general complaints about prices with no link to use.', '“I counted my fare before I counted my pain.”'],
  ['STAFF_TRUST', 'Participant expresses confidence or doubt in staff behaviour or competence.', 'Include: respect, rudeness, confidentiality. Exclude: staff shortages alone.', '“The nurse greeted me by name.”'],
  ['DISTANCE', 'Participant refers to travel time, terrain or distance to a facility.', 'Include: walking hours, flooded roads. Exclude: waiting time inside the facility.', '“The river cuts us off in the rains.”'],
  ['FAMILY_DECISION', 'Participant describes decisions shaped by relatives or elders.', 'Include: permission, advice. Exclude: financial support only (use ACCESS_COST).', '“My mother in law decides first.”'],
];

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] text-slate-800 dark:bg-[#140E24] dark:text-slate-200 relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
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
        {/* HERO */}
        <header className="border-b border-[#DDD3E9]/40 bg-transparent relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2 relative z-10">
            <div>
              <nav aria-label="Breadcrumb" className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
                <Link href="/" className="hover:underline">Home</Link> / <Link href="/blog" className="hover:underline">Blog</Link> / Qualitative research
              </nav>
              <p className="mt-6 inline-block rounded-full bg-[#5B3594] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                {blogMeta.category}
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#22183D] sm:text-4xl lg:text-5xl dark:text-white">
                From voices to themes: qualitative and mixed-methods research support in Kenya
              </h1>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#4A4160] dark:text-[#DDD3E9]/90 font-normal">
                A clear guide to transcription, coding, interpretation and full project support, so you know exactly which help you need and which work must remain yours.
              </p>
              <p className="mt-5 flex items-center gap-2 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">
                <Clock className="h-4 w-4 text-[#FF7A3D]" aria-hidden="true" /> {blogMeta.readTime} · Published 29 October 2026
              </p>
            </div>
            <HeroArt />
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-4 pb-16">
          <section>
            <h2 className={h2Cls}>Why qualitative work needs more than a transcript</h2>
            <p className={pCls}>
              Every year, Kenyan graduate students, public health teams, education researchers and NGO evaluators collect hours of interviews and focus group discussions. The recordings feel like progress, and they are. Yet many projects stall at exactly this point, because a folder of audio files is not yet a finding. Someone must convert speech into text, build a way of organising it, notice patterns, and explain those patterns to a reader who was not in the room.
            </p>
            <p className={pCls}>
              This guide explains that journey in plain language. It also draws firm lines between four different kinds of help: transcription, coding, interpretation and full project support. Those lines matter for quality, and they matter for academic integrity. If you search for qualitative data analysis in Kenya, you will find offers that blur all four together. A careful researcher separates them, uses support where it is legitimate, and keeps authorship of the argument.
            </p>
            <Pull>A transcript records what was said. A theme explains why it matters. Only the researcher can stand behind that explanation.</Pull>
          </section>

          <section>
            <h2 className={h2Cls}>Four stages, four different jobs</h2>
            <p className={pCls}>
              Think of qualitative research as a pipeline. Each stage has a different purpose, a different skill set and a different level of researcher ownership. Scroll sideways on a phone to see all four.
            </p>
            <div className="mt-6"><Pipeline /></div>
            <p className={pCls}>
              Transcription is largely technical and can be done by a trained listener. Coding is analytical but guided by your codebook, so a specialist can apply it under your direction and then you review every decision. Interpretation is where your judgement, theory and context come together. Full project support surrounds all of this with planning, tool training and feedback, without taking over the thinking.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Interview and focus group transcription in Kenya</h2>
            <p className={pCls}>
              Good interview transcription in Kenya begins before anyone presses play. The quality of your transcript depends on the quality of your recording, the languages spoken and the clarity of your instructions.
            </p>
            <h3 className={h3Cls}>Verbatim, clean verbatim or translated</h3>
            <p className={pCls}>
              A verbatim transcript keeps every pause, false start and filler. It suits conversation analysis and some narrative studies. A clean verbatim transcript removes fillers and repetitions but keeps the meaning and the speaker voice, and it suits most thematic studies. If your participants spoke Kiswahili, Sheng or a mother tongue such as Kikuyu, Luo or Kalenjin, decide whether you need the original language, an English translation, or both side by side. Back translation by a second person is a common quality check when the translated text will be quoted in a thesis.
            </p>
            <h3 className={h3Cls}>Focus group transcription needs speaker discipline</h3>
            <p className={pCls}>
              Focus group transcription is harder than one to one transcription. Voices overlap, people interrupt, and side comments carry meaning. A good transcript labels speakers consistently (for example Participant 1, Participant 2, Moderator), marks inaudible sections with timestamps and notes laughter or silence when it affects meaning. Ask the moderator to note the seating order or voice features right after the session, because this makes later labelling far more accurate.
            </p>
            <h3 className={h3Cls}>Prepare your recordings</h3>
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-slate-700 dark:text-slate-300">
              <li>Record in a quiet room and place the device near the centre of the group.</li>
              <li>Test the device before every session and keep spare batteries.</li>
              <li>Name files consistently, for example by site, date and participant code, never by real names.</li>
              <li>Write down any specialised terms, place names and abbreviations that the transcriber should expect.</li>
              <li>State your preferred format, such as speaker labels, timestamps every minute and your template.</li>
            </ul>
            <p className={pCls}>
              Remember that transcription alone is not analysis. A well formatted transcript is a faithful record, and it is the foundation on which everything else rests.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Coding qualitative data and developing a codebook</h2>
            <p className={pCls}>
              Coding qualitative data means reading the transcript closely and attaching short labels to meaningful segments. A code is not a theme. A code is a small, specific handle such as ACCESS_COST. A theme is a broader pattern of meaning built from several codes.
            </p>
            <h3 className={h3Cls}>Inductive, deductive or both</h3>
            <p className={pCls}>
              In inductive coding, codes emerge from the data itself, which suits exploratory questions. In deductive coding, you begin with codes drawn from a framework, such as a health behaviour model or an education policy framework, and test how well they fit. Many Kenyan theses use a hybrid approach: a small set of framework codes plus new codes that arise from participants. Your methodology chapter should state which approach you used and why.
            </p>
            <h3 className={h3Cls}>What good codebook development looks like</h3>
            <p className={pCls}>
              Codebook development is the discipline that makes coding transparent. Each code needs a name, a definition, rules for inclusion and exclusion, and an example quote. When two people code the same data, the codebook is what allows them to compare decisions and resolve differences. Here is a short sample drawn from a fictional study on access to maternal health services.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3d6f5] dark:border-[#3a2a63]" role="region" aria-label="Sample codebook table" tabIndex={0}>
              <table className="min-w-[640px] w-full text-left text-sm">
                <caption className="bg-[#F5EEFB] px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-[#2a0e74] dark:bg-[#1f1636] dark:text-[#d9c8ff]">
                  Sample codebook (fictional study, for illustration only)
                </caption>
                <thead className="bg-[#22183D] text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3">Code</th>
                    <th scope="col" className="px-4 py-3">Definition</th>
                    <th scope="col" className="px-4 py-3">Inclusion and exclusion</th>
                    <th scope="col" className="px-4 py-3">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d6f5] bg-white dark:divide-[#3a2a63] dark:bg-[#1b1230]">
                  {codebook.map((r) => (
                    <tr key={r[0]} className="align-top">
                      <th scope="row" className="whitespace-nowrap px-4 py-3 font-bold text-[#a8430f] dark:text-[#ffb08a]">{r[0]}</th>
                      <td className="px-4 py-3 leading-6">{r[1]}</td>
                      <td className="px-4 py-3 leading-6">{r[2]}</td>
                      <td className="px-4 py-3 italic leading-6">{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={pCls}>
              Notice that the exclusion rules do as much work as the definitions. They stop codes from swallowing each other and keep the analysis consistent from the first transcript to the last.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>A worked example: from an excerpt to a theme</h2>
            <p className={pCls}>
              The excerpt below is entirely fictional. It was written to show the logic of coding and theme building, and it does not come from any real participant or study.
            </p>
            <figure className="mt-6 overflow-hidden rounded-2xl border border-[#e3d6f5] bg-white dark:border-[#3a2a63] dark:bg-[#1b1230]">
              <figcaption className="bg-[#FF7A3D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#22183D]">
                Fictional interview excerpt
              </figcaption>
              <div className="space-y-4 p-5 leading-8">
                <p><strong>Interviewer:</strong> What made it difficult to attend the clinic during your pregnancy?</p>
                <p>
                  <strong>Participant 7:</strong>{' '}
                  <mark className="rounded bg-[#FFD27A] px-1 text-[#22183D]">The fare was about half of what I earn in a day</mark>, and{' '}
                  <mark className="rounded bg-[#C9B8F5] px-1 text-[#22183D]">the road floods when it rains, so sometimes we walk for hours</mark>. When I finally arrived,{' '}
                  <mark className="rounded bg-[#B9E4C9] px-1 text-[#22183D]">the nurse knew my name and did not shout at me</mark>, so I went back.
                </p>
              </div>
              <ul className="grid gap-3 border-t border-[#e3d6f5] p-5 text-sm sm:grid-cols-3 dark:border-[#3a2a63]">
                <li className="rounded-xl bg-[#FFD27A]/40 p-3"><strong>Code:</strong> ACCESS_COST</li>
                <li className="rounded-xl bg-[#C9B8F5]/40 p-3 dark:text-slate-100"><strong>Code:</strong> DISTANCE</li>
                <li className="rounded-xl bg-[#B9E4C9]/40 p-3 dark:text-slate-100"><strong>Code:</strong> STAFF_TRUST</li>
              </ul>
              <p className="border-t border-[#e3d6f5] bg-[#F5EEFB] p-5 font-semibold text-[#22183D] dark:border-[#3a2a63] dark:bg-[#1f1636] dark:text-[#f3eaff]">
                Candidate theme: “Access is a daily trade off between cost, distance and respect.”
              </p>
            </figure>
            <p className={pCls}>
              Look at what happened. The transcriber produced the text. A coder, working from your codebook, applied three labels. But the sentence in the last box is an interpretation. It claims that these three codes belong together and that respect can outweigh hardship. Whether that claim is supported depends on the other transcripts, on negative cases and on your theoretical framework. That is the stage where you must think for yourself, and where a supervisor expects to see your voice.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Thematic analysis, content analysis and open-ended survey responses</h2>
            <p className={pCls}>
              Thematic analysis help is among the most requested forms of support, and the method is widely taught. Braun and Clarke describe a sequence that moves from familiarisation, to initial coding, to searching for themes, reviewing them, defining and naming them, and finally writing up. You can read more about the journal literature on this approach through <a className={linkCls} href="https://www.tandfonline.com" {...ext}>Taylor and Francis Online</a>, where the original methodological papers are indexed.
            </p>
            <h3 className={h3Cls}>Thematic analysis versus content analysis</h3>
            <p className={pCls}>
              Thematic analysis looks for patterns of meaning and invites interpretation. Content analysis often counts how frequently categories appear, which can be useful when you need to compare documents, policies, radio transcripts or social media posts. Some studies use both, reporting counts alongside rich quotations. Choose the method that matches your research question, not the one that looks most impressive.
            </p>
            <h3 className={h3Cls}>Open-ended survey responses</h3>
            <p className={pCls}>
              Surveys frequently end with a box that reads “Any other comments?” In a large Kenyan household or school survey, that box can contain hundreds of short answers. They deserve systematic treatment. Clean the responses, remove personal details, develop a short codebook, code in a spreadsheet or in software, and then report categories with representative quotations. Short answers have less context than interviews, so claim less and stay close to the words.
            </p>
            <p className={pCls}>
              Qualitative rigour does not come from software or from numbers of participants. It comes from transparent decisions. Keep an audit trail: dated notes on why codes were merged, split or dropped. Consider member checking where it is ethical and practical, and look for cases that challenge your emerging themes.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>NVivo and ATLAS.ti support</h2>
            <p className={pCls}>
              Software does not analyse your data. It helps you store, organise, retrieve and visualise it. Two of the most widely used tools are <a className={linkCls} href="https://lumivero.com/products/nvivo" {...ext}>NVivo</a> and <a className={linkCls} href="https://atlasti.com" {...ext}>ATLAS.ti</a>. Universities in Kenya and the wider region often provide licences or training for one or both, so confirm with your department before you purchase anything.
            </p>
            <h3 className={h3Cls}>What NVivo support can cover</h3>
            <p className={pCls}>
              NVivo support typically includes setting up a project, importing transcripts, survey data and documents, creating a code structure, running queries and building matrices that show how codes appear across groups. Many students need help with practical problems: organising cases and attributes, merging work done by two coders, or exporting a codebook for an appendix.
            </p>
            <h3 className={h3Cls}>What ATLAS.ti support can cover</h3>
            <p className={pCls}>
              ATLAS.ti support follows a similar pattern: document groups, quotations, code groups, memos and network views that show relationships between codes. Network views are especially popular for presenting theme maps, though you should explain every link in words rather than leaving the diagram to speak alone.
            </p>
            <h3 className={h3Cls}>Support is not substitution</h3>
            <p className={pCls}>
              Legitimate software support means training, troubleshooting, project set up, quality checks and feedback on your coding scheme. It does not mean that someone else builds your themes and writes your discussion. If you want to learn the tool yourself, consider tutoring through the <Link className={linkCls} href="/catalogue/data-analysis-training-tutoring">data analysis training and tutoring</Link> service, which is designed to build your own confidence.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Mixed methods research: bringing numbers and voices together</h2>
            <p className={pCls}>
              Mixed methods research combines quantitative and qualitative strands within one study. It is common in Kenyan public health, education and community development, where a survey can show how widespread a problem is and interviews can show why. The value lies in integration. Two separate studies placed in one document are not mixed methods unless the findings speak to each other.
            </p>
            <figure className="mt-6">
              <MixedDiagram />
              <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Three core designs. Capital letters indicate the dominant strand, and arrows show the order of the work.
              </figcaption>
            </figure>
            <h3 className={h3Cls}>Convergent design</h3>
            <p className={pCls}>
              You collect both kinds of data at roughly the same time, analyse them separately and then merge the results to see where they agree or differ. A joint display table, with survey findings on one side and illustrative themes on the other, is a helpful way to show this.
            </p>
            <h3 className={h3Cls}>Explanatory sequential design</h3>
            <p className={pCls}>
              You begin with a survey, notice something surprising, such as low uptake of a programme among one group, and then interview selected participants to explain it. Your sampling for the second phase should follow logically from the first.
            </p>
            <h3 className={h3Cls}>Exploratory sequential design</h3>
            <p className={pCls}>
              You begin with interviews or focus groups to understand a poorly studied issue, then use the themes to build a questionnaire or scale, which you test with a larger sample. Instrument development needs careful pilot testing before use.
            </p>
            <p className={pCls}>
              If your quantitative strand needs statistical support, the <Link className={linkCls} href="/catalogue/data-analysis-statistics">data analysis and statistics</Link> service covers that side, while the broader methodological discussion is covered in resources from <a className={linkCls} href="https://www.sagepub.com" {...ext}>SAGE Publishing</a>, a major publisher of research methods texts.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Research ethics: consent, anonymisation and secure handling</h2>
            <p className={pCls}>
              Qualitative data is personal. People describe illness, grief, conflict, money and family life, often to a researcher they met a few days earlier. Ethical practice is therefore not an optional extra. In Kenya, most studies need approval from an institutional review board and, for many projects, a research permit from the national regulator. Follow the conditions of your approval at every stage, including when you involve outside help.
            </p>
            <h3 className={h3Cls}>Consent</h3>
            <p className={pCls}>
              Informed consent should explain the purpose of the study, what participation involves, how recordings will be used, who may hear or read them, and the right to withdraw. If transcription or analysis support will involve a third party, your consent form should say so in plain language. Read the form aloud in the participant language where literacy is limited.
            </p>
            <h3 className={h3Cls}>Anonymisation</h3>
            <p className={pCls}>
              Replace names with codes, and consider whether combinations of details could still identify someone. In a small village, a mention of the only secondary school headteacher is as identifying as a name. Keep the key linking codes to identities in a separate, protected location.
            </p>
            <h3 className={h3Cls}>Secure handling of recordings and transcripts</h3>
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-slate-700 dark:text-slate-300">
              <li>Store recordings on encrypted or password protected devices, not on shared phones.</li>
              <li>Share files only through secure channels and only with people who need them.</li>
              <li>Remove direct identifiers before sending material for transcription where possible.</li>
              <li>Agree in advance when files will be deleted, in line with your approval.</li>
              <li>Never post excerpts on social media or in group chats, even without names.</li>
            </ul>
            <p className={pCls}>
              For broader ethical guidance on research with human participants, the <a className={linkCls} href="https://www.who.int" {...ext}>World Health Organization</a> and the <a className={linkCls} href="https://www.apa.org" {...ext}>American Psychological Association</a> both publish widely referenced standards that Kenyan researchers often cite alongside local requirements.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>Presenting qualitative findings</h2>
            <p className={pCls}>
              Many strong analyses are weakened by thin presentation. Readers need to see the evidence, not only your conclusions. A reliable structure for each theme is: a clear name, a short statement of what the theme means, two or three well chosen quotations, and your interpretation linking the theme to the literature and to your research question.
            </p>
            <h3 className={h3Cls}>Choosing quotations</h3>
            <p className={pCls}>
              Select quotations that illustrate rather than decorate. Avoid using the same articulate participant for every theme, and show variation, including views that disagree. Identify speakers by code, role or site, for example “Community health volunteer, Site B”, without revealing identity.
            </p>
            <h3 className={h3Cls}>Visuals and tables</h3>
            <p className={pCls}>
              A theme map, a table of themes with sub themes and a joint display for mixed methods can help the reader follow your reasoning. Keep tables readable, label every figure and describe each one in the text. Your writing should explain what the reader is meant to notice.
            </p>
            <h3 className={h3Cls}>Tie it to the whole thesis</h3>
            <p className={pCls}>
              Your findings must connect back to the objectives in Chapter One and forward to your discussion and recommendations. If you need structure feedback across the whole document, the <Link className={linkCls} href="/catalogue/thesis-dissertation-research-support">thesis and dissertation research support</Link> service is the natural companion to analysis support.
            </p>
          </section>

          <section>
            <h2 className={h2Cls}>How TaskLynk supports qualitative and mixed-methods work</h2>
            <p className={pCls}>
              TaskLynk is a managed platform. When you submit a request, a project manager reviews what you need, clarifies the scope and coordinates a vetted specialist with suitable experience. You are not left to negotiate with strangers, and the stages above are kept separate so that each one is scoped honestly.
            </p>
            <p className={pCls}>
              You can explore the full range under <Link className={linkCls} href="/catalogue/qualitative-mixed-methods-research">qualitative and mixed-methods research support</Link>, covering transcription, coding assistance, codebook development, NVivo and ATLAS.ti help and guidance on presenting findings. Pricing depends on the volume and complexity of the work and is confirmed by quotation, so please see the <Link className={linkCls} href="/pricing">pricing page</Link> for how that works, or <Link className={linkCls} href="/contact">contact the team</Link> with your questions.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e3d6f5] bg-white p-5 dark:border-[#3a2a63] dark:bg-[#1b1230]">
                <h3 className="flex items-center gap-2 font-bold text-[#22183D] dark:text-white"><ShieldCheck className="h-5 w-5 text-[#FF7A3D]" aria-hidden="true" /> What support can include</h3>
                <p className="mt-2 text-sm leading-6">Transcription, applying your codebook, project set up, software training, methodology guidance and feedback on your drafts.</p>
              </div>
              <div className="rounded-2xl border border-[#e3d6f5] bg-white p-5 dark:border-[#3a2a63] dark:bg-[#1b1230]">
                <h3 className="flex items-center gap-2 font-bold text-[#22183D] dark:text-white"><Lightbulb className="h-5 w-5 text-[#FF7A3D]" aria-hidden="true" /> What stays with you</h3>
                <p className="mt-2 text-sm leading-6">Your research questions, your interpretation, your conclusions and the final writing. These must be your own work.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className={h2Cls}>A practical checklist before you begin</h2>
            <p className={pCls}>
              Before requesting help, gather a few things. Confirm your ethics approval and consent terms. Decide which languages and transcript style you need. Choose a software tool, or ask your supervisor which one is expected. Draft a preliminary codebook, even if it is rough, because it gives a specialist something concrete to work from. Finally, decide which stage you truly need: transcription alone, coding assistance, training so you can code yourself, or broader project guidance.
            </p>
            <p className={pCls}>
              Qualitative research rewards patience. When voices are transcribed faithfully, coded transparently and interpreted honestly, the final themes carry real weight. You can read related guidance on the <Link className={linkCls} href="/blog">TaskLynk blog</Link>.
            </p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className={h2Cls}>Frequently asked questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-[#e3d6f5] bg-white p-5 open:shadow-md dark:border-[#3a2a63] dark:bg-[#1b1230]">
                  <summary className="cursor-pointer list-none font-semibold text-[#22183D] marker:hidden dark:text-white">
                    {f.q}
                  </summary>
                  <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#22183D] to-[#2a0e74] px-4 py-14 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white sm:text-3xl">Ready to turn your recordings into defensible themes?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#e9ddff]">
            Tell us which stage you need and a project manager will confirm the scope and quotation.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/catalogue/qualitative-mixed-methods-research" className="inline-flex items-center gap-2 rounded-full bg-[#FF7A3D] px-6 py-3 font-semibold text-[#22183D] hover:bg-[#E9662F]">
              Explore qualitative research support <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact" className="inline-flex items-center rounded-full border border-white/60 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Contact the team
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
