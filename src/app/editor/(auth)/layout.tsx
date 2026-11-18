"use client";

import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { EditorSidebar } from "@/components/editor-sidebar";
import { MemoAcknowledgementModal } from "@/components/memo-acknowledgement-modal";
import { DailyQuoteBanner } from "@/components/dashboard/daily-quote-banner";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditorLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not editor
  useEffect(() => {
    if (!loading && user && user.role !== 'editor') {
      router.push(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'editor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - pinned on all viewports */}
      <EditorSidebar />
      
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
