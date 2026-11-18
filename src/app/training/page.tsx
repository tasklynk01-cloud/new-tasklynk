"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Video,
  Award,
  Search,
  Filter,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { TrainingBookingDialog } from '@/components/training/training-booking-dialog';

export default function TrainingAcademyPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking dialog state
  const [selectedCourseForBooking, setSelectedCourseForBooking] = useState<any | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/training/courses');
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load training courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesCat = selectedCategory === 'all' || c.category?.slug === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenBooking = (course: any) => {
    setSelectedCourseForBooking(course);
    setBookingDialogOpen(true);
  };

  return (
    <div className="min-h-screen isolate bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col relative font-sans selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      <MainHeader />

      {/* HERO SECTION */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
        {/* 3D SILK GRADIENT WAVE ENGINE - strictly contained to Hero */}
        <StripeGradientMesh
          mode="hero"
          heightClass="h-full"
          className="inset-0 opacity-80 dark:opacity-75 pointer-events-none"
        />

        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-[#EFE8F8]/70 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[460px] h-[460px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1D1533]/80 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-sm mb-6 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#FF7A3D] ring-4 ring-[#FF7A3D]/20 shrink-0 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#5B3594] dark:text-[#FFA06E]">
              TaskLynk Training Academy • November–December 2026 Intakes Open
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.12]">
            Empirical Mastery for High-Impact Careers.<br />
            <span className="text-[#FF7A3D]">TaskLynk Training Academy.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 max-w-2xl mx-auto leading-relaxed">
            Intensive cohort-based professional programs led by senior specialists. Master academic research, data analysis, modern software engineering, digital marketing, and professional AI with interactive live evening workshops and verified credentials.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-[#1D1533]/60 border border-[#DDD3E9] dark:border-[#3A2F5B]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Safaricom M-Pesa Verified</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-[#1D1533]/60 border border-[#DDD3E9] dark:border-[#3A2F5B]">
              <Video className="w-4 h-4 text-[#FF7A3D]" />
              <span>Live Evening Workshops + HD Recordings</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-[#1D1533]/60 border border-[#DDD3E9] dark:border-[#3A2F5B]">
              <Award className="w-4 h-4 text-[#5B3594] dark:text-purple-400" />
              <span>Verifiable QR-Coded Certificates</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="py-6 bg-white/80 dark:bg-[#1D1533]/80 border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 sticky top-[68px] sm:top-[74px] z-30 backdrop-blur-xl shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                    : 'bg-white/90 dark:bg-[#160F29] text-[#6B627A] dark:text-[#DDD3E9] border border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#FF7A3D]/40'
                }`}
              >
                All Programs ({courses.length || 5})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                      : 'bg-white/90 dark:bg-[#160F29] text-[#6B627A] dark:text-[#DDD3E9] border border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#FF7A3D]/40'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/60" />
              <input
                type="text"
                placeholder="Search programs, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl text-xs sm:text-sm text-[#22183D] dark:text-white placeholder-[#6B627A]/70 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D] shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* COURSES CATALOG */}
      <section className="py-12 sm:py-16 bg-[#FAF8FD] dark:bg-[#140E24] border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 flex-1 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#22183D] dark:text-white">
                November – December 2026 Training Tracks
              </h2>
              <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">
                Select an upcoming intake to review full syllabus details or reserve your seat.
              </p>
            </div>
            <span className="hidden sm:inline-flex text-xs font-mono text-[#5B3594] dark:text-[#FFA06E] bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 px-3.5 py-1.5 rounded-full border border-[#5B3594]/20 dark:border-[#FF7A3D]/20 font-bold">
              {filteredCourses.length} Programs Available
            </span>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-3 border-[#FF7A3D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-[#6B627A] dark:text-[#DDD3E9]">Loading training curricula &amp; calendar...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-[#1D1533] rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] p-8 shadow-sm">
              <p className="text-base font-semibold text-[#22183D] dark:text-white">No training programs match your search.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 border-[#DDD3E9] dark:border-[#3A2F5B] text-xs font-bold"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {filteredCourses.map((course) => {
              const activeCohort = course.cohorts?.[0];
              const availableSeats = activeCohort
                ? Math.max(0, activeCohort.capacity - activeCohort.enrolledCount)
                : 50;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-[#1D1533] rounded-2xl border-2 border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#FF7A3D] dark:hover:border-[#FF7A3D] transition-all duration-300 flex flex-col overflow-hidden group shadow-md hover:shadow-xl relative z-10"
                >
                  {/* Card Header & Badge */}
                  <div className="p-6 pb-5 bg-white dark:bg-[#1D1533] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-[#5B3594] dark:text-[#FFA06E] uppercase tracking-wider bg-[#F4EDFC] dark:bg-[#FF7A3D]/15 px-3 py-1 rounded-full border border-[#5B3594]/30 dark:border-[#FF7A3D]/30">
                        {course.category?.name || 'Academy'}
                      </span>
                      <span className="text-xs text-[#4A4257] dark:text-[#DDD3E9] flex items-center gap-1 font-mono font-semibold">
                        <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
                        {course.durationDays} Days ({course.dailyDurationHours})
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white group-hover:text-[#FF7A3D] transition-colors leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#4A4257] dark:text-[#DDD3E9] mt-2.5 line-clamp-3 leading-relaxed font-normal">
                      {course.shortDescription || course.description}
                    </p>
                  </div>

                  {/* Dates & Schedule */}
                  <div className="p-6 py-4 bg-[#F8F5FC] dark:bg-[#170F2B] text-xs space-y-3 border-b border-[#DDD3E9] dark:border-[#3A2F5B] flex-1">
                    {activeCohort && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#4A4257] dark:text-[#DDD3E9] flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#FF7A3D]" />
                          Intake Dates:
                        </span>
                        <span className="font-bold text-[#22183D] dark:text-white">
                          {new Date(activeCohort.startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} –{' '}
                          {new Date(activeCohort.endDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[#4A4257] dark:text-[#DDD3E9] flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
                        Daily Live Time:
                      </span>
                      <span className="font-bold text-[#22183D] dark:text-white">6:00 PM – 8:30 PM EAT</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#4A4257] dark:text-[#DDD3E9] flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Registration:
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {availableSeats} seats left (Closes 48h prior)
                      </span>
                    </div>

                    {/* Learning Outcomes Sneak Peek */}
                    <div className="pt-2.5 border-t border-[#DDD3E9] dark:border-[#3A2F5B]">
                      <span className="text-[10px] font-bold text-[#4A4257] dark:text-[#DDD3E9] uppercase tracking-wider">Key Outcomes:</span>
                      <ul className="mt-1.5 space-y-1.5 text-xs text-[#22183D] dark:text-[#FAF8FD] font-medium">
                        {course.learningOutcomes?.slice(0, 2).map((outcome: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="p-6 py-4 flex items-center justify-between gap-3 bg-white dark:bg-[#1D1533]">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#6B627A] dark:text-[#DDD3E9]/80 block font-bold">Fee</span>
                      <div className="text-2xl font-black text-[#22183D] dark:text-white tracking-tight">
                        {course.currency} {Number(course.standardPrice).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/training/${course.slug}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 text-xs border-2 border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-white hover:bg-[#F4EDFC] dark:hover:bg-[#271E42] font-bold transition-colors"
                        >
                          Curriculum
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        onClick={() => handleOpenBooking(course)}
                        className="h-10 px-4 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold text-xs shadow-md shadow-[#FF7A3D]/25 transition-transform hover:scale-[1.02]"
                      >
                        <span>Book Seat</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>

      {/* WHY TASKLYNK TRAINING ACADEMY */}
      <section className="py-16 bg-[#F3EEFA]/70 dark:bg-[#160F29]/80 border-t border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#22183D] dark:text-white">Engineered for Concrete Professional Competence</h2>
            <p className="mt-2 text-sm text-[#6B627A] dark:text-[#DDD3E9]/90">Everything you need to master high-value skills in one unified platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FF7A3D]/10 text-[#FF7A3D] flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[#22183D] dark:text-white text-base">Live Interactive Workshops</h4>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2 leading-relaxed">
                Evening 2–3 hour hands-on sessions led by vetted specialists. Ask live questions, conduct real exercises, and review full recorded video playback at your own pace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#5B3594]/10 text-[#5B3594] dark:text-[#FFA06E] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[#22183D] dark:text-white text-base">Persistent Progress Tracking</h4>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2 leading-relaxed">
                Never lose your place. Watch times, video playback positions, quiz scores, and module milestones are persistently saved on Supabase and resume across all devices.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[#22183D] dark:text-white text-base">Verified Digital Certificates</h4>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2 leading-relaxed">
                Earn an official TaskLynk Academy credential complete with a unique verifiable serial number and QR code for LinkedIn, institutional submissions, and employers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-[#22183D] dark:text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
            <h4 className="font-bold text-sm text-[#22183D] dark:text-white">How does registration and M-Pesa payment work?</h4>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
              Select your course and intake, enter your M-Pesa phone number, and complete payment on your handset. Once verified, your learner access is activated.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
            <h4 className="font-bold text-sm text-[#22183D] dark:text-white">When does registration close?</h4>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
              Registration closes exactly 48 hours prior to each program&apos;s start date to allow instructors to finalize cohorts, distribute preliminary materials, and calibrate live session tools.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
            <h4 className="font-bold text-sm text-[#22183D] dark:text-white">What if I miss a live evening session?</h4>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
              Every live session is recorded and uploaded to your Learner Dashboard alongside lesson notes, slides, and code/data repositories. You retain ongoing access to review at any time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
            <h4 className="font-bold text-sm text-[#22183D] dark:text-white">Is the AI for Professional Productivity program only for programmers?</h4>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
              No! It is a cross-cutting professional skills program tailored for educators, researchers, business owners, administrators, lawyers, accountants, and freelancers. No coding experience is required.
            </p>
          </div>
        </div>

        {/* WhatsApp Help CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#5B3594]/10 via-[#FF7A3D]/10 to-transparent border border-[#DDD3E9] dark:border-[#3A2F5B] text-center">
          <h3 className="font-bold text-[#22183D] dark:text-white text-base">Have Questions About Training or Corporate Group Bookings?</h3>
          <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9] mt-1">Our academic and training coordinators are available on WhatsApp and email.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="https://wa.me/254701066845?text=Hello%20TaskLynk%20Academy%20Team%2C%20I%20have%20an%20inquiry%20regarding%20training%20programs."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp (+254 701 066 845)
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter />

      {/* BOOKING MODAL */}
      {selectedCourseForBooking && (
        <TrainingBookingDialog
          isOpen={bookingDialogOpen}
          onClose={() => setBookingDialogOpen(false)}
          course={selectedCourseForBooking}
        />
      )}
    </div>
  );
}
