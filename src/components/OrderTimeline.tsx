"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Send,
  User,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: number;
  orderId: number;
  eventType: string;
  description: string;
  actorId: number | null;
  actorName: string | null;
  actorRole: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface OrderTimelineProps {
  orderId: number;
  filterClientVisible?: boolean;
  showActorDetails?: boolean;
  compact?: boolean;
  maxEvents?: number;
  defaultCollapsed?: boolean;
}

// Professional, subtle color palette
const EVENT_CONFIG = {
  order_created: { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Created' },
  order_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Approved' },
  freelancer_assigned: { icon: User, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/30', label: 'Assigned' },
  freelancer_accepted: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Accepted' },
  freelancer_rejected: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', label: 'Rejected' },
  work_submitted: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'Submitted' },
  internal_revision_requested: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'QC Review' },
  internal_revision_submitted: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'QC Updated' },
  internal_revision_accepted: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'QC Passed' },
  delivered_to_client: { icon: Send, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/30', label: 'Delivered' },
  client_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Client OK' },
  client_revision_requested: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Revision' },
  payment_confirmed: { icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Paid' },
  order_completed: { icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Completed' },
  order_cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', label: 'Cancelled' },
  order_on_hold: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'On Hold' },
  default: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', label: 'Event' },
} as const;

const INTERNAL_EVENTS = [
  'internal_revision_requested',
  'internal_revision_submitted',
  'internal_revision_accepted',
];

export default function OrderTimeline({
  orderId,
  filterClientVisible = false,
  showActorDetails = true,
  compact = false,
  maxEvents,
  defaultCollapsed = false,
}: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    fetchTimeline();
  }, [orderId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(
        `/api/v2/orders/${orderId}/timeline`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let fetchedEvents = data.events || [];

        if (filterClientVisible) {
          fetchedEvents = fetchedEvents.filter(
            (e: TimelineEvent) => !INTERNAL_EVENTS.includes(e.eventType)
          );
        }

        if (maxEvents) {
          fetchedEvents = fetchedEvents.slice(0, maxEvents);
        }

        setEvents(fetchedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventConfig = (eventType: string) => {
    return EVENT_CONFIG[eventType as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.default;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading skeleton - minimal
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading activity...</span>
      </div>
    );
  }

  // Empty state - minimal
  if (events.length === 0) {
    return (
      <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>No activity yet</span>
      </div>
    );
  }

  // Ultra-compact inline variant
  if (compact) {
    return (
      <div className="space-y-1">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Clock className="w-4 h-4" />
          <span>Activity ({events.length})</span>
          {collapsed ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronUp className="w-4 h-4 ml-auto" />}
        </button>
        
        {!collapsed && (
          <div className="pl-1 space-y-0.5">
            {events.slice(0, 5).map((event) => {
              const config = getEventConfig(event.eventType);
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 text-xs py-0.5"
                >
                  <div className={cn('w-4 h-4 rounded flex items-center justify-center flex-shrink-0', config.bg)}>
                    <Icon className={cn('w-2.5 h-2.5', config.color)} />
                  </div>
                  <span className="font-medium text-foreground">{config.label}</span>
                  <span className="text-muted-foreground ml-auto">{formatTimestamp(event.createdAt)}</span>
                </div>
              );
            })}
            {events.length > 5 && (
              <p className="text-xs text-muted-foreground pl-6">+{events.length - 5} more</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standard timeline - polished, compact
  return (
    <Card className="shadow-sm border">
      <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <CardTitle className="text-xs font-semibold">Activity</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 h-4">
            {events.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative py-1">
          {/* Subtle vertical line */}
          <div className="absolute left-[15px] top-1 bottom-1 w-px bg-border" />

          <div className="space-y-0">
            {events.map((event, index) => {
              const config = getEventConfig(event.eventType);
              const Icon = config.icon;

              return (
                <div 
                  key={event.id} 
                  className="relative flex items-center gap-3.5 px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  {/* Compact icon indicator */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-4 h-4 rounded-full border border-background',
                      config.bg
                    )}
                  >
                    <Icon className={cn('w-2 h-2', config.color)} />
                  </div>

                  {/* Content - compact single line */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-medium text-foreground">{config.label}</span>
                      {showActorDetails && event.actorName && (
                        <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                          • {event.actorName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatTimestamp(event.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline timeline for embedding in order cards
 * Ultra-minimal, horizontal layout
 */
export function InlineTimeline({ 
  events, 
  maxShow = 4 
}: { 
  events: Array<{ type: string; timestamp: string }>; 
  maxShow?: number;
}) {
  const displayEvents = events.slice(0, maxShow);
  
  return (
    <div className="flex items-center gap-0.5 overflow-hidden">
      {displayEvents.map((event, index) => {
        const config = EVENT_CONFIG[event.type as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.default;
        const Icon = config.icon;
        
        return (
          <div key={index} className="flex items-center">
            <div 
              className={cn('w-4 h-4 rounded-full flex items-center justify-center', config.bg)}
              title={`${config.label} - ${new Date(event.timestamp).toLocaleString()}`}
            >
              <Icon className={cn('w-2 h-2', config.color)} />
            </div>
            {index < displayEvents.length - 1 && (
              <div className="w-1.5 h-px bg-border" />
            )}
          </div>
        );
      })}
      {events.length > maxShow && (
        <span className="text-[10px] text-muted-foreground ml-1">+{events.length - maxShow}</span>
      )}
    </div>
  );
}

/**
 * Status progress bar - visual workflow indicator
 * Compact, professional design
 */
export function OrderProgressBar({ 
  currentStatus,
  variant = 'default'
}: { 
  currentStatus: string;
  variant?: 'default' | 'compact' | 'mini';
}) {
  const WORKFLOW_STEPS = [
    { key: 'pending', label: 'Pending', short: 'P' },
    { key: 'accepted', label: 'Accepted', short: 'A' },
    { key: 'assigned', label: 'Assigned', short: 'As' },
    { key: 'in_progress', label: 'Working', short: 'W' },
    { key: 'editing', label: 'Editing', short: 'E' },
    { key: 'delivered', label: 'Delivered', short: 'D' },
    { key: 'completed', label: 'Done', short: '✓' },
  ];

  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStatus);
  const isComplete = currentStatus === 'completed' || currentStatus === 'paid';
  const isCancelled = currentStatus === 'cancelled';
  const isOnHold = currentStatus === 'on_hold';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <XCircle className="w-4 h-4 text-rose-500" />
        <span className="text-rose-600 font-medium">Cancelled</span>
      </div>
    );
  }

  if (isOnHold) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <span className="text-amber-600 font-medium">On Hold</span>
      </div>
    );
  }

  // Mini variant - just dots
  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-px">
        {WORKFLOW_STEPS.map((step, index) => {
          const isPast = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div
              key={step.key}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                isComplete ? 'bg-emerald-500' :
                isCurrent ? 'bg-primary ring-1 ring-primary/30' :
                isPast ? 'bg-primary' : 'bg-muted'
              )}
              title={step.label}
            />
          );
        })}
      </div>
    );
  }

  // Compact variant - dots with connecting lines
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-0">
        {WORKFLOW_STEPS.map((step, index) => {
          const isPast = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  isComplete ? 'bg-emerald-500' :
                  isCurrent ? 'bg-primary ring-2 ring-primary/20' :
                  isPast ? 'bg-primary' : 'bg-muted'
                )}
                title={step.label}
              />
              {index < WORKFLOW_STEPS.length - 1 && (
                <div 
                  className={cn(
                    'w-2.5 h-0.5 transition-colors',
                    isComplete ? 'bg-emerald-500' :
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  )} 
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default variant - with labels
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const isPast = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div 
                    className={cn(
                      'flex-1 h-0.5',
                      isComplete ? 'bg-emerald-500' :
                      index <= currentIndex ? 'bg-primary' : 'bg-muted'
                    )} 
                  />
                )}
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full border flex-shrink-0 transition-all',
                    isComplete ? 'bg-emerald-500 border-emerald-500' :
                    isCurrent ? 'bg-primary border-primary ring-2 ring-primary/20' :
                    isPast ? 'bg-primary border-primary' : 'bg-background border-muted'
                  )}
                />
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div 
                    className={cn(
                      'flex-1 h-0.5',
                      isComplete ? 'bg-emerald-500' :
                      index < currentIndex ? 'bg-primary' : 'bg-muted'
                    )} 
                  />
                )}
              </div>
              <span 
                className={cn(
                  'text-[9px] mt-0.5 font-medium leading-none',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
