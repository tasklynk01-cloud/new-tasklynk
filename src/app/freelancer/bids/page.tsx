"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useMemo, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gavel, Search, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useFreelancerOrderCounts } from "@/hooks/use-freelancer-order-counts";

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  message: string;
  bidAmount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  job?: {
    id: number;
    displayId?: string;
    title?: string;
    workType?: string;
    pages?: number;
    deadline?: string;
  };
};

function FreelancerBidsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { counts, refetch: refetchCounts } = useFreelancerOrderCounts(user?.id);

  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "freelancer") {
        router.push("/");
      } else if (!user.approved) {
        router.push("/freelancer/dashboard");
      } else {
        fetchBids();
        const interval = setInterval(fetchBids, 15000);
        return () => clearInterval(interval);
      }
    }
  }, [user, loading]);

  const fetchBids = async () => {
    if (!user) return;
    setLoadingBids(true);
    try {
      const url = `/api/bids?freelancerId=${user.id}&status=pending&unassignedOnly=true`;
      const res = await safeApiFetch(url, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setBids(Array.isArray(data) ? data.filter((b: Bid) => b.status === "pending") : []);
      }
    } catch (e) {
      console.error("Failed to load bids", e);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleRefresh = () => {
    fetchBids();
    refetchCounts?.();
  };

  const filteredBids = useMemo(() => {
    if (!query) return bids;
    const q = query.toLowerCase();
    return bids.filter((b) => 
      (b.message || "").toLowerCase().includes(q) ||
      (b.job?.title || "").toLowerCase().includes(q) ||
      (b.job?.displayId || "").toLowerCase().includes(q)
    );
  }, [bids, query]);

  if (loading || !user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              My Active Bids
            </h1>
            <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs rounded-full">
              {bids.length} pending
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your open bids. When accepted by admin, the order automatically moves to your In-Progress queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loadingBids}
            className="h-8 px-3 rounded-xl border-border text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingBids ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm"
          >
            <Link href="/freelancer/available">
              Browse More Jobs
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <Input 
            placeholder="Search by job title, order ID, or your bid proposal note..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="pl-9 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
          />
        </div>
        {query && (
          <Button
            onClick={() => setQuery('')}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Bids Display */}
      {loadingBids ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/70 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Gavel className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Pending Bids Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {bids.length === 0 
              ? "You haven't placed any bids yet. Explore the open academic job queue to place your bids."
              : "No bids match your search query."}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-4 text-xs"
          >
            <Link href="/freelancer/available">Browse Available Jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredBids.map((bid) => (
            <div
              key={bid.id}
              className="p-4 rounded-xl bg-card border border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {bid.job?.displayId || `Job #${bid.jobId}`}
                  </span>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0.5">
                    Under Review
                  </Badge>
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {bid.job?.title || 'Academic Writing Order'}
                </h3>

                {/* Details Matrix */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Your Bid Rate</p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      KSh {(bid.bidAmount || 0).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-medium">Submitted</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Message Preview */}
                {bid.message && (
                  <div className="bg-muted/30 rounded-lg p-2.5 text-[11px] text-muted-foreground line-clamp-2 border border-border/40">
                    <span className="font-semibold text-foreground">Pitch: </span>
                    {bid.message}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-border/50">
                <Button asChild size="sm" variant="outline" className="w-full h-7 text-xs rounded-lg border-border hover:bg-muted font-semibold">
                  <Link href={`/freelancer/orders/${bid.jobId}`}>
                    <Eye className="w-3 h-3 mr-1.5" />
                    Inspect Job &amp; Details
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FreelancerBidsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <FreelancerBidsContent />
    </Suspense>
  );
}
