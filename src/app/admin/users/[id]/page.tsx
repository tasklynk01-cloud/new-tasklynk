"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Shield,
  Building,
  Briefcase,
  Ban,
  Check,
  X,
  Award,
  CreditCard,
  UserCheck,
  Lock,
  Unlock,
  Star,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserDetails = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  approved: boolean;
  balance: number;
  totalSpent: number;
  totalEarned?: number;
  completedJobs: number;
  rating: number | null;
  createdAt: string;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  blacklistReason?: string | null;
  clientTier?: string;
  freelancerBadge?: string | null;
  paymentTerms?: string;
  clientPriority?: string;
  lastLoginAt?: string | null;
  loginCount?: number;
  assignedManagerId?: number | null;
  assignedManagerName?: string | null;
};

type DialogState = {
  type: 'suspend' | 'tier' | 'badge' | 'payment-terms' | 'priority' | 'assign-manager' | null;
  isOpen: boolean;
};

export default function AdminUserDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ type: null, isOpen: false });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states for different actions
  const [suspendDuration, setSuspendDuration] = useState<string>('7');
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('basic');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string>('pod');
  const [selectedPriority, setSelectedPriority] = useState<string>('regular');
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: number; name: string; email: string; }>>([]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchUserDetails();
      }
    }
  }, [user, loading, router, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('bearer_token');
      const headers = { Authorization: `Bearer ${token}` };

      const userRes = await safeApiFetch(`/api/users/${userId}`, { headers });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserDetails(userData);
        
        // Set initial form values
        setSelectedTier(userData.clientTier || 'basic');
        setSelectedBadge(userData.freelancerBadge || '');
        setSelectedPaymentTerms(userData.paymentTerms || 'pod');
        setSelectedPriority(userData.clientPriority || 'regular');
        setSelectedManagerId(userData.assignedManagerId ? userData.assignedManagerId.toString() : null);
      } else {
        toast.error('Failed to load user details');
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAvailableManagers = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await safeApiFetch('/api/users/by-role?role=manager', { headers });
      
      if (response.ok) {
        const managers = await response.json();
        setAvailableManagers(managers.filter((m: any) => m.approved && m.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleApprove = async () => {
    if (!userDetails) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('User approved successfully');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!userDetails) return;
    
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('User rejected');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!userDetails || !suspendReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: parseInt(suspendDuration),
          reason: suspendReason,
        }),
      });

      if (response.ok) {
        toast.success('User suspended successfully');
        setDialogState({ type: null, isOpen: false });
        setSuspendReason('');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/unsuspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('User unsuspended successfully');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      toast.error('Failed to unsuspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/tier`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (response.ok) {
        toast.success('Client tier updated successfully');
        setDialogState({ type: null, isOpen: false });
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update tier');
      }
    } catch (error) {
      console.error('Failed to update tier:', error);
      toast.error('Failed to update tier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBadge = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/badge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badge: selectedBadge }),
      });

      if (response.ok) {
        toast.success('Freelancer badge updated successfully');
        setDialogState({ type: null, isOpen: false });
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update badge');
      }
    } catch (error) {
      console.error('Failed to update badge:', error);
      toast.error('Failed to update badge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentTerms = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/payment-terms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentTerms: selectedPaymentTerms }),
      });

      if (response.ok) {
        toast.success('Payment terms updated successfully');
        setDialogState({ type: null, isOpen: false });
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update payment terms');
      }
    } catch (error) {
      console.error('Failed to update payment terms:', error);
      toast.error('Failed to update payment terms');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePriority = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/priority`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: selectedPriority }),
      });

      if (response.ok) {
        toast.success('Client priority updated successfully');
        setDialogState({ type: null, isOpen: false });
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!userDetails) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/assign-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId: selectedManagerId === 'none' ? null : selectedManagerId }),
      });

      if (response.ok) {
        toast.success(selectedManagerId === 'none' ? 'Manager unassigned successfully' : 'Manager assigned successfully');
        setDialogState({ type: null, isOpen: false });
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to assign manager');
      }
    } catch (error) {
      console.error('Failed to assign manager:', error);
      toast.error('Failed to assign manager');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlacklist = async () => {
    if (!userDetails) return;
    
    const reason = prompt('Enter blacklist reason:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/users/${userDetails.id}/blacklist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('User blacklisted successfully');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to blacklist user');
      }
    } catch (error) {
      console.error('Failed to blacklist user:', error);
      toast.error('Failed to blacklist user');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  const getRoleIcon = () => {
    switch (userDetails.role) {
      case 'admin':
        return <Shield className="w-8 h-8 text-red-600" />;
      case 'manager':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'account_owner':
        return <Building className="w-8 h-8 text-purple-600" />;
      case 'freelancer':
        return <Briefcase className="w-8 h-8 text-orange-600" />;
      default:
        return <User className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link 
          href="/admin/users"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Users
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                {getRoleIcon()}
                {userDetails.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{userDetails.displayId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {userDetails.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {userDetails.phone || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge 
                variant={userDetails.status === 'active' || userDetails.status === 'approved' ? 'default' : 
                        userDetails.status === 'suspended' ? 'destructive' : 'secondary'}
                className="capitalize"
              >
                {userDetails.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {userDetails.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Admin Controls
            </CardTitle>
            <CardDescription>Manage user account and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Approval Actions */}
              {!userDetails.approved && userDetails.status === 'pending' && (
                <>
                  <Button 
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={handleReject}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {/* Suspension Actions */}
              {userDetails.status !== 'suspended' && userDetails.approved && (
                <Button 
                  onClick={() => setDialogState({ type: 'suspend', isOpen: true })}
                  disabled={actionLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend
                </Button>
              )}
              
              {userDetails.status === 'suspended' && (
                <Button 
                  onClick={handleUnsuspend}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unsuspend
                </Button>
              )}

              {/* Client-Specific Actions */}
              {(userDetails.role === 'client' || userDetails.role === 'account_owner') && (
                <>
                  <Button 
                    onClick={() => setDialogState({ type: 'tier', isOpen: true })}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Change Tier
                  </Button>
                  <Button 
                    onClick={() => setDialogState({ type: 'payment-terms', isOpen: true })}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Terms
                  </Button>
                  <Button 
                    onClick={() => setDialogState({ type: 'priority', isOpen: true })}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Set Priority
                  </Button>
                </>
              )}

              {/* Freelancer-Specific Actions */}
              {userDetails.role === 'freelancer' && (
                <Button 
                  onClick={() => setDialogState({ type: 'badge', isOpen: true })}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Update Badge
                </Button>
              )}

              {/* Manager Assignment - For Clients and Freelancers */}
              {(userDetails.role === 'client' || userDetails.role === 'account_owner' || userDetails.role === 'freelancer') && (
                <Button 
                  onClick={() => {
                    fetchAvailableManagers();
                    setDialogState({ type: 'assign-manager', isOpen: true });
                  }}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign Manager
                </Button>
              )}

              {/* Blacklist Action */}
              {userDetails.status !== 'blacklisted' && (
                <Button 
                  onClick={handleBlacklist}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Blacklist
                </Button>
              )}
            </div>

            {/* Display current settings for clients */}
            {(userDetails.role === 'client' || userDetails.role === 'account_owner') && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Client Tier</span>
                    <Badge variant="outline" className="w-fit capitalize text-sm">
                      <Award className="w-3 h-3 mr-1" />
                      {userDetails.clientTier || 'basic'}
                    </Badge>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Payment Terms</span>
                    <Badge 
                      variant={userDetails.paymentTerms === 'pod' ? 'default' : 'secondary'} 
                      className="w-fit text-sm font-semibold"
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      {userDetails.paymentTerms === 'pod' ? 'POD - Pay on Delivery' : 'POA - Pay on Approval'}
                    </Badge>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Priority Level</span>
                    <Badge 
                      variant="outline" 
                      className={`w-fit capitalize text-sm ${
                        userDetails.clientPriority === 'vip' ? 'border-purple-500 text-purple-700' :
                        userDetails.clientPriority === 'priority' ? 'border-blue-500 text-blue-700' :
                        ''
                      }`}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {userDetails.clientPriority || 'regular'}
                    </Badge>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Assigned Manager</span>
                    {userDetails.assignedManagerName ? (
                      <Badge variant="outline" className="w-fit text-sm">
                        <UserCheck className="w-3 h-3 mr-1" />
                        {userDetails.assignedManagerName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
                        No manager assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Display badge for freelancers */}
            {userDetails.role === 'freelancer' && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Freelancer Badge</span>
                    {userDetails.freelancerBadge ? (
                      <Badge variant="default" className="w-fit capitalize text-sm">
                        <Award className="w-3 h-3 mr-1" />
                        {userDetails.freelancerBadge.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
                        No badge assigned
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Assigned Manager</span>
                    {userDetails.assignedManagerName ? (
                      <Badge variant="outline" className="w-fit text-sm">
                        <UserCheck className="w-3 h-3 mr-1" />
                        {userDetails.assignedManagerName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
                        No manager assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Suspension Notice */}
            {userDetails.status === 'suspended' && userDetails.suspendedUntil && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Suspended until: {format(new Date(userDetails.suspendedUntil), 'PPP')}
                </p>
                {userDetails.suspensionReason && (
                  <p className="text-sm text-red-700 mt-1">Reason: {userDetails.suspensionReason}</p>
                )}
              </div>
            )}

            {/* Blacklist Notice */}
            {userDetails.status === 'blacklisted' && userDetails.blacklistReason && (
              <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                <p className="text-sm font-medium text-white">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Blacklisted - Permanently Banned
                </p>
                <p className="text-sm text-gray-300 mt-1">Reason: {userDetails.blacklistReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Account details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                  <Badge variant={userDetails.approved ? 'default' : 'secondary'} className="capitalize">
                    {userDetails.approved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{format(new Date(userDetails.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Information</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{userDetails.email}</p>
                    <p className="text-sm font-medium">{userDetails.phone || 'Not provided'}</p>
                  </div>
                </div>

                {userDetails.lastLoginAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Login</p>
                    <p className="text-sm font-medium">{format(new Date(userDetails.lastLoginAt), 'PPp')}</p>
                    <p className="text-xs text-muted-foreground">Total logins: {userDetails.loginCount || 0}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {userDetails.rating !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rating</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      {userDetails.rating.toFixed(1)} / 5.0
                    </p>
                  </div>
                )}

                {userDetails.completedJobs !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed Jobs</p>
                    <p className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {userDetails.completedJobs}
                    </p>
                  </div>
                )}

                {userDetails.balance !== null && userDetails.balance !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      KSh {userDetails.balance.toFixed(2)}
                    </p>
                  </div>
                )}

                {userDetails.totalEarned !== null && userDetails.totalEarned !== undefined && userDetails.role === 'freelancer' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      KSh {userDetails.totalEarned.toFixed(2)}
                    </p>
                  </div>
                )}

                {userDetails.totalSpent !== null && userDetails.totalSpent !== undefined && (userDetails.role === 'client' || userDetails.role === 'account_owner') && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-lg font-semibold text-amber-600 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      KSh {userDetails.totalSpent.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={dialogState.type === 'suspend' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Temporarily suspend {userDetails?.name}'s account. They will not be able to access the platform during this period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Suspension</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSuspend}
              disabled={actionLoading || !suspendReason.trim()}
            >
              {actionLoading ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={dialogState.type === 'tier' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Client Tier</DialogTitle>
            <DialogDescription>
              Update the tier level for {userDetails?.name}. Higher tiers may receive additional benefits or priority support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tier">Select Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTier} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Badge Dialog */}
      <Dialog open={dialogState.type === 'badge' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Freelancer Badge</DialogTitle>
            <DialogDescription>
              Assign a badge to recognize {userDetails?.name}'s achievements or expertise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="badge">Badge</Label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="top_rated">Top Rated</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="rising_star">Rising Star</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBadge} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Badge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Terms Dialog */}
      <Dialog open={dialogState.type === 'payment-terms' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Terms</DialogTitle>
            <DialogDescription>
              Set when {userDetails?.name} should be charged for orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Select value={selectedPaymentTerms} onValueChange={setSelectedPaymentTerms}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod">
                    <div className="flex flex-col">
                      <span className="font-semibold">POD - Pay on Delivery</span>
                      <span className="text-xs text-muted-foreground">Client pays immediately when work is delivered</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="poa">
                    <div className="flex flex-col">
                      <span className="font-semibold">POA - Pay on Approval</span>
                      <span className="text-xs text-muted-foreground">Client pays after reviewing and approving the work</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Payment Terms Explained:</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>POD:</strong> Client is charged when freelancer delivers the completed work</li>
                  <li><strong>POA:</strong> Client is charged only after they approve the delivered work</li>
                  <li>This setting affects when payments are deducted from client balance</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePaymentTerms} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Terms'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={dialogState.type === 'priority' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Client Priority</DialogTitle>
            <DialogDescription>
              Assign a priority level to {userDetails?.name}. Higher priority clients may receive faster service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePriority} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Priority'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={dialogState.type === 'assign-manager' && dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ type: null, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Assign a manager to supervise {userDetails?.name}. Managers can help coordinate work and provide support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="manager">Select Manager</Label>
              <Select value={selectedManagerId || 'none'} onValueChange={setSelectedManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager (Unassign)</SelectItem>
                  {availableManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableManagers.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No active managers available. Please create and approve manager accounts first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleAssignManager} disabled={actionLoading}>
              {actionLoading ? 'Assigning...' : 'Assign Manager'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

