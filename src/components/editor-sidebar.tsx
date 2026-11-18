"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { 
  LayoutDashboard, 
  FileCheck, 
  Clock,
  User,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  ListChecks,
  TrendingUp,
  Search,
  MessageSquare,
  Bell,
  Calendar,
  BarChart3,
  FileEdit
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context-v2';
import { useState, useEffect } from 'react';
import { useSidebarMobile } from '@/hooks/useSidebarMobile';

type EditorSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function EditorSidebar({ isOpen: propIsOpen, onClose }: EditorSidebarProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Mobile sidebar state
  const { isMobileOpen, setIsMobileOpen } = useSidebarMobile();

  // Get current tab from search params
  const currentTab = searchParams?.get("tab") || "";

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

  const isAssignmentsPath = pathname.startsWith("/editor/assignments");
  const [assignmentsOpen, setAssignmentsOpen] = useState<boolean>(isAssignmentsPath);
  
  // State for order counts
  const [orderCounts, setOrderCounts] = useState({
    all: 0,
    pending: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
  });

  // Fetch order counts (editor sees orders in "editing" status) - OPTIMIZED: uses fast aggregate endpoint & pauses when tab is hidden
  useEffect(() => {
    if (!user || user.role !== "editor") return;
    
    const fetchCounts = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const response = await fetch('/api/v2/orders/counts', {
          credentials: 'include',
        });
        if (response.ok) {
          const counts = await response.json();
          const editingCount = counts.editing ?? 0;
          setOrderCounts({
            all: editingCount,
            pending: editingCount,
            inReview: 0,
            approved: counts.delivered ?? 0,
            rejected: counts.revision ?? 0,
          });
        }
      } catch (error) {
        console.error('[Editor Sidebar] Failed to fetch order counts:', error);
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
  }, [user?.id]);

  if (!user || user.role !== "editor") return null;

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
      
      <aside className={`
        fixed top-0 left-0 z-50 
        w-56 h-screen 
        flex flex-col 
        bg-[#1a1a2e] text-primary-foreground 
        transition-transform duration-300 ease-in-out
        -translate-x-full lg:translate-x-0
        ${isMobileOpen ? '!translate-x-0' : ''}
      `}>
        {/* Logo Section */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
          <Link href="/editor/dashboard" className="flex items-center">
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
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider font-semibold">Editor</p>
        <p className="text-sm font-semibold text-primary-foreground truncate mt-0.5">{user.name}</p>
        {user.displayId && (
          <p className="text-[10px] text-primary-foreground/40 mt-1">{user.displayId}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/editor/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/dashboard"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* My Queue (Quick Access) */}
          <Link
            href="/editor/queue"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/queue"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <ListChecks className="h-4 w-4" />
            My Queue
          </Link>

          {/* Assignments Dropdown */}
          <div>
            <button
              type="button"
              onClick={() => setAssignmentsOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isAssignmentsPath
                  ? "bg-accent-orange/15 text-accent-orange"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <FileCheck className="h-4 w-4" />
                Assignments
              </span>
              {assignmentsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {assignmentsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                <button onClick={() => router.push("/editor/orders?tab=all")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${pathname === "/editor/orders" ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                  <span className="flex items-center gap-3">
                    <ClipboardList className="h-3 w-3" /> All Orders
                  </span>
                  {orderCounts.all > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                      {orderCounts.all}
                    </span>
                  )}
                </button>
                <button onClick={() => router.push("/editor/orders?tab=my-assignments")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentTab === 'my-assignments' ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                  <span className="flex items-center gap-3">
                    <Clock className="h-3 w-3" /> Pending Review
                  </span>
                  {orderCounts.pending > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {orderCounts.pending}
                    </span>
                  )}
                </button>
                <button onClick={() => router.push("/editor/orders?tab=editing-queue")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentTab === 'editing-queue' ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                  <span className="flex items-center gap-3">
                    <AlertCircle className="h-3 w-3" /> In Review
                  </span>
                  {orderCounts.inReview > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {orderCounts.inReview}
                    </span>
                  )}
                </button>
                <button onClick={() => router.push("/editor/orders?tab=approved")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentTab === 'approved' ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                  <span className="flex items-center gap-3">
                    <CheckCircle className="h-3 w-3" /> Approved
                  </span>
                  {orderCounts.approved > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {orderCounts.approved}
                    </span>
                  )}
                </button>
                <button onClick={() => router.push("/editor/orders?tab=rejected")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${currentTab === 'rejected' ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                  <span className="flex items-center gap-3">
                    <XCircle className="h-3 w-3" /> Rejected
                  </span>
                  {orderCounts.rejected > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      {orderCounts.rejected}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Search Orders */}
          <Link
            href="/editor/search"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/search"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <Search className="h-4 w-4" />
            Search Orders
          </Link>

          {/* Analytics & Reports */}
          <Link
            href="/editor/analytics"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/analytics"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics & Reports
          </Link>

          {/* Performance Metrics */}
          <Link
            href="/editor/performance"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/performance"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Performance
          </Link>

          {/* Messages */}
          <Link
            href="/editor/messages"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/messages"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>

          {/* Calendar & Deadlines */}
          <Link
            href="/editor/calendar"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/calendar"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Link>

          {/* Settings */}
          <Link
            href="/editor/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/editor/settings"
                ? "bg-accent-orange/15 text-accent-orange"
                : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-primary-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 text-xs text-primary-foreground/40 text-center">
        © {new Date().getFullYear()} TaskLynk
      </div>
    </aside>
    </>
  );
}
