import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Film, Edit3, Clock, BarChart3, Smartphone, ShieldCheck, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Video Editing Services | Marketing Videos & More',
  'Professional video editing services for marketing videos, social media reels, corporate presentations, event highlights, training videos, and YouTube content. Hire vetted video editors.',
  '/services/marketing/video-editing'
);

const faqs = [
  {
    question: 'What types of videos do you edit?',
    answer: 'We edit marketing videos, social media reels and shorts, YouTube videos, corporate presentations, event highlights, training videos, product demos, interview compilations, promotional videos, explainer videos, testimonial videos, and wedding/event videos. We also handle documentary editing, educational content, and conference talk editing.',
  },
  {
    question: 'Which video editing software do you use?',
    answer: 'Our editors are proficient in Adobe Premiere Pro, Final Cut Pro, DaVinci Resolve, Adobe After Effects, Adobe Photoshop, Adobe Audition, and other professional editing tools. We also use specialized tools for color grading, audio mixing, motion graphics, and animation.',
  },
  {
    question: 'Do you handle color grading and audio mixing?',
    answer: 'Yes. Our editors provide professional color grading to enhance visual aesthetics and maintain consistent color across clips. We also handle audio mixing and mastering—including dialogue cleanup, background music balancing, sound effects, and noise reduction—to ensure professional audio quality.',
  },
  {
    question: 'Can you create motion graphics and animations?',
    answer: 'Yes. We create animated lower thirds, title sequences, infographic animations, kinetic typography, logo animations, and motion graphics using Adobe After Effects, Cinema 4D, and Blender. For complex animations, we collaborate with specialized motion designers.',
  },
  {
    question: 'What file formats do you deliver?',
    answer: 'We deliver in multiple formats: MP4 (H.264, H.265) for web and social media, MOV for professional use, AVI for high-quality versions, and platform-specific formats for YouTube, Instagram, TikTok, Facebook, and LinkedIn. We also provide optimized versions for different platforms and resolutions including 4K if needed.',
  },
  {
    question: 'How quickly can you edit my video?',
    answer: 'Simple social media videos (1-3 minutes) are typically delivered within 24-48 hours. Longer content like YouTube videos or corporate presentations take 2-5 business days. Complex projects with motion graphics may take 5-10 business days. We also offer express 12-hour service for urgent needs, subject to editor availability.',
  },
];

