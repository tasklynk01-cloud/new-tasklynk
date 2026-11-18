"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  FileEdit,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  ArrowLeft,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type Revision = {
  id: number;
  orderId: number;
  revisionType: 'client' | 'internal';
  requestedBy: number;
  assignedTo: number | null;
  description: string;
  status: string;
  filesJson: string;
  freelancerResponse: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  closedBy: number | null;
  orderDisplayId: string;
  orderTitle: string;
  orderNumber: string;
  requestedByName: string | null;
  assignedToName: string | null;
  closedByName: string | null;
};

export default function FreelancerRevisionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
        return;
      }
      fetchRevisions();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRevisions();
    }
  }, [typeFilter, statusFilter]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const response = await safeApiFetch(`/api/v2/revisions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const revisionsList = data.revisions || [];
        setRevisions(revisionsList);
        
        // Calculate stats
        setStats({
          total: revisionsList.length,
          pending: revisionsList.filter((r: Revision) => r.status === 'pending').length,
          inProgress: revisionsList.filter((r: Revision) => r.status === 'in_progress').length,
          completed: revisionsList.filter((r: Revision) => r.status === 'completed').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
      toast.error('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: FileEdit },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-4 h-4 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'client' 
      ? <Badge variant="outline" className="border-purple-500 text-purple-600">Client</Badge>
      : <Badge variant="outline" className="border-blue-500 text-blue-600">Internal</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Breadcrumb Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border text-xs font-semibold">
            <Link href="/freelancer/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Revision Queue</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Track and resolve revision requests across client and internal QA</p>
          </div>
        </div>
      </div>

      {/* Compact 4-Stat KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Revisions</span>
          <span className="text-lg sm:text-xl font-black text-foreground mt-1">{stats.total}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Action Required</span>
          <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</span>
          <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resolved</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Revision Requests</span>
          <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">{revisions.length}</Badge>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[130px] rounded-lg border-border/70">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="client">Client Revision</SelectItem>
              <SelectItem value="internal">Internal QA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[140px] rounded-lg border-border/70">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Action Required</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Revisions List */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        {revisions.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <FileEdit className="w-10 h-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground mb-0.5">No Revisions Assigned</p>
            <p className="text-xs text-muted-foreground">Great job! All your submissions are clear and approved.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {revisions.map((revision) => (
              <div 
                key={revision.id}
                className="p-4 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">
                      {revision.orderDisplayId || revision.orderNumber}
                    </span>
                    {getTypeBadge(revision.revisionType)}
                    {getStatusBadge(revision.status)}
                  </div>
                  <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-7 px-3 text-xs shadow-sm w-fit">
                    <Link href={`/freelancer/orders/${revision.orderId}`}>
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      Open Order
                    </Link>
                  </Button>
                </div>

                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground mb-1">{revision.orderTitle}</h4>
                  <p className="text-xs text-muted-foreground bg-background/80 p-2.5 rounded-lg border border-border/50">
                    {revision.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    Requested: {format(new Date(revision.createdAt), 'MMM dd, yyyy · h:mm a')}
                  </span>
                  {revision.completedAt && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Completed: {format(new Date(revision.completedAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
