"use client";

import { Bell, BellRing, Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderPushNotifications } from '@/hooks/use-order-push-notifications';
import { useState, useEffect } from 'react';

interface PushNotificationBannerProps {
  userId?: number;
}

export function PushNotificationBanner({ userId }: PushNotificationBannerProps) {
  const { isSupported, permission, enabled, requestPermission } = useOrderPushNotifications(userId);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('tasklynk_push_banner_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (!isSupported || enabled || permission === 'denied' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('tasklynk_push_banner_dismissed', 'true');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-blue-500/10 to-purple-500/15 border border-primary/25 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-primary">Specialist Order Radar</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">New</span>
            </div>
            <p className="text-sm font-bold text-foreground truncate mt-0.5">
              Enable Instant Push Alerts for High-Value Orders
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Get immediate browser alerts when new assignments matching your discipline or high-paying deliverables are posted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => requestPermission()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-9 px-4 text-xs shadow-md shadow-primary/20 flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Radar</span>
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
