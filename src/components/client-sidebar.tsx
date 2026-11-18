"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { unwrapOrderList } from "@/lib/client-api-helpers";
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  Clock, 
  PackageCheck, 
  RotateCcw, 
  XCircle,
  ChevronDown,
  ChevronRight,
  Wallet,
  PauseCircle,
  BadgeCheck,
  Receipt,
  Users,
  Calculator
} from "lucide-react";
import { useAuth } from "@/lib/auth-context-v2";
import { useState, useEffect, Suspense } from "react";
import { useSidebarMobile } from "@/hooks/useSidebarMobile";

type ClientSidebarContentProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function ClientSidebarContent({ isOpen: propIsOpen, onClose }: ClientSidebarContentProps) {
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

  // Helper function for dropdown item classes
  const getDropdownItemClasses = (path: string) => {
    const baseClasses = "w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded text-xs text-left transition-all";
    const activeClasses = "text-accent-orange bg-accent-orange/10";
    const inactiveClasses = "text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent-orange/10";
    // Special case for All Orders which should be active for both /client/orders and /client/jobs
    const isActiveItem = path === "/client/orders"
      ? (isActive("/client/orders") || isActive("/client/jobs"))
      : isActive(path);
    return `${baseClasses} ${isActiveItem ? activeClasses : inactiveClasses}`;
  };

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

  const isOrdersPath = pathname.startsWith("/client/orders") ||
                       pathname.startsWith("/client/jobs") || 
                       pathname.startsWith("/client/pending") || 
                       pathname.startsWith("/client/in-progress") ||
                       pathname.startsWith("/client/delivered") ||
                       pathname.startsWith("/client/accepted") ||
                       pathname.startsWith("/client/approved") ||
                       pathname.startsWith("/client/paid") ||
                       pathname.startsWith("/client/completed") ||
                       pathname.startsWith("/client/cancelled") ||
                       pathname.startsWith("/client/on-hold") ||
                       pathname.startsWith("/client/revisions");
  const [ordersOpen, setOrdersOpen] = useState<boolean>(isOrdersPath);
  
  // State for order counts
  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    inProgress: 0,
    onHold: 0,
    delivered: 0,
    accepted: 0,
    revisions: 0,
    paid: 0,
    completed: 0,
    cancelled: 0,
    approved: 0,
  });

  // Fetch order counts - OPTIMIZED: uses fast aggregate endpoint & pauses when tab is hidden
  useEffect(() => {
    if (!user || (user.role !== "client" && user.role !== "account_owner")) return;
    
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
            inProgress: (counts.inProgress ?? 0) + (counts.editing ?? 0),
            onHold: counts.onHold ?? 0,
            delivered: counts.delivered ?? 0,
            accepted: counts.accepted ?? 0,
            revisions: counts.revisions ?? counts.revision ?? 0,
            paid: counts.paid ?? 0,
            completed: counts.completed ?? 0,
            cancelled: counts.cancelled ?? 0,
            approved: counts.approved ?? 0,
          });
        }
      } catch (error) {
        console.error('[Client Sidebar] Failed to fetch order counts:', error);
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

  if (!user || (user.role !== "client" && user.role !== "account_owner")) return null;

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
          <Link href="/client/dashboard" className="flex items-center">
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Client</p>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
            {(user.clientId || user.id) && (
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">#{user.clientId || user.id}</span>
            )}
          </div>
          {user.accountName && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.accountName}</p>
          )}
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
              href="/client/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/dashboard"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>

            {/* New Job */}
            <Link
              href="/client/new-job"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/new-job"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              New Job
            </Link>

            {/* Pricing Calculator */}
            <Link
              href="/client/pricing-calculator"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/pricing-calculator"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" />
              Price Estimate
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
                  <FileText className="h-4 w-4" />
                  Orders
                </span>
                {ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              
              {ordersOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                  <button 
                    onClick={() => router.push("/client/orders")} 
                    className={getDropdownItemClasses("/client/orders")}
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="h-3 w-3" /> All Orders
                    </span>
                    {(orderCounts.pending + orderCounts.inProgress + orderCounts.onHold + orderCounts.delivered + orderCounts.accepted + orderCounts.approved + orderCounts.revisions + orderCounts.paid + orderCounts.completed + orderCounts.cancelled) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        {orderCounts.pending + orderCounts.inProgress + orderCounts.onHold + orderCounts.delivered + orderCounts.accepted + orderCounts.approved + orderCounts.revisions + orderCounts.paid + orderCounts.completed + orderCounts.cancelled}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/pending")} 
                    className={getDropdownItemClasses("/client/pending")}
                  >
                    <span className="flex items-center gap-3">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                    {orderCounts.pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {orderCounts.pending}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/in-progress")} 
                    className={getDropdownItemClasses("/client/in-progress")}
                  >
                    <span className="flex items-center gap-3">
                      <Clock className="h-3 w-3" /> In Progress
                    </span>
                    {orderCounts.inProgress > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {orderCounts.inProgress}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/on-hold")} 
                    className={getDropdownItemClasses("/client/on-hold")}
                  >
                    <span className="flex items-center gap-3">
                      <PauseCircle className="h-3 w-3" /> On Hold
                    </span>
                    {orderCounts.onHold > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {orderCounts.onHold}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/delivered")}
                    className={getDropdownItemClasses("/client/delivered")}
                  >
                    <span className="flex items-center gap-3">
                      <PackageCheck className="h-3 w-3" /> Delivered
                    </span>
                    {orderCounts.delivered > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {orderCounts.delivered}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/accepted")} 
                    className={getDropdownItemClasses("/client/accepted")}
                  >
                    <span className="flex items-center gap-3">
                      <BadgeCheck className="h-3 w-3" /> Accepted
                    </span>
                    {orderCounts.accepted > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {orderCounts.accepted}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/approved")} 
                    className={getDropdownItemClasses("/client/approved")}
                  >
                    <span className="flex items-center gap-3">
                      <CheckCircle className="h-3 w-3" /> Approved
                    </span>
                    {orderCounts.approved > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {orderCounts.approved}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/revisions")} 
                    className={getDropdownItemClasses("/client/revisions")}
                  >
                    <span className="flex items-center gap-3">
                      <RotateCcw className="h-3 w-3" /> Revisions
                    </span>
                    {orderCounts.revisions > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {orderCounts.revisions}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/paid")}
                    className={getDropdownItemClasses("/client/paid")}
                  >
                    <span className="flex items-center gap-3">
                      <Receipt className="h-3 w-3" /> Paid
                    </span>
                    {orderCounts.paid > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                        {orderCounts.paid}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/completed")} 
                    className={getDropdownItemClasses("/client/completed")}
                  >
                    <span className="flex items-center gap-3">
                      <CheckCircle className="h-3 w-3" /> Completed
                    </span>
                    {orderCounts.completed > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                        {orderCounts.completed}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push("/client/cancelled")}
                    className={getDropdownItemClasses("/client/cancelled")}
                  >
                    <span className="flex items-center gap-3">
                      <XCircle className="h-3 w-3" /> Cancelled
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

            {/* Processing Invoices */}
            <Link
              href="/client/processing-invoices"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/processing-invoices"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Processing Invoices
            </Link>

            {/* Financial Overview */}
            <Link
              href="/client/financial-overview"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/financial-overview"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Financial Overview
            </Link>

            {/* Messages */}
            <Link
              href="/client/messages"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/client/messages")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>

            {/* My Freelancers */}
            <Link
              href="/client/my-freelancers"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/my-freelancers"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              My Freelancers
            </Link>

            {/* Settings */}
            <Link
              href="/client/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/client/settings"
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

export const ClientSidebar = ({ isOpen, onClose }: ClientSidebarContentProps) => {
  return (
    <Suspense
      fallback={
        <aside className="hidden lg:block fixed top-0 left-0 w-56 h-screen bg-[#1a1a2e]">
          <div className="h-14 px-4 flex items-center border-b border-white/10">
            <div className="h-6 w-24 bg-white/10 animate-pulse rounded"></div>
          </div>
        </aside>
      }
    >
      <ClientSidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};
