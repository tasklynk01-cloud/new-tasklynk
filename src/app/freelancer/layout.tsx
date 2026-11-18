"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { FreelancerSidebar } from "@/components/freelancer-sidebar";
import { BlockingOrderConfirmationModal } from "@/components/freelancer/BlockingOrderConfirmationModal";
import { MemoAcknowledgementModal } from "@/components/memo-acknowledgement-modal";
import { DailyQuoteBanner } from "@/components/dashboard/daily-quote-banner";
import { FreelancerProfileActivationBanner } from "@/components/freelancer/profile-activation-banner";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter } from "next/navigation";

export default function FreelancerLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Always render BlockingOrderConfirmationModal to prevent React Error #310
  // Pass null as freelancerId when conditions aren't met
  const freelancerId = (user && user.role === 'freelancer' && user.approved) ? user.id : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - pinned on all viewports */}
      <FreelancerSidebar />
      
      {/* Top navbar - aligned with fixed sidebar */}
      <DashboardNav sidebarOpen />
      
      {/* Blocking Order Confirmation Modal - Always render to prevent hook order issues */}
      <BlockingOrderConfirmationModal 
        key={refreshKey}
        freelancerId={freelancerId} 
        onOrderConfirmed={() => {
          // Refresh page data to show updated order status without full reload
          setRefreshKey(prev => prev + 1);
          router.refresh();
        }}
      />
      
      {/* Memo Acknowledgement Modal */}
      <MemoAcknowledgementModal />
      
      {/* Main content area */}
      <main className="pt-14 ml-0 lg:ml-56 min-h-screen bg-background transition-all duration-300">
        <div className="space-y-4 p-4 lg:p-6">
          <DailyQuoteBanner />
          <FreelancerProfileActivationBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
