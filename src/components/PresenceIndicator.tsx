/**
 * PresenceIndicator Component
 * 
 * Displays online/offline status of users with a colored dot indicator
 * Green = Online, Gray = Offline
 * 
 * Usage:
 * <PresenceIndicator status="online" />
 * <PresenceIndicator userId={userId} /> // Fetches status from API
 */

"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  /** Direct status prop (if already known) */
  status?: 'online' | 'offline';
  /** User ID to fetch status from API */
  userId?: number;
  /** Size of the indicator dot */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label alongside dot */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
  /** Auto-refresh interval in milliseconds (default: 30s) */
  refreshInterval?: number;
}

export function PresenceIndicator({
  status: propStatus,
  userId,
  size = 'md',
  showLabel = false,
  className,
  refreshInterval = 30000,
}: PresenceIndicatorProps) {
  const [status, setStatus] = useState<'online' | 'offline'>(propStatus || 'offline');
  const [loading, setLoading] = useState(!propStatus && !!userId);

  // Fetch presence status from API if userId is provided
  useEffect(() => {
    if (!userId || propStatus) return;

    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/v2/users/${userId}/presence`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data.presenceStatus === 'online' ? 'online' : 'offline');
        }
      } catch (error) {
        console.error('Failed to fetch presence status:', error);
        setStatus('offline');
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();

    // Auto-refresh presence status
    const interval = setInterval(fetchPresence, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, propStatus, refreshInterval]);

  // Use prop status if provided
  useEffect(() => {
    if (propStatus) {
      setStatus(propStatus);
      setLoading(false);
    }
  }, [propStatus]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    online: {
      color: 'bg-green-500',
      label: 'Online',
      ringColor: 'ring-green-400',
    },
    offline: {
      color: 'bg-gray-400',
      label: 'Offline',
      ringColor: 'ring-gray-300',
    },
  };

  const config = statusConfig[status];

  if (loading) {
    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        <div className={cn(
          'rounded-full animate-pulse bg-gray-300',
          sizeClasses[size]
        )} />
        {showLabel && (
          <span className="text-sm text-gray-500">Loading...</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            config.color,
            sizeClasses[size]
          )}
        />
        {status === 'online' && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              config.color
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className={cn(
          'text-sm font-medium',
          status === 'online' ? 'text-green-600' : 'text-gray-500'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * PresenceBadge Component
 * 
 * Alternative badge-style presence indicator
 */
export function PresenceBadge({
  status: propStatus,
  userId,
  className,
}: {
  status?: 'online' | 'offline';
  userId?: number;
  className?: string;
}) {
  const [status, setStatus] = useState<'online' | 'offline'>(propStatus || 'offline');

  useEffect(() => {
    if (!userId || propStatus) return;

    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/v2/users/${userId}/presence`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data.presenceStatus === 'online' ? 'online' : 'offline');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [userId, propStatus]);

  useEffect(() => {
    if (propStatus) setStatus(propStatus);
  }, [propStatus]);

  const badgeClasses = status === 'online'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      badgeClasses,
      className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'online' ? 'bg-green-500' : 'bg-gray-400'
      )} />
      {status === 'online' ? 'Online' : 'Offline'}
    </span>
  );
}
