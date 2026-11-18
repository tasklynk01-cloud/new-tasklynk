"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
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
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { TrainingBookingDialog } from '@/components/training/training-booking-dialog';

export default function CourseDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const { slug } = params;

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        const res = await fetch(`/api/training/courses/${slug}`);
        const data = await res.json();
        if (data.success) {
          setCourse(data.course);
        } else {
          setError(data.error || 'Course not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch course details');
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col font-sans">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[#FF7A3D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#6B627A] dark:text-[#DDD3E9]">Loading course curriculum and schedule...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col font-sans">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center pt-32 px-4 text-center">
          <div className="max-w-md p-8 bg-white dark:bg-[#1D1533] rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#22183D] dark:text-white">Course Not Found</h2>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2">{error || 'The requested training program does not exist or has been retired.'}</p>
            <Link href="/training">
              <Button className="mt-4 bg-[#FF7A3D] hover:bg-[#E9662F] text-white text-xs font-bold">
                Back to All Programs
              </Button>
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const activeCohort = course.cohorts?.[0];
  const availableSeats = activeCohort
    ? Math.max(0, activeCohort.capacity - activeCohort.enrolledCount)
    : 50;

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col relative font-sans selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      <MainHeader />

      {/* HEADER / BREADCRUMB HERO */}
      <section className="relative pt-32 pb-12 sm:pb-16 border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 overflow-hidden">
        {/* 3D SILK GRADIENT WAVE ENGINE - strictly contained to Hero */}
        <StripeGradientMesh
          mode="hero"
          heightClass="h-full"
          className="inset-0 opacity-80 dark:opacity-75 pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 mb-4">
            <Link href="/training" className="hover:text-[#FF7A3D] transition-colors font-medium">
              Training Academy
            </Link>
            <span>/</span>
            <span className="text-[#22183D] dark:text-slate-300 font-medium">{course.category?.name || 'Program'}</span>
            <span>/</span>
            <span className="text-[#FF7A3D] font-semibold truncate max-w-xs">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 border border-[#5B3594]/20 dark:border-[#FF7A3D]/20 text-[#5B3594] dark:text-[#FFA06E] text-xs font-bold uppercase tracking-wider mb-4">
                <span>{course.category?.name}</span>
                <span>•</span>
                <span>{course.level?.replace('_', ' ')}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#22183D] dark:text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                {course.description}
              </p>

              {/* Badges / Metrics */}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6B627A] dark:text-[#DDD3E9]">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7A3D]" />
                  <span>
                    {activeCohort
                      ? `${new Date(activeCohort.startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} – ${new Date(activeCohort.endDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : `${course.durationDays} Days`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
                  <span>Daily {course.dailyDurationHours} (6:00 PM – 8:30 PM EAT)</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
                  <Award className="w-3.5 h-3.5 text-[#5B3594] dark:text-purple-400" />
                  <span>Verifiable Certificate</span>
                </div>
              </div>
            </div>

            {/* QUICK BOOKING CARD */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xl backdrop-blur-xl lg:sticky lg:top-28">
              <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 uppercase tracking-wider font-semibold">Standard Tuition Fee</div>
              <div className="text-3xl font-black text-[#22183D] dark:text-white mt-1">
                {course.currency} {Number(course.standardPrice).toLocaleString()}
              </div>

              <div className="mt-4 pt-4 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B627A] dark:text-[#DDD3E9]/70">Intake Cohort:</span>
                  <span className="font-bold text-[#22183D] dark:text-white">{activeCohort?.name || 'Upcoming'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B627A] dark:text-[#DDD3E9]/70">Seats Available:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{availableSeats} of {activeCohort?.capacity || 50} remaining</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B627A] dark:text-[#DDD3E9]/70">Registration:</span>
                  <span className="text-[#FF7A3D] font-bold">Closes 48 hours prior</span>
                </div>
              </div>

              <Button
                onClick={() => setBookingDialogOpen(true)}
                className="w-full mt-6 h-12 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl text-base shadow-lg shadow-[#FF7A3D]/25 transition-transform hover:scale-[1.02]"
              >
                <span>Book &amp; Enrol Now</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="mt-3 text-[11px] text-center text-[#6B627A] dark:text-[#DDD3E9]/80 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant Safaricom M-Pesa verification</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED CONTENT SECTION */}
      <section className="py-12 sm:py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2-column content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Target Audience */}
            <div>
              <h3 className="text-xl font-bold text-[#22183D] dark:text-white mb-3">Target Audience</h3>
              <p className="text-sm text-[#4A4257] dark:text-[#DDD3E9] leading-relaxed bg-white dark:bg-[#1D1533] p-5 rounded-2xl border-2 border-[#DDD3E9] dark:border-[#3A2F5B] shadow-sm">
                {course.targetAudience}
              </p>
            </div>

            {/* Learning Outcomes */}
            <div>
              <h3 className="text-xl font-bold text-[#22183D] dark:text-white mb-4">What You Will Achieve</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.learningOutcomes?.map((outcome: string, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-white dark:bg-[#1D1533] border-2 border-[#DDD3E9] dark:border-[#3A2F5B] flex items-start gap-2.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[#22183D] dark:text-slate-100 leading-normal font-semibold">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-by-Day Comprehensive Curriculum */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#22183D] dark:text-white">Full Program Curriculum</h3>
                <span className="text-xs font-mono text-[#5B3594] dark:text-[#FFA06E] font-bold">
                  {course.modules?.length || 0} Modules • {course.sessions?.length || 0} Live Sessions
                </span>
              </div>

              <div className="space-y-3">
                {course.modules?.map((mod: any, idx: number) => {
                  const isExpanded = expandedDay === mod.dayNumber || (expandedDay === null && idx === 0);
                  return (
                    <div
                      key={mod.id}
                      className="rounded-2xl border-2 border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1D1533] overflow-hidden shadow-sm transition-all"
                    >
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : mod.dayNumber)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#F8F5FC] dark:hover:bg-[#160F29] transition-colors"
                      >
                        <div>
                          <span className="text-[11px] font-bold text-[#FF7A3D] uppercase tracking-wider block">
                            Day {mod.dayNumber}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-[#22183D] dark:text-white mt-0.5">
                            {mod.title.replace(/^Day \d+:\s*/, '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 hidden sm:inline font-medium">
                            {mod.lessons?.length || 0} lessons
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#6B627A] dark:text-[#DDD3E9]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#6B627A] dark:text-[#DDD3E9]" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 pt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 space-y-2.5">
                          {mod.description && (
                            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 pb-2 leading-relaxed">{mod.description}</p>
                          )}
                          <div className="space-y-1.5">
                            {mod.lessons?.map((les: any) => (
                              <div
                                key={les.id}
                                className="p-3 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 flex items-center justify-between text-xs shadow-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  {les.lessonType === 'video' ? (
                                    <Video className="w-3.5 h-3.5 text-[#FF7A3D]" />
                                  ) : les.lessonType === 'assessment' ? (
                                    <Sparkles className="w-3.5 h-3.5 text-[#5B3594] dark:text-purple-400" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                  )}
                                  <span className="text-[#22183D] dark:text-slate-200 font-semibold">{les.title}</span>
                                </div>
                                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-mono text-[11px]">
                                  {les.durationMinutes} mins
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Live Sessions Timeline */}
            <div>
              <h3 className="text-xl font-bold text-[#22183D] dark:text-white mb-4">Live Evening Workshop Schedule</h3>
              <div className="space-y-3">
                {course.sessions?.map((sess: any) => (
                  <div
                    key={sess.id}
                    className="p-5 rounded-2xl bg-white/90 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-[#22183D] dark:text-white text-sm">{sess.title}</div>
                      <div className="text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#FF7A3D]" />
                          {new Date(sess.sessionDate).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#FF7A3D]" />
                          {sess.startTime} – {sess.endTime} EAT
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                      Live Interactive + HD Recording
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trainer Profile Column */}
          <div className="space-y-6">
            {course.trainer && (
              <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#FF7A3D] font-bold block mb-3">
                  Lead Instructor
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#5B3594]/15 dark:bg-[#FF7A3D]/20 text-[#5B3594] dark:text-[#FFA06E] font-black text-lg flex items-center justify-center">
                    {course.trainer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#22183D] dark:text-white text-base leading-tight">{course.trainer.name}</h4>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">{course.trainer.title}</p>
                  </div>
                </div>
                <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed mt-2">{course.trainer.bio}</p>

                {course.trainer.expertise && course.trainer.expertise.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
                    <span className="text-[11px] font-bold text-[#6B627A] dark:text-[#DDD3E9]/80 block mb-2">Areas of Expertise:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {course.trainer.expertise.map((exp: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EEFA] dark:bg-[#160F29] text-[#5B3594] dark:text-[#DDD3E9] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prerequisites */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-sm">
              <h4 className="font-bold text-[#22183D] dark:text-white text-sm mb-2">Program Prerequisites</h4>
              <ul className="space-y-1.5 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90">
                {course.prerequisites?.map((req: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#FF7A3D] font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Corporate Desk */}
            <div className="p-6 rounded-2xl bg-[#5B3594]/5 dark:bg-[#5B3594]/15 border border-[#5B3594]/20 text-center">
              <h4 className="font-bold text-[#22183D] dark:text-white text-sm">Need Invoicing or Corporate Invoice?</h4>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1">We issue corporate invoices and receipts for institutions and employers.</p>
              <a
                href="https://wa.me/254701066845?text=Hello%2C%20I%20need%20a%20corporate%20invoice%20for%20TaskLynk%20Academy."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contact Corporate Desk
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter />

      {/* BOOKING DIALOG */}
      <TrainingBookingDialog
        isOpen={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        course={course}
      />
    </div>
  );
}
