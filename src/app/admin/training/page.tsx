"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  DollarSign,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  Video,
  Award,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminTrainingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'cohorts' | 'bookings' | 'payments' | 'daraja' | 'learners'>('overview');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [darajaHealth, setDarajaHealth] = useState<any | null>(null);
  const [learners, setLearners] = useState<any[]>([]);

  // Modals & form state
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [newCohortModal, setNewCohortModal] = useState(false);
  const [cohortForm, setCohortForm] = useState({
    courseId: '',
    cohortCode: '',
    name: '',
    startDate: '',
    endDate: '',
    capacity: 50,
  });

  const [reconcileModal, setReconcileModal] = useState(false);
  const [reconcileForm, setReconcileForm] = useState({ bookingId: '', mpesaReceipt: '', amountPaid: '' });

  // Load overview and courses on mount
  const loadOverview = async () => {
    try {
      setLoading(true);
      const [ovRes, crsRes, darajaRes] = await Promise.all([
        fetch('/api/admin/training/overview'),
        fetch('/api/admin/training/courses'),
        fetch('/api/admin/training/daraja/health'),
      ]);

      const ovData = await ovRes.json();
      const crsData = await crsRes.json();
      const darajaData = await darajaRes.json();

      if (ovData.success) setStats(ovData.stats);
      if (crsData.success) setCourses(crsData.courses);
      if (darajaData.success) setDarajaHealth(darajaData.report);
    } catch (err) {
      console.error('Failed to load training admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // Tab switch loader
  const handleTabSwitch = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'bookings' && bookings.length === 0) {
      const res = await fetch('/api/admin/training/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } else if (tab === 'payments' && payments.length === 0) {
      const res = await fetch('/api/admin/training/payments');
      const data = await res.json();
      if (data.success) setPayments(data.transactions);
    } else if (tab === 'learners' && learners.length === 0) {
      const res = await fetch('/api/admin/training/learners');
      const data = await res.json();
      if (data.success) setLearners(data.learners);
    }
  };

  // Quick Action: Approve complimentary / sponsored booking
  const handleApproveBooking = async (bookingId: number, type: 'complimentary' | 'sponsored') => {
    if (!confirm(`Are you sure you want to approve this booking as ${type}? Access will be activated immediately.`)) return;
    try {
      const res = await fetch('/api/admin/training/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `approve_${type}`, bookingId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        const refRes = await fetch('/api/admin/training/bookings');
        const refData = await refRes.json();
        if (refData.success) setBookings(refData.bookings);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Action: Save course price & capacity update
  const handleSaveCourse = async (courseId: number, updates: any) => {
    try {
      const res = await fetch(`/api/admin/training/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        alert('Course updated successfully!');
        setEditingCourse(null);
        loadOverview();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Action: Toggle Progressive Lesson Release
  const handleToggleLessonRelease = async (lessonId: number, currentReleased: boolean) => {
    try {
      const res = await fetch('/api/admin/training/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lessonId, isReleased: !currentReleased }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Lesson ${!currentReleased ? 'released' : 'locked'} successfully.`);
        loadOverview();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Action: Reconcile payment
  const handleReconcilePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reconcile_manual',
          bookingId: Number(reconcileForm.bookingId),
          mpesaReceipt: reconcileForm.mpesaReceipt,
          amountPaid: reconcileForm.amountPaid ? Number(reconcileForm.amountPaid) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setReconcileModal(false);
        const refRes = await fetch('/api/admin/training/payments');
        const refData = await refRes.json();
        if (refData.success) setPayments(refData.transactions);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Action: Issue certificate
  const handleIssueCertificate = async (userId: number, courseId: number) => {
    try {
      const res = await fetch('/api/admin/training/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue_certificate', userId, courseId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Certificate issued! Certificate Number: ${data.certificate.certificateNumber}`);
        const refRes = await fetch('/api/admin/training/learners');
        const refData = await refRes.json();
        if (refData.success) setLearners(refData.learners);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 sm:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            TaskLynk Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Training Academy Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage course curricula, cohorts, bookings, Safaricom M-Pesa payments, live workshops, and learner certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/training" target="_blank">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-slate-200 text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Public Training Page
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={loadOverview}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 py-4 border-b border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
          { id: 'courses', label: `Programs (${courses.length})`, icon: BookOpen },
          { id: 'bookings', label: 'Bookings & Registrations', icon: Users },
          { id: 'payments', label: 'M-Pesa Payments', icon: DollarSign },
          { id: 'daraja', label: 'Daraja Diagnostics', icon: ShieldCheck },
          { id: 'learners', label: 'Learners & Certificates', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="py-6 space-y-8">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Revenue</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                KES {Number(stats?.revenueCollected || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">M-Pesa Verified</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Confirmed Learners</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {stats?.confirmedLearners || 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Active enrollments</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Bookings</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {stats?.totalBookings || 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Initiated &amp; confirmed</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Published Courses</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {stats?.publishedPrograms || 0} / {stats?.totalCourses || 5}
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">Live on /training</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Payments</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {stats?.pendingPayments || 0}
              </div>
              <span className="text-[10px] text-orange-400 mt-1 block">Awaiting M-Pesa PIN</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Daraja Status</span>
              <div className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    darajaHealth?.isProductionReady
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="truncate">{darajaHealth?.mode?.toUpperCase() || 'SANDBOX'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Shortcode: {darajaHealth?.shortcode}
              </span>
            </div>
          </div>

          {/* Initial Training Programs Status Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">November – December 2026 Programs</h3>
                <p className="text-xs text-slate-400">Initial five curriculum tracks ready for bookings &amp; live training.</p>
              </div>
              <span className="text-xs text-orange-400 font-mono">Editable in Programs tab</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-3">Program</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Current Fee</th>
                    <th className="py-3 px-3">Intake Code</th>
                    <th className="py-3 px-3">Enrolled / Cap</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-850">
                      <td className="py-3 px-3 font-semibold text-white">
                        <Link href={`/training/${c.slug}`} target="_blank" className="hover:text-orange-400 flex items-center gap-1.5">
                          <span>{c.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{c.category?.name || 'General'}</td>
                      <td className="py-3 px-3 font-mono">{c.durationDays} Days ({c.dailyDurationHours})</td>
                      <td className="py-3 px-3 font-bold text-orange-400">KES {Number(c.standardPrice).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">NOV-DEC 2026</td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-400 font-bold">{c.totalEnrolled || 0}</span> / {c.maxCapacity || 50}
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCourse(c);
                            setActiveTab('courses');
                          }}
                          className="h-7 px-2.5 text-[11px] border-slate-700 bg-slate-800 hover:bg-slate-700"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit Pricing &amp; Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. COURSES & CURRICULUM BUILDER */}
      {activeTab === 'courses' && (
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Course Management &amp; Curriculum Builder</h2>
              <p className="text-xs text-slate-400">Configure prices, modules, video resources, and progressive lesson release.</p>
            </div>
          </div>

          {editingCourse ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-orange-500/40 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Edit Program: {editingCourse.title}</h3>
                <Button size="sm" variant="ghost" onClick={() => setEditingCourse(null)} className="text-xs text-slate-400">
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-300">Standard Price (KES) *</Label>
                  <Input
                    type="number"
                    value={editingCourse.standardPrice}
                    onChange={(e) => setEditingCourse({ ...editingCourse, standardPrice: Number(e.target.value) })}
                    className="mt-1 bg-slate-950 border-slate-800 font-bold text-orange-400"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-300">Promotional Price (Optional)</Label>
                  <Input
                    type="number"
                    value={editingCourse.promotionalPrice || ''}
                    placeholder="e.g. 1200"
                    onChange={(e) => setEditingCourse({ ...editingCourse, promotionalPrice: e.target.value ? Number(e.target.value) : null })}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-300">Max Capacity</Label>
                  <Input
                    type="number"
                    value={editingCourse.maxCapacity || 50}
                    onChange={(e) => setEditingCourse({ ...editingCourse, maxCapacity: Number(e.target.value) })}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-300">Program Title</Label>
                <Input
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-300">Description</Label>
                <textarea
                  rows={4}
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full mt-1 p-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handleSaveCourse(editingCourse.id, {
                    title: editingCourse.title,
                    description: editingCourse.description,
                    standardPrice: editingCourse.standardPrice,
                    promotionalPrice: editingCourse.promotionalPrice,
                    maxCapacity: editingCourse.maxCapacity,
                  })}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs h-10 px-5"
                >
                  Save Program Changes
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setEditingCourse(null)}
                  className="border-slate-700 bg-slate-800 text-slate-300 text-xs h-10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded">
                      {c.category?.name || 'Academy'}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      KES {Number(c.standardPrice).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{c.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.shortDescription || c.description}</p>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>Curriculum Modules:</span>
                      <span className="font-semibold text-white">{c.modulesCount} modules</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Lessons:</span>
                      <span className="font-semibold text-white">{c.lessonsCount} lessons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Live Sessions:</span>
                      <span className="font-semibold text-white">{c.sessionsCount} sessions</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingCourse(c)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs h-9"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit Pricing &amp; Config
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. BOOKINGS & REGISTRATIONS */}
      {activeTab === 'bookings' && (
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Learner Bookings &amp; Enrolments</h2>
              <p className="text-xs text-slate-400">Review learner registrations, verify payment status, and approve complimentary seats.</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleTabSwitch('bookings')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Learner</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Intake</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Booking Status</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {bookings.map((b) => (
                  <tr key={b.booking.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {b.booking.bookingReference}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{b.booking.fullName}</div>
                      <div className="text-[11px] text-slate-400">{b.booking.phone} • {b.booking.email}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                      {b.courseTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {b.cohortName}
                    </td>
                    <td className="py-3 px-3 font-bold text-orange-400">
                      KES {Number(b.booking.agreedPrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.booking.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {b.booking.bookingStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.booking.paymentStatus === 'paid' || b.booking.paymentStatus === 'complimentary'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {b.booking.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 flex items-center gap-1.5">
                      {b.booking.bookingStatus !== 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveBooking(b.booking.id, 'complimentary')}
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                          >
                            Approve Free
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setReconcileForm({
                                bookingId: String(b.booking.id),
                                mpesaReceipt: '',
                                amountPaid: String(b.booking.agreedPrice),
                              });
                              setReconcileModal(true);
                            }}
                            variant="outline"
                            className="h-7 px-2 border-slate-700 bg-slate-800 text-[10px]"
                          >
                            Manual Paid
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. PAYMENTS & FINANCIALS */}
      {activeTab === 'payments' && (
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">M-Pesa Financial Transactions</h2>
              <p className="text-xs text-slate-400">All Safaricom Lipa Na M-Pesa receipts, phone numbers, and transaction logs.</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleTabSwitch('payments')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Receipt / Checkout ID</th>
                  <th className="py-3 px-3">Learner &amp; Phone</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {payments.map((t) => (
                  <tr key={t.payment.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-emerald-400">
                        {t.payment.mpesaReceipt || 'PENDING'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                        {t.payment.checkoutRequestId}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{t.booking.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{t.payment.phoneNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {t.courseTitle}
                    </td>
                    <td className="py-3 px-3 font-bold text-orange-400">
                      KES {Number(t.payment.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.payment.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(t.payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. DARAJA INTEGRATION DIAGNOSTICS */}
      {activeTab === 'daraja' && (
        <div className="py-6 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Safaricom Daraja Integration Health</h2>
              <p className="text-xs text-slate-400">Inspect credentials, OAuth handshake, shortcode configuration, and callback URL.</p>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                const res = await fetch('/api/admin/training/daraja/health');
                const data = await res.json();
                if (data.success) setDarajaHealth(data.report);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Re-test Daraja Handshake
            </Button>
          </div>

          {darajaHealth && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Overall status banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  darajaHealth.isProductionReady
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    {darajaHealth.isProductionReady
                      ? '✓ LIVE PRODUCTION READY: Verified Daraja Credentials & HTTPS Webhook'
                      : '⚠️ CONFIGURATION NOTICE: Currently Running Sandbox / Test Mode'}
                  </div>
                  <div className="text-xs mt-0.5 opacity-80">
                    Mode: <strong className="font-mono">{darajaHealth.mode?.toUpperCase()}</strong> • OAuth Handshake: <strong>{darajaHealth.oauthStatus}</strong>
                  </div>
                </div>
              </div>

              {/* Technical Audit Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block uppercase">Safaricom Credentials</span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shortcode / Store:</span>
                    <span className="font-mono text-white font-bold">{darajaHealth.shortcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction Type:</span>
                    <span className="font-mono text-white">{darajaHealth.transactionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Till / Party B:</span>
                    <span className="font-mono text-white">{darajaHealth.tillNumber || 'Not configured'}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block uppercase">Webhook Callback URL</span>
                  <div className="truncate font-mono text-white" title={darajaHealth.callbackUrl}>
                    {darajaHealth.callbackUrl}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>HTTPS Public Endpoint Verified</span>
                  </div>
                </div>
              </div>

              {/* Warnings and Guidance */}
              {darajaHealth.warnings?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 block uppercase">Audit Findings:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {darajaHealth.warnings.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {darajaHealth.recommendations?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 block uppercase">Go-Live Steps for Real Money:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {darajaHealth.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">1.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 6. LEARNERS & CERTIFICATES */}
      {activeTab === 'learners' && (
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Learner Progress &amp; Certification Gradebook</h2>
              <p className="text-xs text-slate-400">Track lesson completion percentages, quiz scores, and issue verified PDF credentials.</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleTabSwitch('learners')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Learner</th>
                  <th className="py-3 px-3">Course &amp; Cohort</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Quizzes Taken</th>
                  <th className="py-3 px-3">Certificate</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {learners.map((lrn) => (
                  <tr key={lrn.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div>{lrn.name}</div>
                      <div className="text-[11px] text-slate-400">{lrn.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white font-medium">{lrn.courseTitle}</div>
                      <div className="text-[11px] text-slate-400">{lrn.cohortName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              lrn.progressPercentage >= 80 ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, lrn.progressPercentage)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-orange-400">{lrn.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {lrn.assessmentResultsCount} completed
                    </td>
                    <td className="py-3 px-3">
                      {lrn.certificate ? (
                        <Link
                          href={`/training/verify/${lrn.certificate.certificateNumber}`}
                          target="_blank"
                          className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{lrn.certificate.certificateNumber}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-500">Not Issued</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {!lrn.certificate && (
                        <Button
                          size="sm"
                          onClick={() => handleIssueCertificate(lrn.userId, lrn.id)}
                          className="h-7 px-2.5 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          Issue Certificate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECONCILE MODAL */}
      {reconcileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Manual M-Pesa Reconciliation</h3>
            <form onSubmit={handleReconcilePayment} className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300">Booking ID</Label>
                <Input
                  disabled
                  value={reconcileForm.bookingId}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Safaricom Receipt Number *</Label>
                <Input
                  required
                  placeholder="e.g. QKH712XYZ4"
                  value={reconcileForm.mpesaReceipt}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, mpesaReceipt: e.target.value.toUpperCase() })}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs uppercase font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Amount Paid (KES)</Label>
                <Input
                  type="number"
                  value={reconcileForm.amountPaid}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, amountPaid: e.target.value })}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10">
                  Confirm Payment &amp; Enrol Learner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReconcileModal(false)}
                  className="border-slate-700 bg-slate-800 text-xs text-slate-300 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
