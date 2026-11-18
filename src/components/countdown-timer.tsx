"use client";

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

type CountdownTimerProps = {
  deadline: string;
  label?: string;
  colorScheme?: 'green' | 'purple' | 'auto';
  className?: string;
  showIcon?: boolean;
  status?: string;
};

export function CountdownTimer({ 
  deadline, 
  label, 
  colorScheme = 'auto',
  className = '',
  showIcon = true,
  status
}: CountdownTimerProps) {
  // Store deadline in localStorage for offline support
  const storageKey = `deadline_${deadline}`;
  
  // Initialize with stored time or current time
  const getStoredTime = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedTime = new Date(stored);
        const now = new Date();
        // Use stored time if it's recent (within last hour), otherwise use current time
        if (Math.abs(now.getTime() - storedTime.getTime()) < 3600000) {
          return storedTime;
        }
      }
    }
    return new Date();
  };

  const [currentTime, setCurrentTime] = useState(() => getStoredTime());
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Store current time periodically for offline use
    const storeTime = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, new Date().toISOString());
      }
    };

    // Update immediately
    const now = new Date();
    setCurrentTime(now);
    storeTime();
    
    // Set up interval to update every second
    const timer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      storeTime();
    }, 1000);

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setCurrentTime(new Date());
    };
    const handleOffline = () => {
      setIsOnline(false);
      // When offline, use stored time and calculate from there
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedTime = new Date(stored);
        const elapsed = Date.now() - storedTime.getTime();
        setCurrentTime(new Date(Date.now() - elapsed));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [deadline, storageKey]); // Re-run when deadline changes

  // If completed, show green badge
  if (status === 'completed') {
    return (
      <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="font-bold">Completed</span>
      </div>
    );
  }

  // If delivered, show completed badge (no red)
  if (status === 'delivered') {
    return (
      <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="font-bold">Delivered</span>
      </div>
    );
  }

  const getCountdownData = () => {
    const due = new Date(deadline);
    // When offline, calculate based on stored time and elapsed time
    let timeToUse = currentTime;
    if (!isOnline && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedTime = new Date(stored);
        const elapsed = Date.now() - storedTime.getTime();
        timeToUse = new Date(Date.now() - elapsed);
      }
    }
    
    const diffMs = due.getTime() - timeToUse.getTime();
    
    if (diffMs <= 0) {
      return { 
        text: 'Overdue', 
        expired: true,
        belowTwelveHours: true,
        totalHours: 0
      };
    }
    
    const totalHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Always show days, hours, minutes format
    let text = '';
    if (diffDays > 0) {
      text = `${diffDays}d ${diffHours}h ${diffMins}m`;
    } else if (diffHours > 0) {
      text = `${diffHours}h ${diffMins}m`;
    } else {
      text = `${diffMins}m`;
    }
    
    return { 
      text, 
      expired: false,
      belowTwelveHours: totalHours < 12,
      totalHours
    };
  };

  const countdown = getCountdownData();
  
  // Determine color based on scheme
  let textColor = '';
  let bgColor = '';
  
  if (countdown.expired) {
    textColor = 'text-red-700 dark:text-red-300';
    bgColor = 'bg-red-100 dark:bg-red-950';
  } else if (countdown.belowTwelveHours) {
    textColor = 'text-red-700 dark:text-red-300';
    bgColor = 'bg-red-100 dark:bg-red-950';
  } else {
    if (colorScheme === 'purple') {
      textColor = 'text-purple-700 dark:text-purple-300';
      bgColor = 'bg-purple-100 dark:bg-purple-950';
    } else if (colorScheme === 'green') {
      textColor = 'text-green-700 dark:text-green-300';
      bgColor = 'bg-green-100 dark:bg-green-950';
    } else {
      textColor = 'text-green-700 dark:text-green-300';
      bgColor = 'bg-green-100 dark:bg-green-950';
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${bgColor} ${textColor} ${className}`}>
      {showIcon && <Clock className="w-3.5 h-3.5" />}
      {label && <span className="font-medium">{label}:</span>}
      <span className="font-semibold">{countdown.text}</span>
      {!countdown.expired && (
        <span className="text-[10px] opacity-75">remaining</span>
      )}
    </div>
  );
}
