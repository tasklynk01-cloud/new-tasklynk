"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { 
  LayoutDashboard, 
  Briefcase, 
  ClipboardList, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  Gavel, 
  PauseCircle, 
  PlayCircle, 
  PenLine, 
  CheckCircle2, 
  PackageCheck, 
  RotateCcw, 
  Ban, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  FileText,
  User,
  TrendingUp,
  Users,
  Wallet,
  RotateCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context-v2";
import { useState, useEffect, Suspense } from "react";
import { useSidebarMobile } from "@/hooks/useSidebarMobile";

type FreelancerSidebarContentProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function FreelancerSidebarContent({ isOpen: propIsOpen, onClose }: FreelancerSidebarContentProps) {
  const pathname = usePathname();
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

  const isOrdersPath = pathname.startsWith("/freelancer/orders") || 
                       pathname.startsWith("/freelancer/bids") || 
                       pathname.startsWith("/freelancer/jobs") ||
                       pathname.startsWith("/freelancer/on-hold") ||
                       pathname.startsWith("/freelancer/in-progress") ||
                       pathname.startsWith("/freelancer/editing") ||
                       pathname.startsWith("/freelancer/delivered") ||
                       pathname.startsWith("/freelancer/revision") ||
                       pathname.startsWith("/freelancer/approved") ||
                       pathname.startsWith("/freelancer/completed") ||
                       pathname.startsWith("/freelancer/cancelled");
  const [ordersOpen, setOrdersOpen] = useState<boolean>(isOrdersPath);
  const [earningsOpen, setEarningsOpen] = useState<boolean>(pathname.includes('/earnings') || pathname.includes('/invoicing'));
  
  // State for order counts
  const [orderCounts, setOrderCounts] = useState({
    available: 0,
    bids: 0,
    onHold: 0,
    inProgress: 0,
    editing: 0,
    delivered: 0,
    revision: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  });

  // Fetch order counts
  useEffect(() => {
    if (!user || user.role !== "freelancer") return;
    
    const fetchCounts = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const timestamp = Date.now();
        
        // Fetch assigned jobs
        const jobsResponse = await fetch('/api/v2/orders/counts', { credentials: 'include' });
        
        // Fetch available orders (accepted, unassigned, no bid from this freelancer)
        const availableResponse = await fetch(`/api/v2/freelancers/available-orders?status=accepted&_=${timestamp}`, {
          credentials: 'include',
        });
        
        // Fetch freelancer's bids
        const bidsResponse = await fetch(`/api/bids?freelancerId=${user.id}&unassignedOnly=true`, {
          credentials: 'include',
        });
        
        let available = 0;
        let bids = 0;
        
        if (availableResponse.ok) {
          const availableData = await availableResponse.json();
          const acceptedOrders = (availableData.orders || []).filter((j: any) => 
            j.status === 'accepted' && !j.assignedFreelancerId
          );
          
          // Get bid job IDs to exclude
          let bidJobIds: number[] = [];
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            bidJobIds = (bidsData || []).map((bid: any) => bid.jobId);
            // Count pending bids
            bids = (bidsData || []).filter((bid: any) => bid.status === 'pending').length;
          }
          
          // Count available orders (excluding those with bids)
          available = acceptedOrders.filter((j: any) => !bidJobIds.includes(j.id)).length;
        }
        
        if (jobsResponse.ok) {
          const counts = await jobsResponse.json();
          setOrderCounts({
            available,
            bids,
            onHold: counts.onHold ?? 0,
            inProgress: counts.inProgress ?? 0,
            editing: counts.editing ?? 0,
            delivered: counts.delivered ?? 0,
            revision: counts.revision ?? 0,
            approved: counts.approved ?? 0,
            completed: counts.completed ?? 0,
            cancelled: counts.cancelled ?? 0,
          });
        }
      } catch (error) {
        console.error('[Freelancer Sidebar] Failed to fetch order counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchCounts(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id]); // Only re-run if user ID changes

  if (!user || user.role !== "freelancer") return null;

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
          bg-sidebar text-sidebar-foreground
          transition-transform duration-300 ease-in-out
          -translate-x-full lg:translate-x-0
          ${isMobileOpen ? '!translate-x-0' : ''}
        `}
      >
        {/* Logo Section */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
          <Link href="/freelancer/dashboard" className="flex items-center">
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Freelancer</p>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
            {user.tier && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{backgroundColor: `${user.tierColor || '#FF7A3D'}20`, color: user.tierColor || '#FF7A3D'}}>{user.tier}</span>
            )}
          </div>
          {typeof user.balance === "number" && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-bold text-green-500">KSh {user.balance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {/* Overview */}
            <Link
              href="/freelancer/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/dashboard"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
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
                    : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4" />
                  Orders
                </span>
                {ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              
              {ordersOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                  <button onClick={() => router.push("/freelancer/available")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/available") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <Briefcase className="h-3 w-3" /> Available Orders
                    </span>
                    {orderCounts.available > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-500 border border-teal-500/30">
                        {orderCounts.available}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/bids")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/bids") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <Gavel className="h-3 w-3" /> My Bids
                    </span>
                    {orderCounts.bids > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-500 border border-purple-500/30">
                        {orderCounts.bids}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/on-hold")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/on-hold") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PauseCircle className="h-3 w-3" /> On Hold
                    </span>
                    {orderCounts.onHold > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {orderCounts.onHold}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/in-progress")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/in-progress") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PlayCircle className="h-3 w-3" /> In Progress
                    </span>
                    {orderCounts.inProgress > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {orderCounts.inProgress}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/editing")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/editing") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PenLine className="h-3 w-3" /> Editing
                    </span>
                    {orderCounts.editing > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {orderCounts.editing}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/delivered")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/delivered") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <PackageCheck className="h-3 w-3" /> Delivered
                    </span>
                    {orderCounts.delivered > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {orderCounts.delivered}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/revision")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/revision") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <RotateCcw className="h-3 w-3" /> Revision
                    </span>
                    {orderCounts.revision > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {orderCounts.revision}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/approved")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/approved") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                    {orderCounts.approved > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {orderCounts.approved}
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push("/freelancer/completed")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/completed") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                    {orderCounts.completed > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                        {orderCounts.completed}
                      </span>
                    )}
                  </button>
                  {/* Quick Access: Earnings History */}
                  <button 
                    onClick={() => router.push("/freelancer/orders/completed")} 
                    className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${
                      pathname === '/freelancer/orders/completed'
                        ? "text-accent-orange bg-accent-orange/10 border-l-2 border-accent-orange" 
                        : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <DollarSign className="h-3 w-3" /> Earnings History
                    </span>
                  </button>
                  <button onClick={() => router.push("/freelancer/cancelled")} className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all ${isActive("/freelancer/cancelled") ? "text-accent-orange bg-accent-orange/10" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10"}`}>
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

            {/* My Jobs */}
            <Link
              href="/freelancer/jobs"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/freelancer/jobs")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              My Jobs
            </Link>

            {/* Messages */}
            <Link
              href="/freelancer/messages"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/freelancer/messages")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>

            {/* Guide */}
            <Link
              href="/freelancer/guide"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/guide"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Guide
            </Link>

            {/* Financial Overview */}
            <Link
              href="/freelancer/financial-overview"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/financial-overview"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Financial Overview
            </Link>

            {/* Balance History */}
            <Link
              href="/freelancer/balance-history"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/balance-history"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Balance History
            </Link>

            {/* Tier Progress */}
            <Link
              href="/freelancer/progress"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/progress"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Tier Progress
            </Link>

            {/* Client History */}
            <Link
              href="/freelancer/clients"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/clients"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Client History
            </Link>

            {/* Payment Transactions */}
            <Link
              href="/freelancer/payment-transactions"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/payment-transactions"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Transactions
            </Link>

            {/* Revision History */}
            <Link
              href="/freelancer/revision-history"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/revision-history"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <RotateCw className="h-4 w-4" />
              Revision History
            </Link>

            {/* Invoices */}
            <Link
              href="/freelancer/invoices"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/invoices"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Invoices
            </Link>

            {/* Settings */}
            <Link
              href="/freelancer/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/freelancer/settings"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
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

export const FreelancerSidebar = ({ isOpen, onClose }: FreelancerSidebarContentProps) => {
  return (
    <Suspense fallback={
      <aside className="hidden lg:block fixed top-0 left-0 w-56 h-screen bg-[#1a1a2e]">
        <div className="h-14 px-4 flex items-center border-b border-white/10">
          <div className="h-6 w-24 bg-white/10 animate-pulse rounded"></div>
        </div>
      </aside>
    }>
      <FreelancerSidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};
