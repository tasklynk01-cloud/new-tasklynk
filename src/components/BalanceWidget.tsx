"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  Clock,
  Lock,
  RefreshCw,
  ArrowDownToLine,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PayoutRequestDialog } from '@/components/payout-request-dialog';

interface BalanceData {
  available_balance: number;
  pending_balance: number;
  reserved_balance: number;
  total_earned: number;
  total_withdrawn: number;
  assignment_balance?: number; // Manager only
  delivery_balance?: number;   // Manager only
}

interface BalanceWidgetProps {
  userId: number;
  variant?: 'full' | 'compact' | 'minimal';
  showWithdrawButton?: boolean;
  onWithdrawClick?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  userRole?: string; // To determine if manager-specific fields should be shown
}

export default function BalanceWidget({
  userId,
  variant = 'full',
  showWithdrawButton = true,
  onWithdrawClick,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
  userRole,
}: BalanceWidgetProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const isManager = userRole === 'manager';

  const fetchBalance = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setRefreshing(true);
      }
      
      const response = await fetch(`/api/v2/balances/${userId}`, {
        credentials: 'include', // Use cookie-based auth instead of bearer token
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { balance: {...} }, extract balance object
        if (data.balance) {
          // Map API response to component's expected format
          setBalance({
            available_balance: data.balance.availableBalance || 0,
            pending_balance: data.balance.pendingBalance || 0,
            reserved_balance: data.balance.reservedBalance || 0,
            total_earned: data.balance.totalEarned || 0,
            total_withdrawn: data.balance.totalWithdrawn || 0,
            assignment_balance: data.balance.assignmentBalance, // Manager only
            delivery_balance: data.balance.deliveryBalance,     // Manager only
          });
        } else {
          // Fallback: assume data is already in correct format
          setBalance(data);
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch balance' }));
        toast.error(extractErrorMessage(error, 'Failed to fetch balance'));
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      toast.error('Failed to fetch balance. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance(true);

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchBalance(false); // Silent refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={variant === 'minimal' ? 'shadow-none' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className={variant === 'minimal' ? 'shadow-none' : ''}>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No balance data available</p>
        </CardContent>
      </Card>
    );
  }

  // Minimal variant (just numbers)
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-3">
          <Wallet className="w-4 h-4 text-green-600" />
          <span className="font-semibold">{formatCurrency(balance.available_balance)}</span>
        </div>
        {balance.pending_balance > 0 && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-xs">+{formatCurrency(balance.pending_balance)} pending</span>
          </div>
        )}
      </div>
    );
  }

  // Compact variant (single card, horizontal layout)
  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Wallet Balance</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchBalance(true)}
            disabled={refreshing}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:text-left bg-muted/40 dark:bg-muted/20 p-2.5 rounded-lg">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Available</p>
            <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(balance.available_balance)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {formatCurrency(balance.pending_balance)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reserved</p>
            <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {formatCurrency(balance.reserved_balance)}
            </p>
          </div>
        </div>

        {/* Manager-specific breakdown */}
        {isManager && (balance.assignment_balance || balance.delivery_balance) && (
          <div className="mt-2.5 pt-2.5 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground mb-1.5 font-bold uppercase">Manager Breakdown</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground text-[11px]">Assignment:</span>
                <span className="font-bold">{formatCurrency(balance.assignment_balance || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5B3594]"></div>
                <span className="text-muted-foreground text-[11px]">Delivery:</span>
                <span className="font-bold">{formatCurrency(balance.delivery_balance || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {showWithdrawButton && (
          <>
            <Button
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 rounded-lg shadow-sm"
              onClick={() => {
                if (onWithdrawClick) {
                  onWithdrawClick();
                } else {
                  setShowPayoutDialog(true);
                }
              }}
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />
              Request Withdrawal
            </Button>
            <PayoutRequestDialog
              open={showPayoutDialog}
              onOpenChange={setShowPayoutDialog}
              userId={userId}
              availableBalance={balance.available_balance}
              onSuccess={() => {
                fetchBalance(false);
              }}
            />
          </>
        )}
      </div>
    );
  }

  // Full variant (detailed breakdown)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5" />
            <CardTitle>Wallet Balance</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchBalance(true)}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Three-tier balance system: Available → Pending → Reserved
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Balance (main highlight) */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Available Balance</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Confirmed earnings from completed work. Can be withdrawn immediately.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge className="bg-green-600">Ready</Badge>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {formatCurrency(balance.available_balance)}
          </p>
        </div>

        {/* Pending Balance */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Pending Balance</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-yellow-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Approved work awaiting payment confirmation from admin.
                      Moves to 'Reserved' after payment confirmed.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-yellow-700 border-yellow-400">
              Awaiting Payment
            </Badge>
          </div>
          <p className="text-xl font-semibold text-yellow-700">
            {formatCurrency(balance.pending_balance)}
          </p>
        </div>

        {/* Reserved Balance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Reserved Balance</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-blue-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Payment confirmed, holding period before release to Available.
                      Typically 3-7 days for fraud protection.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-400">
              On Hold
            </Badge>
          </div>
          <p className="text-xl font-semibold text-blue-700">
            {formatCurrency(balance.reserved_balance)}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Total Earned
            </span>
            <span className="font-semibold">{formatCurrency(balance.total_earned)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <ArrowDownToLine className="w-4 h-4" />
              Total Withdrawn
            </span>
            <span className="font-semibold">{formatCurrency(balance.total_withdrawn)}</span>
          </div>
        </div>

        {/* Withdraw Button */}
        {showWithdrawButton && balance.available_balance > 0 && (
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (onWithdrawClick) {
                  onWithdrawClick();
                } else {
                  setShowPayoutDialog(true);
                }
              }}
            >
              <ArrowDownToLine className="w-5 h-5 mr-2" />
              Request Withdrawal ({formatCurrency(balance.available_balance)})
            </Button>
            <PayoutRequestDialog
              open={showPayoutDialog}
              onOpenChange={setShowPayoutDialog}
              userId={userId}
              availableBalance={balance.available_balance}
              onSuccess={() => {
                fetchBalance(false); // Refresh balance after successful request
              }}
            />
          </>
        )}

        {showWithdrawButton && balance.available_balance === 0 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            No available balance to withdraw
          </div>
        )}
      </CardContent>
    </Card>
  );
}
