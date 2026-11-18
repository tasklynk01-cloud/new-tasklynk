"use client";

import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { AdminSidebar } from "@/components/admin-sidebar";
import { MemoAcknowledgementModal } from "@/components/memo-acknowledgement-modal";
import { DailyQuoteBanner } from "@/components/dashboard/daily-quote-banner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - pinned on all viewports */}
      <AdminSidebar />
      
      {/* Top navbar - stays aligned with fixed sidebar */}
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
