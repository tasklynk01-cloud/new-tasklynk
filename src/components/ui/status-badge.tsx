/**
 * StatusBadge Component
 * Unified status badge for consistent display across all pages
 */

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  getUserDisplayStatus,
  getStatusIcon,
  type StatusUser,
} from '@/lib/user-status';

interface StatusBadgeProps {
  user: StatusUser;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function StatusBadge({
  user,
  size = 'default',
  showIcon = true,
  showDescription = false,
  className = '',
}: StatusBadgeProps) {
  const displayStatus = getUserDisplayStatus(user);
  const icon = showIcon ? getStatusIcon(displayStatus.color) + ' ' : '';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 h-5',
    default: 'text-xs px-2 py-0.5 h-6',
    lg: 'text-sm px-3 py-1 h-8',
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <Badge
        variant={displayStatus.variant}
        className={`${sizeClasses[size]} ${className}`}
      >
        {icon}{displayStatus.label}
      </Badge>
      {showDescription && displayStatus.description && (
        <span className="text-xs text-muted-foreground">
          {displayStatus.description}
        </span>
      )}
    </div>
  );
}

/**
 * Compact status indicator (just colored dot + text)
 */
export function StatusIndicator({ user }: { user: StatusUser }) {
  const displayStatus = getUserDisplayStatus(user);
  
  const dotColors = {
    green: 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="inline-flex items-center gap-3">
      <span
        className={`w-2 h-2 rounded-full ${dotColors[displayStatus.color]}`}
        aria-label={displayStatus.label}
      />
      <span className="text-sm">{displayStatus.label}</span>
    </div>
  );
}

/**
 * Status card for user profile pages
 */
export function StatusCard({ user }: { user: StatusUser }) {
  const displayStatus = getUserDisplayStatus(user);
  const icon = getStatusIcon(displayStatus.color);

  const bgColors = {
    green: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    gray: 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800',
  };

  const textColors = {
    green: 'text-green-900 dark:text-green-100',
    yellow: 'text-yellow-900 dark:text-yellow-100',
    red: 'text-red-900 dark:text-red-100',
    gray: 'text-gray-900 dark:text-gray-100',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${bgColors[displayStatus.color]}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColors[displayStatus.color]}`}>
            {displayStatus.label}
          </h3>
          {displayStatus.description && (
            <p className={`text-sm ${textColors[displayStatus.color]} opacity-80`}>
              {displayStatus.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
