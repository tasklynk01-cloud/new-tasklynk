import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  Award,
  Sparkles,
  Lock,
  Globe2,
} from 'lucide-react';

interface UniversityCurriculumBadgesProps {
  title?: string;
  subtitle?: string;
  showGuarantees?: boolean;
  compact?: boolean;
}

const KENYAN_INSTITUTIONS = [
  {
    shortName: 'UoN',
    name: 'University of Nairobi',
    school: 'School of Business • CHSS • Postgrad School',
    standard: 'UoN Graduate Thesis Manual & Repository Guidelines',
    badge: 'UoN Compliant',
    tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    shortName: 'Strathmore',
    name: 'Strathmore University',
    school: 'Strathmore Business School (SBS) • Law • Informatics',
    standard: 'SBS MBA Thesis Rubric & Harvard / APA 7th Format',
    badge: 'SBS Verified',
    tagColor: 'bg-[#5B3594]/10 text-[#5B3594] dark:bg-[#5B3594]/20 dark:text-[#EFE8F8] border-[#5B3594]/20',
  },
  {
    shortName: 'KU',
    name: 'Kenyatta University',
    school: 'Graduate School • Business & Humanities',
    standard: 'KU Thesis Format 2024/2025 • Turnitin < 15% Strict',
    badge: 'KU Format Ready',
    tagColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    shortName: 'USIU-Africa',
    name: 'United States International University',
    school: 'Chandaria School of Business • SPHS',
    standard: 'USIU Institutional Repository & APA 7th / Turabian',
    badge: 'USIU Standard',
    tagColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    shortName: 'JKUAT & Daystar',
    name: 'JKUAT & Daystar University',
    school: 'College of Pure & Applied Sciences • Humanities',
    standard: 'STEM Research, IEEE / Vancouver & Social Sciences Style',
    badge: 'Pan-African Standards',
    tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
];

const INTERNATIONAL_STANDARDS = [
  {
    country: 'United Kingdom (UK)',
    flag: '🇬🇧',
    institutions: 'Russell Group • Oxford • Cambridge • Open University',
    manuals: 'Harvard UK • OSCOLA (Law) • MHRA • British English (en-GB)',
    description: 'Conforms to UK QAA Framework & strict Turnitin UK plagiarism detection.',
  },
  {
    country: 'United States (US & Canada)',
    flag: '🇺🇸',
    institutions: 'Ivy League • State Universities • Walden • Capella • WGU',
    manuals: 'APA 7th Edition • MLA 9th • Chicago / Turabian • AMA',
    description: 'ProQuest dissertation formatting, IRB human ethics compliance, APA statistical reporting.',
  },
  {
    country: 'Australia & New Zealand',
    flag: '🇦🇺',
    institutions: 'Group of Eight (Go8) • Melbourne • Sydney • UNSW • Monash',
    manuals: 'AGLC 4 (Australian Guide to Legal Citation) • Harvard AGPS',
    description: 'Direct alignment with Australian Higher Education Standards Framework (HESF).',
  },
];

const GUARANTEE_CARDS = [
  {
    icon: FileCheck2,
    title: '< 10% Turnitin Similarity',
    desc: 'Every paper includes an authentic Turnitin similarity and AI-origin inspection certificate.',
    highlight: 'Zero Plagiarism',
  },
  {
    icon: ShieldCheck,
    title: '0% AI & Human-Verified',
    desc: 'Researched by subject-matter postgraduates. Verified against GPTZero, CopyLeaks, and Turnitin AI.',
    highlight: 'Authentic Research',
  },
  {
    icon: Lock,
    title: '100% Academic Confidentiality',
    desc: 'Under strict bilateral NDA. We never resell, publish, or index your work in public repositories.',
    highlight: 'Complete Discretion',
  },
  {
    icon: Award,
    title: 'Unlimited Rubric Revisions',
    desc: 'Free iterative revisions until your supervisor, committee, or defense panel approves.',
    highlight: 'Defense Guarantee',
  },
];

export function UniversityCurriculumBadges({
  title = 'Certified Compliance with Kenyan & Global University Standards',
  subtitle = 'TaskLynk specialists are alumni and researchers from leading institutions who format and audit every submission against strict institutional manuals.',
  showGuarantees = true,
  compact = false,
}: UniversityCurriculumBadgesProps) {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-[#FAF8FD] to-white dark:from-[#140E24] dark:via-[#18112C] dark:to-[#140E24] border-y border-[#DDD3E9] dark:border-[#3A2F5B]">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-3.5 py-1 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">
              Institutional Quality Seal
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#22183D] dark:text-white tracking-tight leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#6F687A] dark:text-gray-300 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Kenyan Universities Grid */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-[#5B3594] dark:text-[#FF7A3D]" />
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#22183D] dark:text-white">
              Kenyan University Manuals &amp; Defence Formats
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KENYAN_INSTITUTIONS.map((item) => (
              <div
                key={item.shortName}
                className="bg-white dark:bg-[#1E1636] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-extrabold text-[#22183D] dark:text-white text-base">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#6F687A] dark:text-gray-400 font-medium">
                      {item.school}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-[#22183D] dark:text-gray-300 font-medium leading-snug">
                    {item.standard}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* International Standards */}
        {!compact && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-5 h-5 text-[#FF7A3D]" />
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#22183D] dark:text-white">
                Global Curriculum &amp; Citation Guidelines
              </h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {INTERNATIONAL_STANDARDS.map((intl) => (
                <div
                  key={intl.country}
                  className="bg-white dark:bg-[#1E1636] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{intl.flag}</span>
                    <h4 className="font-extrabold text-sm text-[#22183D] dark:text-white">
                      {intl.country}
                    </h4>
                  </div>
                  <p className="text-xs font-semibold text-[#5B3594] dark:text-[#FF7A3D] mb-1">
                    {intl.manuals}
                  </p>
                  <p className="text-xs text-[#6F687A] dark:text-gray-300 mb-2 leading-relaxed">
                    {intl.institutions}
                  </p>
                  <div className="pt-2 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 text-[11px] text-[#6F687A] dark:text-gray-400">
                    {intl.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guarantees Grid */}
        {showGuarantees && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {GUARANTEE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-[#FAF8FD] dark:bg-[#1A1230] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl p-4 text-center flex flex-col items-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A3D] mb-1">
                      {card.highlight}
                    </span>
                    <h5 className="font-extrabold text-xs sm:text-sm text-[#22183D] dark:text-white mb-1">
                      {card.title}
                    </h5>
                    <p className="text-[11px] text-[#6F687A] dark:text-gray-400 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
