"use client";

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  isExpired: boolean;
  isNearDeadline: boolean;
  isCritical: boolean; // Less than 6 hours
  totalHours: number;
}

interface ProminentCountdownTimerProps {
  deadline: string | Date;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSeconds?: boolean;
  colorScheme?: 'default' | 'purple' | 'green' | 'amber';
  orderStatus?: string;
  compact?: boolean;
}

const calculateTimeRemaining = (deadline: string | Date, baseTime?: Date): CountdownState => {
  // Use baseTime if provided (for offline mode), otherwise use current time
  const now = baseTime ? baseTime.getTime() : new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const difference = deadlineTime - now;

  if (difference <= 0) {
    const overdueDiff = Math.abs(difference);
    return {
      days: Math.floor(overdueDiff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((overdueDiff % (1000 * 60)) / 1000),
      isOverdue: true,
      isExpired: true,
      isNearDeadline: false,
      isCritical: false,
      totalHours: -Math.floor(overdueDiff / (1000 * 60 * 60)),
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  const totalHours = Math.floor(difference / (1000 * 60 * 60));

  return {
    days,
    hours,
    minutes,
    seconds,
    isOverdue: false,
    isExpired: false,
    isNearDeadline: totalHours <= 24, // Less than 24 hours
    isCritical: totalHours < 6, // Less than 6 hours - CRITICAL
    totalHours,
  };
};

export function ProminentCountdownTimer({
  deadline,
  label = 'Deadline',
  size = 'xl',
  showSeconds = false,
  colorScheme = 'default',
  orderStatus,
  compact = false,
}: ProminentCountdownTimerProps) {
  // Validate deadline
  if (!deadline) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50 dark:bg-gray-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              No deadline set
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Store deadline in localStorage for offline support
  const storageKey = `prominent_deadline_${deadline}`;
  
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

  const getInitialTime = () => {
    const stored = getStoredTime();
    return stored;
  };

  const [timeRemaining, setTimeRemaining] = useState<CountdownState>(() => 
    calculateTimeRemaining(deadline, getInitialTime())
  );
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [baseTime, setBaseTime] = useState(() => getInitialTime());

  useEffect(() => {
    // Store current time periodically for offline use
    const storeTime = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, new Date().toISOString());
        setBaseTime(new Date());
      }
    };

    // Update immediately on mount and when deadline changes
    storeTime();
    setTimeRemaining(calculateTimeRemaining(deadline, baseTime));
    
    // Set up interval to update every second
    const timer = setInterval(() => {
      let currentBaseTime = baseTime;
      if (isOnline) {
        const now = new Date();
        storeTime();
        setBaseTime(now);
        currentBaseTime = now;
      } else {
        // When offline, calculate elapsed time from stored time
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const storedTime = new Date(stored);
          const elapsed = Date.now() - storedTime.getTime();
          currentBaseTime = new Date(Date.now() - elapsed);
        }
      }
      // Calculate using current base time
      setTimeRemaining(calculateTimeRemaining(deadline, currentBaseTime));
    }, 1000);

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setBaseTime(new Date());
      setTimeRemaining(calculateTimeRemaining(deadline));
    };
    const handleOffline = () => {
      setIsOnline(false);
      // When offline, continue counting from stored time
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedTime = new Date(stored);
        setBaseTime(storedTime);
        // Recalculate with stored time
        setTimeRemaining(calculateTimeRemaining(deadline, storedTime));
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
  }, [deadline, storageKey]);

  // Don't show timer for completed/cancelled orders
  if (orderStatus && ['completed', 'cancelled', 'closed', 'paid'].includes(orderStatus.toLowerCase())) {
    return (
      <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900 dark:text-green-100 capitalize">
              {orderStatus}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Size configurations - optimized for compact display
  const sizeConfig = {
    sm: {
      card: 'py-1.5 px-2',
      icon: 'w-4 h-4',
      label: 'text-xs',
      time: 'text-sm',
      unit: 'text-[10px]',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      card: 'py-2 px-3',
      icon: 'w-3.5 h-3.5',
      label: 'text-xs',
      time: 'text-base',
      unit: 'text-[10px]',
      badge: 'text-xs px-1.5 py-0.5',
    },
    lg: {
      card: 'py-2.5 px-3',
      icon: 'w-4 h-4',
      label: 'text-xs',
      time: 'text-lg',
      unit: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
    xl: {
      card: 'py-3 px-4',
      icon: 'w-4 h-4',
      label: 'text-sm',
      time: 'text-xl',
      unit: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
  };

  const config = sizeConfig[size];

  // Color scheme based on status and scheme preference
  let bgColor = 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30';
  let borderColor = 'border-blue-300 dark:border-blue-700';
  let textColor = 'text-blue-900 dark:text-blue-100';
  let iconColor = 'text-blue-600 dark:text-blue-400';
  let badgeColor = 'bg-primary text-primary-foreground';

  if (timeRemaining.isOverdue) {
    bgColor = 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30';
    borderColor = 'border-red-400 dark:border-red-700 animate-pulse';
    textColor = 'text-red-900 dark:text-red-100';
    iconColor = 'text-red-600 dark:text-red-400 animate-pulse';
    badgeColor = 'bg-red-600 text-primary-foreground animate-pulse';
  } else if (timeRemaining.isCritical) {
    // CRITICAL: Less than 6 hours - RED with BLINKING
    bgColor = 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 animate-pulse';
    borderColor = 'border-red-500 dark:border-red-600 animate-pulse';
    textColor = 'text-red-900 dark:text-red-100';
    iconColor = 'text-red-600 dark:text-red-400 animate-pulse';
    badgeColor = 'bg-red-600 text-primary-foreground animate-pulse';
  } else if (timeRemaining.isNearDeadline) {
    bgColor = 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30';
    borderColor = 'border-amber-400 dark:border-amber-700';
    textColor = 'text-amber-900 dark:text-amber-100';
    iconColor = 'text-amber-600 dark:text-amber-400';
    badgeColor = 'bg-amber-600 text-primary-foreground';
  } else {
    // Apply custom color scheme
    if (colorScheme === 'purple') {
      bgColor = 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30';
      borderColor = 'border-purple-300 dark:border-purple-700';
      textColor = 'text-purple-900 dark:text-purple-100';
      iconColor = 'text-purple-600 dark:text-purple-400';
      badgeColor = 'bg-purple-600 text-primary-foreground';
    } else if (colorScheme === 'green') {
      bgColor = 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30';
      borderColor = 'border-green-300 dark:border-green-700';
      textColor = 'text-green-900 dark:text-green-100';
      iconColor = 'text-green-600 dark:text-green-400';
      badgeColor = 'bg-green-600 text-primary-foreground';
    } else if (colorScheme === 'amber') {
      bgColor = 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30';
      borderColor = 'border-amber-300 dark:border-amber-700';
      textColor = 'text-amber-900 dark:text-amber-100';
      iconColor = 'text-amber-600 dark:text-amber-400';
      badgeColor = 'bg-amber-600 text-primary-foreground';
    }
  }

  if (compact) {
    return (
      <Badge className={`${badgeColor} font-medium ${config.badge} flex items-center gap-1`}>
        <Clock className="w-4 h-4" />
        {timeRemaining.isOverdue ? (
          <span>Overdue by {timeRemaining.days}d {timeRemaining.hours}h</span>
        ) : (
          <span>
            {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Card className={`border ${borderColor} ${bgColor}`}>
      <CardContent className={config.card}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {timeRemaining.isOverdue ? (
              <AlertCircle className={`${config.icon} ${iconColor}`} />
            ) : (
              <Clock className={`${config.icon} ${iconColor}`} />
            )}
            <span className={`font-medium ${config.label} ${textColor}`}>
              {label}
            </span>
          </div>
          
          {timeRemaining.isOverdue && (
            <Badge className={`${badgeColor} font-bold ${config.badge}`}>
              OVERDUE
            </Badge>
          )}
          
          {!timeRemaining.isOverdue && timeRemaining.isCritical && (
            <Badge className={`${badgeColor} font-bold ${config.badge}`}>
              CRITICAL
            </Badge>
          )}
          
          {!timeRemaining.isOverdue && !timeRemaining.isCritical && timeRemaining.isNearDeadline && (
            <Badge className={`${badgeColor} font-bold ${config.badge}`}>
              URGENT
            </Badge>
          )}
        </div>

        {/* Countdown Display - Inline compact */}
        <div className="flex items-baseline justify-center gap-1.5">
          {/* Days */}
          {(timeRemaining.days > 0 || timeRemaining.isOverdue) && (
            <>
              <span className={`font-bold ${config.time} ${textColor} tabular-nums`}>
                {timeRemaining.days}
              </span>
              <span className={`${config.unit} text-muted-foreground mr-1`}>
                {timeRemaining.days === 1 ? 'day' : 'days'}
              </span>
            </>
          )}

          {/* Hours */}
          <span className={`font-bold ${config.time} ${textColor} tabular-nums`}>
            {String(timeRemaining.hours).padStart(2, '0')}
          </span>
          <span className={`${config.unit} text-muted-foreground mr-1`}>
            {timeRemaining.hours === 1 ? 'hr' : 'hrs'}
          </span>

          {/* Minutes */}
          <span className={`font-bold ${config.time} ${textColor} tabular-nums`}>
            {String(timeRemaining.minutes).padStart(2, '0')}
          </span>
          <span className={`${config.unit} text-muted-foreground`}>
            min
          </span>

          {/* Seconds (optional) */}
          {showSeconds && (
            <>
              <span className={`font-bold ${config.time} ${textColor} tabular-nums ml-1`}>
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className={`${config.unit} text-muted-foreground`}>
                sec
              </span>
            </>
          )}
        </div>

        {/* Status Message - compact */}
        <div className="text-center mt-1">
          {timeRemaining.isOverdue ? (
            <p className={`text-[10px] font-medium text-red-700 dark:text-red-300`}>
              {Math.abs(timeRemaining.totalHours)} hours past deadline
            </p>
          ) : timeRemaining.isCritical ? (
            <p className={`text-[10px] font-bold text-red-700 dark:text-red-300 animate-pulse`}>
              Less than 6 hours!
            </p>
          ) : timeRemaining.isNearDeadline ? (
            <p className={`text-[10px] font-medium text-amber-700 dark:text-amber-300`}>
              Less than 24 hours!
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface DualCountdownTimerProps {
  clientDeadline: string | Date;
  freelancerDeadline: string | Date;
  orderStatus?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DualCountdownTimer({
  clientDeadline,
  freelancerDeadline,
  orderStatus,
  size = 'md',
}: DualCountdownTimerProps) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <ProminentCountdownTimer
        deadline={clientDeadline}
        label="Client Deadline"
        size={size}
        colorScheme="purple"
        orderStatus={orderStatus}
      />
      <ProminentCountdownTimer
        deadline={freelancerDeadline}
        label="Writer Deadline"
        size={size}
        colorScheme="green"
        orderStatus={orderStatus}
      />
    </div>
  );
}
