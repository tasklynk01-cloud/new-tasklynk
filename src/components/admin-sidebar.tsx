"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import React, { useState, useEffect, Suspense } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  MessageSquare,
  DollarSign,
  Settings,
  PackageCheck,
  CheckCircle2,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Ban,
  Receipt,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
  UserCog,
  Globe,
  UserCheck,
  Briefcase,
  ShieldAlert,
  TrendingUp,
  Tag,
  DollarSignIcon,
  Mail,
  Download,
  Sparkles,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/lib/auth-context-v2";
import { useSidebarMobile } from "@/hooks/useSidebarMobile";

type AdminSidebarContentProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function AdminSidebarContent({ isOpen: propIsOpen, onClose }: AdminSidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Mobile sidebar state
  const { isMobileOpen, setIsMobileOpen } = useSidebarMobile();
  
  // Sync with prop if provided
  useEffect(() => {
    if (typeof propIsOpen === 'boolean') {
      setIsMobileOpen(propIsOpen);
    }
  }, [propIsOpen, setIsMobileOpen]);
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
    onClose?.();
  }, [pathname, onClose]);
  
  // Prevent background scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const isOrdersPath = pathname.startsWith("/admin/jobs") || pathname.startsWith("/admin/orders");
  const isUserManagementPath = pathname.startsWith("/admin/user-management") || pathname.startsWith("/admin/users");
  const isInvoicesPath = pathname.startsWith("/admin/invoices") || pathname.startsWith("/admin/invoicing");
  const [ordersOpen, setOrdersOpen] = useState<boolean>(isOrdersPath);
  const [userManagementOpen, setUserManagementOpen] = useState<boolean>(isUserManagementPath);
  const [invoicesOpen, setInvoicesOpen] = useState<boolean>(isInvoicesPath);
  
  // State for order counts
  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    accepted: 0,
    assigned: 0,
    inProgress: 0,
    submitted: 0,
    editing: 0,
    delivered: 0,
    approved: 0,
    revision: 0,
    paid: 0,
    completed: 0,
    onHold: 0,
    cancelled: 0,
  });

  // Fetch order counts (admin sees ALL orders) - OPTIMIZED: uses fast aggregate endpoint & pauses when tab is hidden
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    
    const fetchCounts = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const response = await fetch('/api/v2/orders/counts', {
          credentials: 'include',
        });
        if (response.ok) {
          const counts = await response.json();
          setOrderCounts({
            pending: counts.pending ?? 0,
            accepted: counts.accepted ?? 0,
            assigned: 0,
            inProgress: counts.inProgress ?? 0,
            submitted: counts.submitted ?? 0,
            editing: counts.editing ?? 0,
            delivered: counts.delivered ?? 0,
            approved: counts.approved ?? 0,
            revision: counts.revision ?? 0,
            paid: counts.paid ?? 0,
            completed: counts.completed ?? 0,
            onHold: counts.onHold ?? 0,
            cancelled: counts.cancelled ?? 0,
          });
        }
      } catch (error) {
        console.error('[Admin Sidebar] Failed to fetch order counts:', error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchCounts(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id]); // Only re-run if user ID changes

  React.useEffect(() => {
    setOrdersOpen(isOrdersPath);
  }, [isOrdersPath]);

  React.useEffect(() => {
    setUserManagementOpen(isUserManagementPath);
  }, [isUserManagementPath]);

  React.useEffect(() => {
    setInvoicesOpen(isInvoicesPath);
  }, [isInvoicesPath]);

  if (!user || user.role !== "admin") return null;

  const currentStatus = searchParams?.get("status") || "";
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => {
            setIsMobileOpen(false);
            onClose?.();
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 
          w-56 h-screen
          flex flex-col
          bg-sidebar text-primary-foreground
          transition-transform duration-300 ease-in-out
          -translate-x-full lg:translate-x-0
          ${isMobileOpen ? '!translate-x-0' : ''}
        `}
      >
        {/* Logo Section */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
          <Link href="/admin/dashboard" className="flex items-center">
            <TaskLynkLogo size="sm" variant="white" showTagline={false} asLink={false} />
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => {
              setIsMobileOpen(false);
              onClose?.();
            }}
            className="lg:hidden p-4 rounded-lg hover:bg-accent-orange/10 transition-colors"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Admin</p>
          <p className="text-sm font-semibold text-sidebar-foreground truncate mt-0.5">{user.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {/* Overview */}
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/dashboard"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>

            {/* Orders Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setOrdersOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isOrdersPath
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4" />
                  Orders
                </span>
                {ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              
              {ordersOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                  <button onClick={() => router.push("/admin/jobs?status=all")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${pathname.startsWith("/admin/jobs") && (currentStatus === 'all' || !currentStatus) ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <ClipboardList className="h-3 w-3" /> All
                    </span>
                    {(orderCounts.pending + orderCounts.accepted + orderCounts.inProgress + orderCounts.submitted + orderCounts.editing + orderCounts.delivered + orderCounts.approved + orderCounts.revision + orderCounts.paid + orderCounts.completed + orderCounts.onHold + orderCounts.cancelled) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        {orderCounts.pending + orderCounts.accepted + orderCounts.inProgress + orderCounts.submitted + orderCounts.editing + orderCounts.delivered + orderCounts.approved + orderCounts.revision + orderCounts.paid + orderCounts.completed + orderCounts.onHold + orderCounts.cancelled}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=pending")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'pending' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PauseCircle className="h-3 w-3" /> Pending
                    </span>
                    {orderCounts.pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {orderCounts.pending}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=accepted")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'accepted' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-3 w-3" /> Accepted
                    </span>
                    {orderCounts.accepted > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {orderCounts.accepted}
                      </span>
                    )}
                  </button>
                  {/* Assigned status removed - assignment goes directly to In Progress */}
                  <button onClick={() => router.push("/admin/jobs?status=in_progress")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'in_progress' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PlayCircle className="h-3 w-3" /> In Progress
                    </span>
                    {orderCounts.inProgress > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {orderCounts.inProgress}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=submitted")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'submitted' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <FileText className="h-3 w-3" /> Submitted
                    </span>
                    {orderCounts.submitted > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {orderCounts.submitted}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=editing")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'editing' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <FileText className="h-3 w-3" /> Editing
                    </span>
                    {orderCounts.editing > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {orderCounts.editing}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=delivered")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'delivered' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PackageCheck className="h-3 w-3" /> Delivered
                    </span>
                    {orderCounts.delivered > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {orderCounts.delivered}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=approved")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'approved' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                    {orderCounts.approved > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {orderCounts.approved}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=revision")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'revision' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <RotateCcw className="h-3 w-3" /> Revision
                    </span>
                    {orderCounts.revision > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {orderCounts.revision}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=paid")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'paid' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <Receipt className="h-3 w-3" /> Paid
                    </span>
                    {orderCounts.paid > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                        {orderCounts.paid}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=completed")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'completed' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                    {orderCounts.completed > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                        {orderCounts.completed}
                      </span>
                    )}
                  </button>
                  {/* Quick Access: Completed Orders Page */}
                  <button 
                    onClick={() => router.push("/admin/orders?tab=completed")} 
                    className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${
                      pathname === '/admin/orders' 
                        ? "text-accent-orange bg-accent-orange/10 border-l-2 border-accent-orange" 
                        : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Receipt className="h-3 w-3" /> Completed Orders
                    </span>
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=on_hold")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'on_hold' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PauseCircle className="h-3 w-3" /> On Hold
                    </span>
                    {orderCounts.onHold > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {orderCounts.onHold}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/admin/jobs?status=cancelled")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentStatus === 'cancelled' ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <Ban className="h-3 w-3" /> Cancelled
                    </span>
                    {orderCounts.cancelled > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        {orderCounts.cancelled}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* User Management Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setUserManagementOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isUserManagementPath
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <UserCog className="h-4 w-4" />
                  User Management
                </span>
                {userManagementOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              
              {userManagementOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                  <Link href="/admin/user-management" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/user-management" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <Users className="h-3 w-3" /> All Users
                  </Link>
                  <Link href="/admin/users" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname.startsWith("/admin/users") ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <Tag className="h-3 w-3" /> By Category
                  </Link>
                  <Link href="/admin/specialist-profiles" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/specialist-profiles" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <Sparkles className="h-3 w-3 text-accent-orange" /> Profile Evaluation
                  </Link>
                  <Link href="/admin/user-management/freelancers" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/user-management/freelancers" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <UserCheck className="h-3 w-3" /> Freelancers
                  </Link>
                  <Link href="/admin/user-management/clients" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/user-management/clients" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <Briefcase className="h-3 w-3" /> Clients
                  </Link>
                  <Link href="/admin/user-management/managers" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/user-management/managers" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <ShieldCheck className="h-3 w-3" /> Managers
                  </Link>
                  <Link href="/admin/user-management/admins" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/user-management/admins" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <ShieldAlert className="h-3 w-3" /> Admins
                  </Link>
                  <Link href="/admin/editors" className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${pathname === "/admin/editors" ? "text-accent-orange bg-accent-orange/10" : "text-muted-foreground hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <FileText className="h-3 w-3" /> Editors
                  </Link>
                </div>
              )}
            </div>

            {/* Managers */}
            <Link
              href="/admin/managers"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/managers"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Managers
            </Link>

            {/* Domains */}
            <Link
              href="/admin/domains"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/domains"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Globe className="h-4 w-4" />
              Domains
            </Link>

            {/* Messages */}
            <Link
              href="/admin/messages"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/admin/messages")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>

            {/* Memos */}
            <Link
              href="/admin/memos"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/admin/memos")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Memos
            </Link>

            {/* Training Academy */}
            <Link
              href="/admin/training"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/admin/training")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-accent-orange" />
              Training Academy
            </Link>

            {/* Payments */}
            <Link
              href="/admin/payments"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/payments"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Payments
            </Link>

            {/* Invoices - Collapsible */}
            <div>
              <button
                onClick={() => setInvoicesOpen(!invoicesOpen)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isInvoicesPath
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  Invoices
                </span>
                {invoicesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {invoicesOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                  <Link
                    href="/admin/invoices/clients"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      pathname === "/admin/invoices/clients"
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                    }`}
                  >
                    Clients
                  </Link>
                  <Link
                    href="/admin/invoices/freelancers"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      pathname === "/admin/invoices/freelancers"
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                    }`}
                  >
                    Freelancers
                  </Link>
                  <Link
                    href="/admin/invoices/managers"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      pathname === "/admin/invoices/managers"
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                    }`}
                  >
                    Managers
                  </Link>
                  <Link
                    href="/admin/invoices/editors"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      pathname === "/admin/invoices/editors"
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                    }`}
                  >
                    Editors
                  </Link>
                  <Link
                    href="/admin/invoices/admin"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      pathname === "/admin/invoices/admin"
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                    }`}
                  >
                    Admin
                  </Link>
                </div>
              )}
            </div>

            {/* Payouts */}
            <Link
              href="/admin/payouts"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/payouts"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Payouts
            </Link>

            {/* CPP Settings */}
            <Link
              href="/admin/cpp-settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/cpp-settings"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              CPP Settings
            </Link>

            {/* Writer Tiers */}
            <Link
              href="/admin/writer-tiers"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/writer-tiers"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Writer Tiers
            </Link>

            {/* Financials */}
            <Link
              href="/admin/financials"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/financials"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <DollarSignIcon className="h-4 w-4" />
              Financials
            </Link>

            {/* Transactions */}
            <Link
              href="/admin/financials/transactions"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/financials/transactions"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Transactions
            </Link>

            {/* Email Management */}
            <Link
              href="/admin/email-management"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/email-management"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email Management
            </Link>

            {/* Downloads */}
            <Link
              href="/admin/downloads"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/downloads"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Download className="h-4 w-4" />
              Downloads
            </Link>

            {/* Settings */}
            <Link
              href="/admin/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/settings"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} TaskLynk
        </div>
      </aside>
    </>
  );
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarContentProps) => {
  return (
    <Suspense
      fallback={
        <aside className="hidden lg:block fixed top-0 left-0 w-56 h-screen bg-sidebar">
          <div className="h-14 px-4 flex items-center border-b border-sidebar-border">
            <div className="h-6 w-24 bg-white/10 animate-pulse rounded"></div>
          </div>
        </aside>
      }
    >
      <AdminSidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};
