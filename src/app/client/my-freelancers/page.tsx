'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Users, Calendar, Briefcase, Search, Award, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Freelancer {
  id: number;
  name: string;
  email: string;
  displayId: string;
  rating: number | null;
  tierName: string | null;
  tierColor: string | null;
  tierIcon: string | null;
}

interface FreelancerHistory {
  id: number;
  clientId: number;
  freelancerId: number;
  completedJobsCount: number;
  lastWorkedAt: string;
  avgRating: number | null;
  freelancer: Freelancer | null;
}

export default function MyFreelancersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<FreelancerHistory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        fetchHistory();
      }
    }
  }, [user, loading, router]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      const response = await safeApiFetch(`/api/v2/client-freelancer-history?clientId=${user.id}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        toast.error('Failed to load freelancer history');
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const filteredHistory = history.filter(h => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      h.freelancer?.name?.toLowerCase().includes(query) ||
      h.freelancer?.email?.toLowerCase().includes(query) ||
      h.freelancer?.displayId?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalFreelancers = history.length;
  const totalJobs = history.reduce((sum, h) => sum + h.completedJobsCount, 0);
  const avgRating = history.length > 0
    ? history.reduce((sum, h) => sum + (h.avgRating || 0), 0) / history.filter(h => h.avgRating).length
    : 0;

  if (loading || loadingData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Breadcrumb Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Preferred Specialists</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalFreelancers} Writers
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified academic writers who have previously completed your orders with high ratings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm">
            <Link href="/client/new-job">
              Create New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* 3 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Writer Network</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-foreground">{totalFreelancers}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">worked with you</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completed Jobs</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">{totalJobs}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">deliverables</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Avg Quality Rating</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
              {avgRating > 0 ? avgRating.toFixed(1) : '5.0'} / 5.0
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">satisfaction</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <Input
            placeholder="Search by writer name, email, or specialist ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
          />
        </div>
      </div>

      {/* Freelancers List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/70 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Preferred Writers Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {searchQuery 
              ? 'No writers match your search query.'
              : 'As your completed orders are finalized, your top specialists will be saved here for one-click re-hire.'}
          </p>
          <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-4 text-xs">
            <Link href="/client/new-job">Create First Order</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-card border border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {item.freelancer?.name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-foreground">{item.freelancer?.name || 'Verified Specialist'}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{item.freelancer?.displayId}</p>
                    </div>
                  </div>
                  {item.freelancer?.tierName && (
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                      {item.freelancer.tierIcon} {item.freelancer.tierName}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-xs font-bold text-foreground">{item.completedJobsCount}</p>
                    <p className="text-[10px] text-muted-foreground">Orders Done</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <span>{item.avgRating ? item.avgRating.toFixed(1) : '5.0'}</span>
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Your Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>Last worked: {new Date(item.lastWorkedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex gap-2">
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-7 text-xs shadow-sm"
                  onClick={() => {
                    router.push(`/client/new-job?preferredFreelancer=${item.freelancerId}`);
                  }}
                >
                  Re-hire for Project
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