const relatedServices = [
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Content Writing', href: '/services/marketing/content-writing' },
  { label: 'Social Media Management', href: '/services/marketing/social-media-management' },
  { label: 'Digital Advertising', href: '/services/marketing/digital-advertising' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Editors', href: '/register/client' },
];

export default function VideoEditingPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/video-editing"
      serviceSchemaName="Professional Video Editing Services"
      serviceSchemaDescription="Professional video editing services for marketing videos, social media reels, corporate presentations, event highlights, training videos, and YouTube content. Hire vetted video editors."
      heroEyebrow="Video Editing"
      heroTitle="Professional Video Editing Services | Marketing Videos &amp; More"
      heroIntro="Video is the most powerful medium for storytelling in today's digital landscape. But raw footage without professional editing is just unprocessed potential. A poorly edited video—with shaky transitions, inconsistent audio, lackluster pacing, or no clear narrative—can damage your brand more than having no video at all. TaskLynk connects you with vetted video editors—experts in Adobe Premiere Pro, Final Cut Pro, DaVinci Resolve, and After Effects—who transform your raw footage into compelling, professionally polished videos that engage audiences and drive results. With secure milestone payments, NDA protection, and dedicated project management, your video content is in expert hands."
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
                This service is for businesses and creators who need professional video editing. <strong>Content creators and influencers</strong> who need regular social media content—Instagram Reels, YouTube Shorts, TikTok videos, and Stories—that is engaging, fast-paced, and optimized for platform algorithms. <strong>Businesses and brands</strong> that need marketing videos, product demos, corporate presentations, event highlights, and customer testimonials for websites, social media, and advertising. <strong>YouTube creators</strong> who need video editing for long-form content, shorts, and channel branding, including thumbnail design, intro/outro sequences, and audience retention optimization. <strong>Event organizers</strong> who need highlight reels, ceremony coverage, and promotional videos for conferences, weddings, concerts, and corporate events. <strong>Educators and trainers</strong> who need course content editing, lecture capture, training video production, and educational content formatting. <strong>Non-profit organizations</strong> that need advocacy videos, documentary-style content, awareness campaigns, and donor storytelling videos. <strong>Real estate agents</strong> who need property tour videos, virtual tours, and listing promotion videos. <strong>Students and researchers</strong> who need thesis presentation videos, conference talk editing, and academic presentation support.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you have raw video footage that needs professional editing—whether marketing content, social media videos, or corporate presentations—our service provides vetted video editors. We also support complementary services including <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>, <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link>, and <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web development</Link> for video hosting integration.
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
                What We Offer: Professional Video Production and Editing
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our video editing service covers the complete video production workflow, from initial footage review through editing, color grading, audio post-production, effects, and final delivery. We begin with a <strong>footage review and project briefing</strong> to understand your vision, target audience, platform requirements, desired tone, and key messages. Our editors review all raw footage, identify the best takes, plan the narrative structure, and develop a shot list that tells your story effectively. We also discuss pacing preferences, music choices, text overlay requirements, and any specific branding elements that need to be incorporated.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                During the <strong>editing phase</strong>, our specialists apply professional editing techniques including multi-camera editing, J-cuts and L-cuts, jump cut smoothing, pacing optimization, and narrative flow construction. For <strong>color grading and correction</strong>, we use professional tools (DaVinci Resolve, Adobe SpeedGrade, Final Cut Pro color wheels) to ensure consistent color across all clips, enhance visual mood, and apply cinematic looks when appropriate. For <strong>audio post-production</strong>, we clean up dialogue, reduce background noise, balance music and sound effects, apply equalization and compression, and ensure audio levels meet broadcast standards. We also create <strong>animated graphics and motion design</strong> including lower thirds, title sequences, infographic animations, kinetic typography, and logo reveals using Adobe After Effects, Cinema 4D, or Blender.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Edit3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Professional Editing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-camera editing, pacing optimization, narrative flow construction, and platform-specific formatting for maximum engagement.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Color Grading</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional color correction and grading using DaVinci Resolve and Adobe tools for cinematic looks and visual consistency.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Audio Post-Production</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dialogue cleanup, noise reduction, music balancing, sound effects, and professional audio mastering for broadcast quality.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Motion Graphics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Animated lower thirds, title sequences, kinetic typography, infographic animation, and logo reveals with professional polish.
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
                Social Media and Platform Optimization
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Different social media platforms have distinct formats, aspect ratios, duration limits, and algorithmic preferences. Our editors create platform-optimized videos that maximize engagement and reach. For <strong>Instagram Reels</strong>, we create fast-paced, visually dynamic content at 9:16 aspect ratio, optimized for the first 3 seconds to hook viewers. For <strong>YouTube Shorts</strong>, we produce vertical or square videos under 60 seconds with trending audio and captions. For <strong>TikTok</strong>, we craft engaging, trend-aware content with popular audio, quick cuts, and hook-first editing styles. For <strong>Facebook posts</strong>, we create square or horizontal videos with clear messaging in the first few seconds. For <strong>LinkedIn content</strong>, we produce professional, value-driven videos with thoughtful pacing and business-appropriate styling.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                We also handle <strong>platform-specific requirements</strong> including captions and subtitles (burned-in or as separate files), thumbnail design and optimization, end screens and CTAs, and platform-compliant file specifications. For <strong>long-form YouTube content</strong>, our editors optimize for audience retention with strategic pacing, chapter markers, and call-to-action placement. For <strong>corporate presentations</strong>, we create polished, professional videos with consistent branding, clear messaging, and broadcast-quality audio. For businesses needing <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link> for thumbnails or <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link> for talking-head videos, we coordinate with our design partners. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures professional quality. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your video project</Link> today.
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
                Why TaskLynk for Video Editing
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Video editing requires a unique blend of technical skill, creative storytelling, and platform awareness. An editor who excels at long-form YouTube content may struggle with the fast-paced requirements of TikTok, and a colorist who works in film may not understand social media's vertical format demands. TaskLynk's marketplace connects you with video editors who specialize in your specific content type and platform. Every video editor in our network has a verified portfolio demonstrating proficiency in professional editing software, color grading, audio post-production, and motion graphics—and has delivered content for real audiences across real platforms.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond creative expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve edits before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the editor, manage revision rounds, and ensure deliverables meet your specifications. <strong>NDA protection</strong> safeguards your content, brand messaging, and business strategies. For comprehensive marketing support, we also offer <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>, <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, and <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">digital advertising</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures video quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your video project</Link> today. For video editors, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
