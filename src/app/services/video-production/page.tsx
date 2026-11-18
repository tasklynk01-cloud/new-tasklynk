import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Video,
  Film,
  Sparkles,
  Scissors,
  Layers,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Corporate Video Production & Video Editing Services | TaskLynk Kenya',
  'Professional corporate video editing, motion graphics, social media reels, promotional trailers, and YouTube content optimization managed by TaskLynk creative directors.',
  '/services/video-production'
);

const faqs = [
  {
    question: 'What video editing software and formats do you support?',
    answer:
      'We work in Adobe Premiere Pro, After Effects, and DaVinci Resolve, delivering in 4K UHD, 1080p Full HD, and vertical 9:16 aspect ratios optimized for TikTok, Instagram Reels, and YouTube Shorts.',
  },
  {
    question: 'Can you add subtitles, sound design, and color grading?',
    answer:
      'Yes. Every final cut includes professional dialogue cleanup, sound effects (SFX), licensed background scoring, precise subtitle captions (.srt / burned-in), and cinematic color grading.',
  },
  {
    question: 'How do I send large raw video footage files?',
    answer:
      'You can share footage via Google Drive, Dropbox, WeTransfer, or OneDrive. Once received, our video editor begins post-production according to your storyboard.',
  },
];

const relatedServices = [
  { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
  { label: 'Website & Web Development', href: '/services/website-development' },
  { label: 'Professional Writing & Scripts', href: '/services/professional-writing' },
];

const deliverables = [
  {
    title: 'Corporate & Brand Story Videos',
    description: 'Polished brand overviews, executive interviews, client testimonials, and product walkthroughs that build instant trust.',
    icon: Tv,
  },
  {
    title: 'High-Engagement Social Media Reels',
    description: 'Dynamic, fast-paced vertical video editing with hook captions, sound effects, and transitions tailored for TikTok and Instagram.',
    icon: Scissors,
  },
  {
    title: 'Motion Graphics & Logo Animations',
    description: 'Sleek animated 2D/3D logo stings, explanatory title cards, kinetic typography, and infographic visualizations.',
    icon: Sparkles,
  },
  {
    title: 'Post-Production, Color Grading & Audio Mix',
    description: 'Transform rough footage into cinematic footage with DaVinci Resolve color correction and balanced acoustic mastering.',
    icon: Film,
  },
];

export default async function VideoProductionPage() {
  const specialists = await getPublishedSpecialists({ category: 'design', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/video-production"
      serviceSchemaName="Video Production and Editing Services"
      serviceSchemaDescription="Corporate video editing, social media reels, and motion graphics delivered under TaskLynk managed creative oversight."
      heroEyebrow="Design & Creative"
      heroTitle="Video Production & Editing Services"
      heroIntro="Transform your raw video recordings into high-retention corporate stories and social media reels. TaskLynk assigns accredited video editors and motion designers under dedicated project oversight."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Video+Production"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Cinematic Storytelling
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              High-Retention Video Editing That Amplifies Your Message
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Video is the highest-converting digital medium. We handle pacing, sound design, graphics, and color grading so your audience stays glued.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className="linen-card rounded-2xl p-6 hover:border-[#FF7A3D] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTeamShowcase
        title="Accredited Video & Motion Specialists"
        subtitle="Vetted editors and motion graphics artists from TaskLynk."
        specialists={specialists}
        serviceCategory="Video Production"
      />
    </ServicePageShell>
  );
}
