"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";

// Global custom event name for triggering the role dialog from anywhere
export const OPEN_ROLE_SELECTION_EVENT = "tasklynk:open-role-selection";

/** Dispatch an event to open the role selection modal from any link or button */
export function openRoleSelectionModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_ROLE_SELECTION_EVENT));
  }
}

interface RoleSelectionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function RoleSelectionDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: RoleSelectionDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [writerHiringOpen, setWriterHiringOpen] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState<"client" | "freelancer" | null>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      setControlledOpen?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (!nextOpen) {
      setSelectedRole(null);
    }
  };

  // Listen to global open event
  React.useEffect(() => {
    const handleGlobalOpen = () => {
      handleOpenChange(true);
    };
    window.addEventListener(OPEN_ROLE_SELECTION_EVENT, handleGlobalOpen);

    // Auto-open modal if ?register=true or #register is in URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (
        url.searchParams.get("register") === "true" ||
        url.searchParams.get("register") === "1" ||
        url.hash === "#register"
      ) {
        handleOpenChange(true);
        // Clean up url parameter cleanly without reload
        url.searchParams.delete("register");
        const cleanUrl = url.pathname + (url.search ? url.search : "");
        window.history.replaceState({}, "", cleanUrl);
      }
    }

    return () => {
      window.removeEventListener(OPEN_ROLE_SELECTION_EVENT, handleGlobalOpen);
    };
  }, []);

  // Fetch whether freelancer onboarding is enabled
  React.useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => setWriterHiringOpen(d?.writer_hiring_enabled !== false))
      .catch(() => setWriterHiringOpen(true));
  }, []);

  const handleNavigate = (path: string, role: "client" | "freelancer") => {
    setSelectedRole(role);
    handleOpenChange(false);
    router.push(path);
  };

  return (
    <>
      {trigger && (
        <span
          onClick={(e) => {
            e.preventDefault();
            handleOpenChange(true);
          }}
          className="inline-block cursor-pointer"
        >
          {trigger}
        </span>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-2xl w-[95vw] p-5 sm:p-7 bg-[#FAF8FD] dark:bg-[#160E28] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-3xl shadow-2xl text-[#22183D] dark:text-white overflow-hidden"
        >
          <DialogHeader className="text-center sm:text-center pb-2">
            <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#5B3594]/10 text-[#5B3594] dark:bg-[#271E42] dark:text-[#EFE8F8] border border-[#5B3594]/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span>Instant Access</span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-[#22183D] dark:text-white">
              Get Started with TaskLynk
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/85 max-w-lg mx-auto">
              Select your account type to proceed to registration
            </DialogDescription>
          </DialogHeader>

          {/* Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {/* Card 1: Client */}
            <div
              onClick={() => handleNavigate("/register/client", "client")}
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1D1533] border-2 border-[#5B3594]/40 hover:border-[#FF7A3D] dark:border-[#5B3594]/60 dark:hover:border-[#FF7A3D] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#683FA8] to-[#5B3A8C] text-white flex items-center justify-center font-bold shadow-md shadow-[#5B3A8C]/25 group-hover:scale-105 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] dark:bg-[#271E42] dark:text-[#EFE8F8] border border-[#5B3594]/20">
                    Hire Specialists
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors">
                    I Want to Order Writing &amp; Analysis
                  </h3>
                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium mt-0.5">
                    Students, Researchers &amp; Organizations
                  </p>
                </div>

                <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  Post your academic, data analysis, or business project and get expert work delivered on time.
                </p>

                <ul className="space-y-1.5 pt-2 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
                  <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                    <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                    <span>Post unlimited orders &amp; get matched fast</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                    <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                    <span>Triple-check editorial quality assurance</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                    <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                    <span>100% plagiarism-free Turnitin reports</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5">
                <Button
                  className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-md shadow-[#FF7A3D]/25 transition-all group-hover:scale-[1.02]"
                  disabled={selectedRole === "client"}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Continue as Client</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            </div>

            {/* Card 2: Professional / Freelancer */}
            {writerHiringOpen ? (
              <div
                onClick={() => handleNavigate("/register/freelancer", "freelancer")}
                className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1D1533] border-2 border-[#DDD3E9] dark:border-[#3A2F5B] hover:border-[#5B3594] dark:hover:border-[#5B3594] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF8C52] to-[#FF7A3D] text-white flex items-center justify-center font-bold shadow-md shadow-[#FF7A3D]/25 group-hover:scale-105 transition-transform">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#FF7A3D]/15 text-[#FF7A3D] border border-[#FF7A3D]/20">
                      Earn as a Specialist
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors">
                      I Want to Work as a Specialist
                    </h3>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium mt-0.5">
                      Academic Writers &amp; Data Analysts
                    </p>
                  </div>

                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                    Join Kenya’s premier network of verified academic writers and statisticians to earn competitive rates.
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
                    <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                      <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                      <span>Access high-value academic orders</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                      <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                      <span>Guaranteed bi-weekly M-Pesa payouts</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 font-medium">
                      <Check className="size-3.5 shrink-0 text-emerald-500 font-bold" />
                      <span>24/7 dedicated support team</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-[#5B3594] hover:bg-[#48267A] text-white shadow-md shadow-[#5B3594]/25 transition-all group-hover:scale-[1.02]"
                    disabled={selectedRole === "freelancer"}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Apply as Specialist</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white/60 dark:bg-[#1D1533]/60 border border-[#DDD3E9] dark:border-[#3A2F5B] opacity-75">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Specialist Applications Closed</h3>
                  <p className="text-xs text-muted-foreground">
                    We are currently not accepting new specialist applications. Please check back later.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% Secure • Escrow Protection • No Hidden Charges</span>
            </div>
            <div>
              <span>Already have an account? </span>
              <Link
                href="/login"
                onClick={() => handleOpenChange(false)}
                className="font-bold text-[#5B3594] dark:text-[#FF7A3D] hover:underline"
              >
                Sign In
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
