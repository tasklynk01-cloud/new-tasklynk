"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  DollarSign,
  Hash,
  Layers,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  Send,
  RefreshCw,
  CircleDot
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface OrderSummary {
  id: number;
  displayId?: string;
  title: string;
  status: string;
  workType: string;
  pages?: number | null;
  slides?: number | null;
  amount: number;
  deadline: string;
  actualDeadline?: string;
  freelancerDeadline?: string;
  createdAt: string;
  clientName?: string;
  clientEmail?: string;
  assignedFreelancerName?: string;
  assignedFreelancerEmail?: string;
  adminApproved?: boolean;
  clientApproved?: boolean;
  paymentConfirmed?: boolean;
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200', label: 'Accepted' },
  assigned: { icon: User, color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200', label: 'Assigned' },
  in_progress: { icon: CircleDot, color: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-200', label: 'In Progress' },
  editing: { icon: FileText, color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200', label: 'Editing' },
  submitted: { icon: Send, color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-200', label: 'Submitted' },
  internal_revision: { icon: RefreshCw, color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200', label: 'QC Review' },
  client_revision: { icon: RefreshCw, color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200', label: 'Revision' },
  delivered: { icon: Send, color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200', label: 'Delivered' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200', label: 'Approved' },
  paid: { icon: DollarSign, color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200', label: 'Paid' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200', label: 'Completed' },
  on_hold: { icon: Pause, color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200', label: 'On Hold' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200', label: 'Cancelled' },
  canceled: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200', label: 'Cancelled' },
} as const;

export function OrderStatusBadge({ 
  status, 
  size = 'default',
  showIcon = true,
  className 
}: { 
  status: string; 
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  };
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 h-5',
    default: 'text-xs px-2 py-0.5 h-6',
    lg: 'text-sm px-3 py-1 h-8',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium border gap-1',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('flex-shrink-0', size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-4 h-4')} />}
      <span>{config.label}</span>
    </Badge>
  );
}

// ============================================
// COMPACT ORDER HEADER
// ============================================

export function CompactOrderHeader({
  order,
  showBackButton = true,
  backHref,
  actions,
}: {
  order: OrderSummary;
  showBackButton?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b">
      <div className="flex items-start gap-3">
        {showBackButton && backHref && (
          <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 flex-shrink-0" asChild>
            <a href={backHref}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
          </Button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {order.displayId && (
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5 bg-muted">
                {order.displayId}
              </Badge>
            )}
            <OrderStatusBadge status={order.status} size="sm" />
          </div>
          <h1 className="text-base sm:text-lg font-semibold mt-1 line-clamp-2">{order.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPACT ORDER DETAILS GRID
// ============================================

interface DetailItem {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  color?: string;
}

export function OrderDetailsGrid({
  order,
  showFinancials = true,
  showParticipants = false,
}: {
  order: OrderSummary;
  showFinancials?: boolean;
  showParticipants?: boolean;
}) {
  const details: DetailItem[] = [
    {
      icon: Layers,
      label: 'Work Type',
      value: <span className="capitalize">{order.workType || 'Standard'}</span>,
    },
    {
      icon: FileText,
      label: 'Quantity',
      value: [
        order.pages && `${order.pages} pages`,
        order.slides && `${order.slides} slides`,
      ].filter(Boolean).join(' + ') || '-',
    },
    {
      icon: Calendar,
      label: 'Deadline',
      value: order.actualDeadline || order.deadline 
        ? format(new Date(order.actualDeadline || order.deadline), 'MMM dd, HH:mm')
        : '-',
    },
  ];

  if (showFinancials) {
    details.push({
      icon: DollarSign,
      label: 'Amount',
      value: <span className="font-semibold text-green-600">KSh {order.amount.toFixed(0)}</span>,
      color: 'text-green-600',
    });
  }

  if (showParticipants && order.clientName) {
    details.push({
      icon: User,
      label: 'Client',
      value: order.clientName,
    });
  }

  if (showParticipants && order.assignedFreelancerName) {
    details.push({
      icon: User,
      label: 'Writer',
      value: order.assignedFreelancerName,
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {details.map((item, index) => (
        <div key={index} className="bg-muted/50 rounded-lg p-4.5 border border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <item.icon className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
          </div>
          <div className={cn('text-sm font-medium', item.color)}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPACT PARTICIPANT CARDS
// ============================================

export function ParticipantCard({
  role,
  name,
  email,
  phone,
  isOnline,
  rating,
  extra,
}: {
  role: 'Client' | 'Writer' | 'Manager';
  name: string;
  email?: string;
  phone?: string;
  isOnline?: boolean;
  rating?: number | null;
  extra?: React.ReactNode;
}) {
  const bgColors = {
    Client: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    Writer: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
    Manager: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
  };

  return (
    <div className={cn('rounded-lg p-4.5 border', bgColors[role])}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{role}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-semibold truncate">{name}</p>
            {isOnline !== undefined && (
              <span 
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  isOnline ? 'bg-green-500' : 'bg-red-400'
                )}
                title={isOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>
          {email && <p className="text-[11px] text-muted-foreground truncate">{email}</p>}
          {phone && phone !== '+0000000000' && (
            <p className="text-[11px] text-muted-foreground font-mono">{phone}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {rating !== undefined && rating !== null && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-[10px] px-1.5">
              ★ {rating.toFixed(1)}
            </Badge>
          )}
          {extra}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPACT INSTRUCTIONS BOX
// ============================================

export function InstructionsBox({
  instructions,
  maxHeight = '200px',
  collapsible = false,
}: {
  instructions: string;
  maxHeight?: string;
  collapsible?: boolean;
}) {
  return (
    <div className="mt-3">
      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Instructions</Label>
      <div 
        className="mt-1.5 p-4 bg-muted/60 rounded-lg text-sm whitespace-pre-wrap overflow-y-auto border border-border/50"
        style={{ maxHeight }}
      >
        {instructions || 'No instructions provided.'}
      </div>
    </div>
  );
}

// ============================================
// COMPACT ACTION BAR
// ============================================

export function ActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-3 pt-3 border-t mt-3',
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// COMPACT FILE BADGE
// ============================================

const FILE_TYPE_CONFIG = {
  final: { label: 'Final', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  completed: { label: 'Final', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  plagiarism: { label: 'Plag', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  ai: { label: 'AI', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
  revision: { label: 'Rev', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
  brief: { label: 'Brief', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  initial: { label: 'Brief', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  abstract: { label: 'Abstract', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' },
  outline: { label: 'Outline', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' },
  graphics: { label: 'Graphics', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200' },
  tables: { label: 'Tables', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200' },
  source: { label: 'Source', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' },
  printable: { label: 'Source', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' },
  default: { label: 'File', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
};

export function getFileBadgeConfig(fileType: string, notes?: string): { label: string; color: string } {
  const type = (fileType || '').toLowerCase();
  const n = (notes || '').toLowerCase();
  
  if (n.includes('[delivery]') || type.includes('completed') || type.includes('final')) 
    return FILE_TYPE_CONFIG.final;
  if (type.includes('plagiarism') || type.includes('plag')) 
    return FILE_TYPE_CONFIG.plagiarism;
  if (type.includes('ai')) 
    return FILE_TYPE_CONFIG.ai;
  if (type.includes('draft')) 
    return FILE_TYPE_CONFIG.draft;
  if (type.includes('revision')) 
    return FILE_TYPE_CONFIG.revision;
  if (type.includes('brief') || type.includes('initial')) 
    return FILE_TYPE_CONFIG.brief;
  if (type.includes('abstract') || type.includes('outline')) 
    return FILE_TYPE_CONFIG.abstract;
  if (type.includes('graphics') || type.includes('tables')) 
    return FILE_TYPE_CONFIG.graphics;
  if (type.includes('printable') || type.includes('source')) 
    return FILE_TYPE_CONFIG.source;
  
  return FILE_TYPE_CONFIG.default;
}

// ============================================
// COMPACT SECTION HEADER
// ============================================

export function SectionHeader({
  icon: Icon,
  title,
  count,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pb-2 border-b', className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold">{title}</h3>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {count}
          </Badge>
        )}
      </div>
      {action}
    </div>
  );
}

// ============================================
// ALERT VARIANTS
// ============================================

export function CompactAlert({
  type,
  message,
  className,
}: {
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  className?: string;
}) {
  const config = {
    info: { icon: AlertCircle, color: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200' },
    warning: { icon: AlertCircle, color: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200' },
    success: { icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-200' },
    error: { icon: XCircle, color: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-200' },
  };

  const { icon: Icon, color } = config[type];

  return (
    <div className={cn('flex items-center gap-3 px-3 py-2 rounded-lg border text-sm', color, className)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-muted" />
        <div className="flex-1">
          <div className="h-5 w-24 bg-muted rounded mb-2" />
          <div className="h-6 w-3/4 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-32 bg-muted rounded-lg" />
    </div>
  );
}
