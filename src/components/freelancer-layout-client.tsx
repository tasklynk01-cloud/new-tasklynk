"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { useAuth } from "@/lib/auth-context-v2";
import { BlockingOrderConfirmationModal } from "@/components/freelancer/BlockingOrderConfirmationModal";
import { MemoAcknowledgementModal } from "@/components/memo-acknowledgement-modal";

type FreelancerLayoutClientProps = {
  children: ReactNode;
  renderSidebar: (props: { isOpen?: boolean; onClose: () => void }) => ReactNode;
};

/**
 * Client Component wrapper specific to Freelancer layout
 * Handles auth-dependent modals and components
 */
export function FreelancerLayoutClient({ 
  children, 
  renderSidebar 
}: FreelancerLayoutClientProps) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Determine if we should show the blocking modal
  // Always render the modal to avoid hook order issues, but pass null freelancerId if conditions aren't met
  const shouldShowBlockingModal = user && user.role === 'freelancer' && user.approved;
  const freelancerId = shouldShowBlockingModal ? user.id : null;

  return (
    <DashboardLayoutClient
      renderSidebar={renderSidebar}
      modals={
        <>
          {/* Blocking Order Confirmation Modal - always rendered to maintain hook order */}
          <BlockingOrderConfirmationModal 
            key={refreshKey}
            freelancerId={freelancerId} 
            onOrderConfirmed={() => {
              // Refresh page to show updated order status
              setRefreshKey(prev => prev + 1);
              window.location.reload();
            }}
          />
          
          {/* Memo Acknowledgement Modal */}
          <MemoAcknowledgementModal />
        </>
      }
    >
      {children}
    </DashboardLayoutClient>
  );
}

