"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Play,
  CheckCircle,
  Clock,
  Award,
  Video,
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Download,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { UnifiedVideoPlayer } from '@/components/training/unified-video-player';

export default function LearnerLMSPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const { slug } = params;

  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsEnrolment, setNeedsEnrolment] = useState(false);

  // Active viewing state
  const [activeTab, setActiveTab] = useState<'learn' | 'sessions' | 'assessments' | 'certificate'>('learn');
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  // Quiz submission state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<any | null>(null);

  useEffect(() => {
    async function loadPortal() {
      try {
        setLoading(true);
        const res = await fetch(`/api/training/learn/${slug}`);
        const data = await res.json();
        if (data.success) {
          setPortalData(data);
          // Auto-select first unlocked lesson
          const firstUnlocked = data.modules
            ?.flatMap((m: any) => m.lessons)
            ?.find((l: any) => !l.isLocked);
          if (firstUnlocked) {
            setActiveLessonId(firstUnlocked.id);
          }
        } else {
          setError(data.error || 'Failed to load course portal');
          if (data.needsEnrolment) {
            setNeedsEnrolment(true);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error loading course portal');
      } finally {
        setLoading(false);
      }
    }
    loadPortal();
  }, [slug]);

  // Handle quiz question option select
  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Submit quiz
  const handleSubmitAssessment = async (assessmentId: number) => {
    setSubmittingQuiz(true);
    setQuizFeedback(null);
    try {
      const res = await fetch(`/api/training/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: quizAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizFeedback(data);
        // Refresh portal progress
        const refreshRes = await fetch(`/api/training/learn/${slug}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setPortalData(refreshData);
        }
      } else {
        alert(data.error || 'Failed to submit quiz.');
      }
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col font-sans">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[#FF7A3D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#6B627A] dark:text-[#DDD3E9]">Loading your learning dashboard and progress...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (needsEnrolment || error || !portalData) {
    return (
      <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col font-sans">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center pt-32 px-4">
          <div className="max-w-md w-full p-8 bg-white dark:bg-[#1D1533] rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] text-center shadow-xl">
            <Lock className="w-12 h-12 text-[#FF7A3D] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#22183D] dark:text-white">Course Enrolment Required</h2>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mt-2 leading-relaxed">
              {error || 'This learning content is protected. Please sign in with your enrolled TaskLynk account or book your seat to unlock access.'}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link href={`/training/${slug}`}>
                <Button className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold text-sm h-11 shadow-md shadow-[#FF7A3D]/20">
                  View Course &amp; Book Seat
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full border-[#DDD3E9] dark:border-[#3A2F5B] text-xs font-semibold text-[#5B3594] dark:text-[#DDD3E9] h-10">
                  Sign In to Existing Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { course, modules, sessions, assessments, progress, certificate } = portalData;

  const allLessons = modules.flatMap((m: any) => m.lessons);
  const activeLesson = allLessons.find((l: any) => l.id === activeLessonId) || allLessons[0];
  const activeVideo = activeLesson?.videos?.[0];

  const activeIndex = allLessons.findIndex((l: any) => l.id === activeLesson?.id);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col font-sans selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      <MainHeader />

      {/* DASHBOARD TOP BAR */}
      <section className="pt-28 pb-4 bg-white/95 dark:bg-[#1D1533]/95 border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 mb-1">
                <Link href="/training" className="hover:text-[#FF7A3D] font-medium">Academy</Link>
                <span>/</span>
                <span className="text-[#22183D] dark:text-slate-200 font-medium">{course.title}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#22183D] dark:text-white">{course.title}</h1>
            </div>

            {/* Learner Progress Bar */}
            <div className="w-full md:w-80 p-3.5 rounded-2xl bg-[#F8F5FC] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80 font-bold">Overall Progress</span>
                <span className="font-mono font-black text-[#FF7A3D]">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#DDD3E9]/60 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progress.percentage >= (course.minCompletionPercentage || 80)
                      ? 'bg-emerald-500'
                      : 'bg-[#FF7A3D]'
                  }`}
                  style={{ width: `${Math.min(100, progress.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#6B627A] dark:text-[#DDD3E9]/70 mt-1 font-medium">
                <span>{progress.completedLessonsCount} of {progress.totalLessonsCount} lessons</span>
                <span>{progress.percentage >= (course.minCompletionPercentage || 80) ? '🎓 Certificate Ready' : `${course.minCompletionPercentage || 80}% needed`}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('learn')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'learn'
                  ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                  : 'text-[#6B627A] dark:text-[#DDD3E9] hover:bg-[#EEE7FA] dark:hover:bg-[#160F29]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Course Lessons</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sessions'
                  ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                  : 'text-[#6B627A] dark:text-[#DDD3E9] hover:bg-[#EEE7FA] dark:hover:bg-[#160F29]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Live Workshops ({sessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'assessments'
                  ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                  : 'text-[#6B627A] dark:text-[#DDD3E9] hover:bg-[#EEE7FA] dark:hover:bg-[#160F29]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessments &amp; Quizzes</span>
            </button>

            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'certificate'
                  ? 'bg-[#5B3594] text-white shadow-md shadow-[#5B3594]/25'
                  : 'text-[#6B627A] dark:text-[#DDD3E9] hover:bg-[#EEE7FA] dark:hover:bg-[#160F29]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificate</span>
              {certificate && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </button>
          </div>
        </div>
      </section>

      {/* MAIN VIEWPORT */}
      <section className="flex-1 py-8 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* TAB 1: CURRICULUM & VIDEO LEARNER */}
        {activeTab === 'learn' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Video Player & Lesson Notes */}
            <div className="lg:col-span-2 space-y-6">
              {activeLesson ? (
                <div>
                  {activeLesson.isLocked ? (
                    <div className="aspect-video w-full rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] flex flex-col items-center justify-center p-6 text-center shadow-sm">
                      <Lock className="w-12 h-12 text-[#6B627A] dark:text-slate-500 mb-3" />
                      <h3 className="text-lg font-bold text-[#22183D] dark:text-white">Lesson Locked</h3>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 max-w-sm mt-1">{activeLesson.lockReason}</p>
                    </div>
                  ) : activeVideo ? (
                    <UnifiedVideoPlayer
                      courseId={course.id}
                      lessonId={activeLesson.id}
                      videoId={activeVideo.id}
                      title={activeLesson.title}
                      provider={activeVideo.provider}
                      videoUrl={activeVideo.videoUrl}
                      externalVideoId={activeVideo.externalVideoId}
                      initialPositionSeconds={activeVideo.lastPositionSeconds || 0}
                      durationSeconds={activeVideo.durationSeconds}
                      minCompletionPercentage={course.minCompletionPercentage || 80}
                      onProgressUpdate={(d) => {
                        if (d.isCompleted) {
                          setPortalData((prev: any) => ({
                            ...prev,
                            progress: {
                              ...prev.progress,
                              percentage: Math.max(prev.progress.percentage, d.percentageWatched),
                            },
                          }));
                        }
                      }}
                      onNextLesson={() => nextLesson && setActiveLessonId(nextLesson.id)}
                      onPrevLesson={() => prevLesson && setActiveLessonId(prevLesson.id)}
                      hasNext={Boolean(nextLesson && !nextLesson.isLocked)}
                      hasPrev={Boolean(prevLesson && !prevLesson.isLocked)}
                    />
                  ) : (
                    <div className="aspect-video w-full rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] flex flex-col items-center justify-center p-6 text-center shadow-sm">
                      <FileText className="w-12 h-12 text-[#FF7A3D] mb-3" />
                      <h3 className="text-lg font-bold text-[#22183D] dark:text-white">{activeLesson.title}</h3>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 max-w-sm mt-1">Reading &amp; Practical Assignment Lesson</p>
                    </div>
                  )}

                  {/* Lesson Meta & Content */}
                  <div className="mt-6 p-6 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-[#22183D] dark:text-white">{activeLesson.title}</h2>
                      <span className="text-xs font-mono font-bold text-[#FF7A3D]">
                        {activeLesson.durationMinutes} mins
                      </span>
                    </div>

                    {activeLesson.content ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed whitespace-pre-wrap">
                        {activeLesson.content}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 italic">No additional notes for this lesson.</p>
                    )}

                    {/* Resources */}
                    {activeLesson.materials && activeLesson.materials.length > 0 && (
                      <div className="pt-4 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
                        <span className="text-xs font-bold text-[#22183D] dark:text-slate-200 uppercase block mb-2">Lesson Downloads</span>
                        <div className="space-y-2">
                          {activeLesson.materials.map((m: any) => (
                            <a
                              key={m.id}
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 rounded-xl bg-[#FAF8FD] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] flex items-center justify-between text-xs text-[#22183D] dark:text-slate-200 hover:border-[#FF7A3D]"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#FF7A3D]" />
                                <span className="font-semibold">{m.title}</span>
                              </div>
                              <Download className="w-3.5 h-3.5 text-[#6B627A] dark:text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Modules & Lessons Playlist */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-sm">
                <h3 className="text-xs font-bold text-[#22183D] dark:text-white uppercase tracking-wider mb-4">Course Curriculum</h3>
                <div className="space-y-4">
                  {modules.map((mod: any) => (
                    <div key={mod.id} className="space-y-1.5">
                      <span className="text-xs font-bold text-[#FF7A3D] uppercase tracking-wide block">
                        Day {mod.dayNumber}: {mod.title.replace(/^Day \d+:\s*/, '')}
                      </span>
                      <div className="space-y-1">
                        {mod.lessons.map((les: any) => {
                          const isActive = les.id === activeLessonId;
                          return (
                            <button
                              key={les.id}
                              onClick={() => !les.isLocked && setActiveLessonId(les.id)}
                              disabled={les.isLocked}
                              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between text-xs ${
                                isActive
                                  ? 'bg-[#5B3594] text-white font-bold shadow-sm'
                                  : les.isLocked
                                  ? 'bg-[#F8F5FC]/60 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-60'
                                  : 'bg-[#F8F5FC] dark:bg-[#160F29] text-[#241B3F] dark:text-slate-300 hover:bg-[#EEE7FA] dark:hover:bg-[#271E42]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                {les.isLocked ? (
                                  <Lock className="w-3.5 h-3.5 shrink-0 opacity-50" />
                                ) : les.status === 'completed' ? (
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                )}
                                <span className="truncate">{les.title}</span>
                              </div>
                              <span className="font-mono text-[10px] opacity-75 shrink-0 font-semibold">
                                {les.durationMinutes}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SESSIONS TIMETABLE */}
        {activeTab === 'sessions' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#22183D] dark:text-white">Live Interactive Workshops</h2>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">Join real-time instructor-led evening workshops. Meeting links and recordings are published here.</p>
            </div>

            {sessions.map((sess: any) => (
              <div
                key={sess.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#FF7A3D] uppercase tracking-wide">
                      Day {sess.dayNumber} Session
                    </span>
                    <h3 className="text-base font-bold text-[#22183D] dark:text-white mt-0.5">{sess.title}</h3>
                    <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#FF7A3D]" />
                        {new Date(sess.sessionDate).toLocaleDateString('en-KE', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
                        {sess.startTime} – {sess.endTime} EAT
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sess.meetingUrl ? (
                      <a
                        href={sess.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold text-xs shadow-md shadow-[#FF7A3D]/25"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join Live Workshop</span>
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-[#6B627A] dark:text-[#DDD3E9]/80 px-3 py-1.5 rounded-xl bg-[#F8F5FC] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B]">
                        Meeting link opens 30m prior
                      </span>
                    )}
                  </div>
                </div>

                {sess.meetingPassword && (
                  <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 bg-[#FAF8FD] dark:bg-[#160F29] p-3 rounded-xl border border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
                    Passcode: <span className="font-mono text-[#22183D] dark:text-white font-bold">{sess.meetingPassword}</span>
                  </div>
                )}

                {sess.recordingUrl && (
                  <div className="pt-2 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 flex items-center justify-between text-xs">
                    <span className="text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">Session Recording:</span>
                    <a
                      href={sess.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF7A3D] font-bold hover:underline flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Full Replay</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ASSESSMENTS & QUIZZES */}
        {activeTab === 'assessments' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#22183D] dark:text-white">Course Assessments</h2>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">Complete the practical evaluations to unlock your verified course certificate (70% passing threshold).</p>
            </div>

            {assessments.map((a: any) => {
              const questions = (a.questionsData as any[]) || [];
              const isPassed = a.result?.passed;

              return (
                <div key={a.id} className="p-6 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#FF7A3D] uppercase tracking-wide">
                        {a.assessmentType?.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-bold text-[#22183D] dark:text-white mt-1">{a.title}</h3>
                    </div>
                    {isPassed ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Passed ({a.result.percentage}%)
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
                        Pass mark: {a.passingScore}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">{a.description}</p>

                  {/* Questions */}
                  <div className="space-y-4 pt-2">
                    {questions.map((q: any, qIdx: number) => (
                      <div key={q.id} className="p-4 rounded-xl bg-[#FAF8FD] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] space-y-3">
                        <div className="font-bold text-xs sm:text-sm text-[#22183D] dark:text-white">
                          {qIdx + 1}. {q.question}
                        </div>
                        <div className="space-y-2">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isSelected = quizAnswers[q.id] === optIdx;
                            return (
                              <div
                                key={optIdx}
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                                  isSelected
                                    ? 'border-[#FF7A3D] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/20 text-[#22183D] dark:text-white font-bold'
                                    : 'border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1D1533] text-[#241B3F] dark:text-slate-300 hover:border-[#FF7A3D]/40'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-[#FF7A3D] bg-[#FF7A3D] text-white' : 'border-slate-400'
                                  }`}
                                >
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {quizFeedback && (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                        quizFeedback.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 font-semibold'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>
                        Result: Score {quizFeedback.score}/{quizFeedback.totalScore} ({quizFeedback.percentage}%).{' '}
                        {quizFeedback.passed ? 'Congratulations, you passed!' : 'Review the lessons and try again.'}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSubmitAssessment(a.id)}
                    disabled={submittingQuiz}
                    className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold h-11 text-xs shadow-md shadow-[#FF7A3D]/20"
                  >
                    {submittingQuiz ? 'Submitting & Evaluating...' : isPassed ? 'Retake Assessment' : 'Submit Assessment Answers'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: CERTIFICATE VIEW & DOWNLOAD */}
        {activeTab === 'certificate' && (
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            {certificate ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#1D1533] border border-[#5B3594]/30 dark:border-[#FF7A3D]/40 shadow-xl space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#5B3594]/15 dark:bg-[#FF7A3D]/20 text-[#5B3594] dark:text-[#FFA06E] flex items-center justify-center mx-auto">
                  <Award className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-[#FF7A3D] font-bold">
                    Official Credential
                  </span>
                  <h2 className="text-2xl font-black text-[#22183D] dark:text-white mt-1">Certificate of Completion</h2>
                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2">
                    This certifies that <strong className="text-[#22183D] dark:text-white">{certificate.learnerName}</strong> has successfully completed all academic, video, and practical requirements for:
                  </p>
                  <div className="mt-3 text-lg font-bold text-[#5B3594] dark:text-[#FFA06E]">{course.title}</div>
                </div>

                <div className="p-5 bg-[#FAF8FD] dark:bg-[#160F29] rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] text-left text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Certificate Number:</span>
                    <span className="font-mono font-bold text-[#22183D] dark:text-white">{certificate.certificateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Issue Date:</span>
                    <span className="text-[#22183D] dark:text-white font-medium">{new Date(certificate.completionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Authorized Signatory:</span>
                    <span className="text-[#22183D] dark:text-white font-medium">{certificate.authorizedSignatory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Verification URL:</span>
                    <Link
                      href={`/training/verify/${certificate.certificateNumber}`}
                      target="_blank"
                      className="text-[#FF7A3D] underline font-mono font-bold"
                    >
                      /training/verify/{certificate.certificateNumber}
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <Link href={`/training/verify/${certificate.certificateNumber}`} target="_blank" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold text-xs h-11 px-6 shadow-md shadow-[#FF7A3D]/25">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Public Verification
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="w-full sm:w-auto border-[#DDD3E9] dark:border-[#3A2F5B] text-xs font-bold text-[#5B3594] dark:text-[#DDD3E9] h-11 px-6"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Print / Save PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] text-center space-y-4 shadow-sm">
                <Lock className="w-12 h-12 text-[#6B627A] dark:text-slate-500 mx-auto" />
                <h3 className="text-xl font-bold text-[#22183D] dark:text-white">Certificate Locked</h3>
                <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 max-w-sm mx-auto leading-relaxed">
                  To earn your certificate, you must watch at least {course.minCompletionPercentage || 80}% of lesson materials and achieve a passing score on the practical assessment.
                </p>
                <div className="text-xs font-bold text-[#FF7A3D]">
                  Current progress: {progress.percentage}%
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
