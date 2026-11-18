"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, User, Briefcase, Building2, AlertCircle, Loader2, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FinancialsData {
  orderId: number;
  financials: {
    clientAmount: number;
    freelancerAmount: number;
    managerAssignedFee: number;
    managerDeliveryFee: number;
    managerTotal: number;
    adminProfit: number;
  };
  breakdown: {
    pages: number;
    slides: number;
    clientCpp: number;
    singleSpaced: boolean;
    effectivePages: number;
    workType: string;
    freelancerCompletedOrders: number;
    freelancerCppLevel: string;
  };
}

interface OrderFinancialsCardProps {
  orderId: number;
  userRole: 'admin' | 'manager' | 'freelancer' | 'client';
  variant?: 'full' | 'compact';
}

export default function OrderFinancialsCard({ 
  orderId, 
  userRole,
  variant = 'full' 
}: OrderFinancialsCardProps) {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFreelancerAmount, setEditedFreelancerAmount] = useState<string>('');
  const [editedManagerAmount, setEditedManagerAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only fetch if user has permission (admin, manager, or assigned freelancer)
        if (userRole === 'client') {
          // Clients can see basic financials from order detail endpoint
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/v2/orders/${orderId}/financials`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have permission to view financial details for this order');
          } else {
            throw new Error('Failed to fetch financials');
          }
          return;
        }

        const financialsData = await response.json();
        setData(financialsData);
        setEditedFreelancerAmount(financialsData.financials.freelancerAmount.toFixed(2));
        setEditedManagerAmount(financialsData.financials.managerTotal.toFixed(2));
      } catch (err) {
        console.error('Error fetching order financials:', err);
        setError(err instanceof Error ? err.message : 'Failed to load financial information');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [orderId, userRole]);

  const handleSaveAmounts = async () => {
    if (!data) return;
    
    const freelancerAmount = parseFloat(editedFreelancerAmount);
    const managerAmount = parseFloat(editedManagerAmount);
    
    if (isNaN(freelancerAmount) || freelancerAmount < 0) {
      toast.error('Invalid freelancer amount');
      return;
    }
    
    if (isNaN(managerAmount) || managerAmount < 0) {
      toast.error('Invalid manager amount');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/v2/orders/${orderId}/update-earnings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          freelancerAmount,
          managerAmount,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update' }));
        throw new Error(errorData.error || 'Failed to update earnings');
      }
      
      const updatedData = await response.json();
      
      // Refresh the data
      setData({
        ...data,
        financials: {
          ...data.financials,
          freelancerAmount,
          managerTotal: managerAmount,
          adminProfit: data.financials.clientAmount - (freelancerAmount + managerAmount),
        },
      });
      
      setIsEditing(false);
      toast.success('Payment amounts updated successfully');
    } catch (err) {
      console.error('Error updating earnings:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update earnings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    if (data) {
      setEditedFreelancerAmount(data.financials.freelancerAmount.toFixed(2));
      setEditedManagerAmount(data.financials.managerTotal.toFixed(2));
    }
    setIsEditing(false);
  };

  // Only admin sees full financial breakdown
  // Freelancers and managers should only see their earnings (handled separately in their pages)
  // Clients see nothing
  if (userRole !== 'admin') {
    return null; // Don't show this component at all for non-admins
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-8 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-300 bg-red-100 dark:bg-red-900/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error || 'Unable to load financial information'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { financials, breakdown } = data;

  if (variant === 'compact') {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Total Order Amount */}
          <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Order Total</p>
            <p className="text-2xl font-bold text-blue-600">
              KSh {financials.clientAmount.toFixed(2)}
            </p>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
            {userRole === 'admin' && (
              <>
                <div className="p-4 bg-white dark:bg-slate-900/50 rounded text-center">
                  <p className="text-xs text-muted-foreground">Writer</p>
                  <p className="font-bold text-sm text-green-600">
                    KSh {financials.freelancerAmount.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900/50 rounded text-center">
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-bold text-sm text-purple-600">
                    KSh {financials.managerTotal.toFixed(0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Financial Breakdown
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 text-primary-foreground">
              {breakdown.freelancerCppLevel || 'N/A'}
            </Badge>
            {userRole === 'admin' && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-3"
              >
                <Edit2 className="h-3 w-3" />
                Edit Amounts
              </Button>
            )}
            {userRole === 'admin' && isEditing && (
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSaveAmounts}
                  disabled={saving}
                  className="gap-3 bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="gap-3"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Total */}
        <div className="text-center p-6 bg-white dark:bg-slate-900/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground mb-2">Total Order Amount</p>
          <p className="text-4xl font-bold text-blue-600">
            KSh {financials.clientAmount.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>{breakdown.pages} page{breakdown.pages !== 1 ? 's' : ''}</span>
            {breakdown.slides > 0 && <span>{breakdown.slides} slide{breakdown.slides !== 1 ? 's' : ''}</span>}
            <span>@ KSh {breakdown.clientCpp}/page</span>
          </div>
        </div>

        {/* Distribution Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Distribution</p>
          
          {/* Freelancer Earnings */}
          <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-200">Freelancer Earnings</p>
                <p className="text-xs text-muted-foreground">
                  CPP Level: {breakdown.freelancerCppLevel} ({breakdown.freelancerCompletedOrders} orders)
                </p>
              </div>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedFreelancerAmount}
                  onChange={(e) => setEditedFreelancerAmount(e.target.value)}
                  className="w-32 text-right font-bold"
                  disabled={saving}
                />
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                KSh {financials.freelancerAmount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Manager Earnings */}
          {financials.managerTotal > 0 && (
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-200">Manager Earnings</p>
                  </div>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">KSh</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedManagerAmount}
                      onChange={(e) => setEditedManagerAmount(e.target.value)}
                      className="w-32 text-right font-bold"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    KSh {financials.managerTotal.toFixed(2)}
                  </p>
                )}
              </div>
              {!isEditing && (
                <div className="ml-11 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Assignment Fee:</span>
                    <span>KSh {financials.managerAssignedFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submission Fee:</span>
                    <span>KSh {financials.managerDeliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Platform Fee (Admin Profit) */}
          {userRole === 'admin' && (
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Building2 className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-200">Platform Fee</p>
                  <p className="text-xs text-muted-foreground">Admin profit</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                KSh {financials.adminProfit.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Calculation Details */}
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Calculation Details</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded">
              <p className="text-muted-foreground">Effective Pages</p>
              <p className="font-semibold">{breakdown.effectivePages}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded">
              <p className="text-muted-foreground">Client CPP</p>
              <p className="font-semibold">KSh {breakdown.clientCpp}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded">
              <p className="text-muted-foreground">Work Type</p>
              <p className="font-semibold capitalize">{breakdown.workType}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded">
              <p className="text-muted-foreground">Single Spaced</p>
              <p className="font-semibold">{breakdown.singleSpaced ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Verification */}
        {userRole === 'admin' && (
          <div className="pt-3 border-t">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Verification
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Total: KSh {financials.clientAmount.toFixed(2)} = 
                Writer (KSh {financials.freelancerAmount.toFixed(2)}) + 
                Manager (KSh {financials.managerTotal.toFixed(2)}) + 
                Platform (KSh {financials.adminProfit.toFixed(2)})
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

