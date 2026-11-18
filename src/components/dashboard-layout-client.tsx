"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

type DashboardLayoutClientProps = {
  children: ReactNode;
  renderSidebar: (props: { isOpen?: boolean; onClose: () => void }) => ReactNode;
  modals?: ReactNode;
};

/**
 * Client Component wrapper for dashboard layouts
 * Handles interactive sidebar toggle state and navigation
 * This allows parent layouts to remain Server Components
 * 
 * Mobile: Sidebar hidden by default, toggles on menu click or bottom nav click
 * Desktop: Sidebar visible by default (controlled by CSS lg:translate-x-0)
 */
export function DashboardLayoutClient({ 
  children, 
  renderSidebar,
  modals 
}: DashboardLayoutClientProps) {
  // Sidebar state: 
  // - undefined/false = hidden on mobile, visible on desktop (via CSS lg:translate-x-0)
  // - true = explicitly open (visible on all screen sizes)
  const [sidebarOpen, setSidebarOpen] = useState<boolean | undefined>(undefined);

  // Track if we're on mobile for proper state management
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine if sidebar should appear visible to the nav component
  // On desktop, sidebar is always visible (CSS handles it)
  // On mobile, only show when explicitly true
  const isSidebarVisible = isMobile ? sidebarOpen === true : true;

  const handleMenuClick = () => {
    setSidebarOpen(prev => {
      if (prev === true) {
        return false; // Close
      } else {
        return true;  // Open
      }
    });
  };

  const handleClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - full height from top */}
      {renderSidebar({ 
        isOpen: sidebarOpen, 
        onClose: handleClose
      })}
      
      {/* Top navbar - pushed right on desktop */}
      <DashboardNav 
        onMenuClick={handleMenuClick}
        sidebarOpen={isSidebarVisible}
      />
      
      {/* Additional modals/components */}
      {modals}
      
      {/* Main content area: standardized to lg:ml-56 and safe bottom space for mobile navigation */}
      <main className="pt-14 ml-0 lg:ml-56 pb-24 lg:pb-8 min-h-screen bg-background transition-all duration-300">
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Modern Mobile Bottom Navigation Bar for Phone Users */}
      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayoutClient;
