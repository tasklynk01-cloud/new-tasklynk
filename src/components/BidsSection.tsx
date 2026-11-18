"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, TrendingUp, Award, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface Bid {
  id: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
  message: string | null;
  status: string;
  createdAt: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerRating: number | null;
  freelancerCompletedJobs: number;
  freelancerTier?: string;
  freelancerBadge?: string;
}

interface BidsSectionProps {
  jobId: number;
  bids: Bid[];
  jobStatus: string;
  onBidsUpdate: () => void;
}

export default function BidsSection({ jobId, bids, jobStatus, onBidsUpdate }: BidsSectionProps) {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Only show bids section on "accepted" status orders
  if (jobStatus !== 'accepted') {
    return null;
  }

  // Calculate writer rank based on characteristics
  const calculateRank = (bid: Bid): number => {
    let score = 0;
    
    // Rating (max 50 points)
    if (bid.freelancerRating) {
      score += (bid.freelancerRating / 5) * 50;
    }
    
    // Completed jobs (max 30 points - caps at 50 jobs)
    score += Math.min((bid.freelancerCompletedJobs / 50) * 30, 30);
    
    // Tier bonus (max 20 points)
    const tierScores: Record<string, number> = {
      'starter': 4,
      'rising': 8,
      'established': 12,
      'expert': 16,
      'master': 20,
    };
    if (bid.freelancerTier) {
      score += tierScores[bid.freelancerTier.toLowerCase()] || 0;
    }
    
    return Math.round(score);
  };

  // Sort bids by rank (highest first)
  const rankedBids = [...bids]
    .map(bid => ({ ...bid, rank: calculateRank(bid) }))
    .sort((a, b) => b.rank - a.rank);

  const handleAssign = async () => {
    if (!selectedBid) return;

    try {
      setAssigning(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(`/api/v2/orders/${jobId}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freelancerId: selectedBid.freelancerId,
          fromBid: true,
        }),
      });

      if (response.ok) {
        toast.success(`Assigned to ${selectedBid.freelancerName}`);
        setShowAssignDialog(false);
        setSelectedBid(null);
        onBidsUpdate();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to assign freelancer'));
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('An error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (rank >= 60) return { label: 'Very Good', color: 'bg-blue-100 text-blue-800' };
    if (rank >= 40) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Fair', color: 'bg-gray-100 text-gray-800' };
  };

  if (rankedBids.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Freelancer Bids</CardTitle>
          <CardDescription>No bids yet. Freelancers can bid on this accepted order.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Award className="w-6 h-6 text-primary" />
            Freelancer Bids ({rankedBids.length})
          </CardTitle>
          <CardDescription>
            Review bids and select the best freelancer. Writers are ranked by characteristics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankedBids.map((bid, index) => {
              const rankBadge = getRankBadge(bid.rank);
              const isTopBid = index === 0;

              return (
                <div
                  key={bid.id}
                  className={`border-2 rounded-xl p-5 transition-all ${
                    isTopBid ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-bold text-lg">{bid.freelancerName}</h3>
                        </div>
                        {isTopBid && (
                          <Badge className="bg-green-600 text-primary-foreground">
                            <Star className="w-4 h-4 mr-1" />
                            Top Ranked
                          </Badge>
                        )}
                        <Badge className={`${rankBadge.color} rounded-xl`}>
                          Rank: {bid.rank}/100 - {rankBadge.label}
                        </Badge>
                        {bid.freelancerTier && (
                          <Badge className="bg-purple-100 text-purple-800 rounded-xl capitalize">
                            {bid.freelancerTier}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{bid.freelancerEmail}</p>

                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">
                            {bid.freelancerRating ? bid.freelancerRating.toFixed(1) : 'New'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span>{bid.freelancerCompletedJobs} jobs completed</span>
                        </div>
                        <div className="font-semibold text-primary">
                          Bid: KSh {bid.bidAmount.toFixed(2)}
                        </div>
                      </div>

                      {bid.message && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-1">Message:</p>
                          <p className="text-sm text-muted-foreground">{bid.message}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(bid.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedBid(bid);
                        setShowAssignDialog(true);
                      }}
                      disabled={assigning}
                      size="lg"
                      className="rounded-xl"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Assign Freelancer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Confirmation Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign this order to {selectedBid?.freelancerName}?
            </DialogDescription>
          </DialogHeader>
          {selectedBid && (
            <div className="py-4 space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Freelancer Details:</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedBid.freelancerName}</p>
                  <p><strong>Email:</strong> {selectedBid.freelancerEmail}</p>
                  <p><strong>Rating:</strong> {selectedBid.freelancerRating?.toFixed(1) || 'New'} ⭐</p>
                  <p><strong>Completed Jobs:</strong> {selectedBid.freelancerCompletedJobs}</p>
                  <p><strong>Bid Amount:</strong> KSh {selectedBid.bidAmount.toFixed(2)}</p>
                  <p><strong>Rank:</strong> {calculateRank(selectedBid)}/100</p>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  The freelancer will receive a notification and must accept or reject this assignment
                  before starting work.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedBid(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning}
              className="rounded-xl"
            >
              {assigning ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
