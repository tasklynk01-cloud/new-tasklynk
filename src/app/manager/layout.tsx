"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { ManagerSidebar } from "@/components/manager-sidebar";
import { MemoAcknowledgementModal } from "@/components/memo-acknowledgement-modal";
import { DailyQuoteBanner } from "@/components/dashboard/daily-quote-banner";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The invite-only registration page is public and has its own full-page
  // auth shell - it must not inherit the dashboard sidebar/nav chrome.
  if (pathname?.startsWith("/manager/register")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - pinned on all viewports */}
      <ManagerSidebar />

      {/* Top navbar - aligned with fixed sidebar */}
      <DashboardNav sidebarOpen />

      {/* Memo Acknowledgement Modal */}
      <MemoAcknowledgementModal />

      {/* Main content area */}
      <main className="pt-14 ml-0 lg:ml-56 min-h-screen bg-background transition-all duration-300">
        <div className="space-y-4 p-4 lg:p-6">
          <DailyQuoteBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
