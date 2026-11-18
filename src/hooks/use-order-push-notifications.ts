"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useOrderPushNotifications(userId?: number) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      const saved = localStorage.getItem('tasklynk_push_enabled');
      if (saved === 'true' && Notification.permission === 'granted') {
        setEnabled(true);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Browser push notifications are not supported on this device');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setEnabled(true);
        localStorage.setItem('tasklynk_push_enabled', 'true');
        
        // Show test greeting notification
        new Notification('TaskLynk Specialist Radar Active 🚀', {
          body: 'You will now receive instant desktop alerts when high-value orders are posted!',
          icon: '/favicon.ico',
        });
        toast.success('Push notifications activated!');
        return true;
      } else {
        setEnabled(false);
        localStorage.setItem('tasklynk_push_enabled', 'false');
        toast.info('Notifications permission was not granted');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [isSupported]);

  const sendOrderPushAlert = useCallback((order: {
    id: number;
    title: string;
    displayId?: string;
    amount?: number;
    earnings?: number;
    workType?: string;
  }) => {
    if (!enabled || Notification.permission !== 'granted') return;

    const earningsFormatted = order.earnings ? `KSh ${order.earnings.toLocaleString()}` : '';
    const title = `🔥 High-Value Order: ${order.displayId || `#${order.id}`}`;
    const body = `${order.title}\n${order.workType || 'Academic'} • Est. ${earningsFormatted}`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `order-${order.id}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/freelancer/orders/${order.id}`;
    };
  }, [enabled]);

  return {
    isSupported,
    permission,
    enabled,
    requestPermission,
    sendOrderPushAlert,
  };
}
