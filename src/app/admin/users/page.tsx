"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Trash2, Star, Ban, PlayCircle, Shield, ArrowLeft, Award, TrendingUp, Crown, Info, Zap, Building, UserCog, Briefcase, Users, MessageSquare, Link as LinkIcon, FileUp, Mail, CreditCard } from 'lucide-react';
import { getUserDisplayStatus, canUserPerformActions, getUserStatusCategory } from '@/lib/user-status';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { InviteManagerDialog } from '@/components/invite-manager-dialog';
import { InviteClientDialog } from '@/components/invite-client-dialog';
import { InviteFreelancerDialog } from '@/components/invite-freelancer-dialog';
import { InvitationStatusChecker } from '@/components/invitation-status-checker';

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  approved: boolean;
  balance: number | null;
  rating: number | null;
  phone: string | null;
  status: string;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  blacklistReason: string | null;
  completedJobs: number | null;
  totalSpent: number | null;
  freelancerBadge: string | null;
  clientTier: string | null;
  clientPriority: string | null;
  paymentTerms: string | null;
  accountOwner: string | boolean | null;
  createdAt: string;
};

// SEO-optimized metadata
const pageSEO = {
  title: "User Management - TaskLynk Academic Writing Platform | Manage Writers, Clients & Essays",
  description: "Professional user management system for academic writing services. Manage freelance writers, essay writers, assignment helpers, clients, and online job orders. TaskLynk - Kenya's leading academic writing platform.",
  keywords: [
    "academic writer management",
    "freelance writer platform",
    "essay writer management",
    "assignment writer platform",
    "online writing jobs Kenya",
    "academic writing management",
    "writer administration system",
    "client management platform",
    "essay writing service management",
    "task management system",
    "academic job board",
    "writer marketplace Kenya"
  ]
};

// Badge/Tier display components
const FreelancerBadgeDisplay = ({ badge }: { badge: string | null }) => {
  if (!badge) return <span className="text-muted-foreground text-sm">No Badge</span>;
  
  const badgeConfig = {
    bronze: { label: 'Bronze', icon: Award, color: 'bg-orange-700 text-white', desc: '0-9 orders' },
    silver: { label: 'Silver', icon: Award, color: 'bg-gray-400 text-white', desc: '10-24 orders' },
    gold: { label: 'Gold', icon: Award, color: 'bg-yellow-500 text-white', desc: '25-49 orders' },
    platinum: { label: 'Platinum', icon: Crown, color: 'bg-purple-600 text-white', desc: '50-99 orders' },
    elite: { label: 'Elite', icon: Crown, color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', desc: '100+ orders' },
  }[badge];

  if (!badgeConfig) return null;
  const Icon = badgeConfig.icon;

  return (
    <Badge className={badgeConfig.color}>
      <Icon className="w-4 h-4 mr-1" />
      {badgeConfig.label}
    </Badge>
  );
};

const ClientTierDisplay = ({ tier }: { tier: string | null }) => {
  if (!tier) return <span className="text-muted-foreground text-sm">Basic</span>;
  
  const tierConfig = {
    basic: { label: '?? Basic', color: 'bg-gray-500 text-white' },
    silver: { label: '?? Silver', color: 'bg-gray-400 text-white' },
    gold: { label: '?? Gold', color: 'bg-yellow-500 text-white' },
    platinum: { label: '?? Platinum', color: 'bg-purple-600 text-white' },
  }[tier];

  if (!tierConfig) return null;

  return (
    <Badge className={tierConfig.color}>
      {tierConfig.label}
    </Badge>
  );
};

const ClientPriorityDisplay = ({ priority }: { priority: string | null }) => {
  const PRIORITY_CONFIG = {
    regular: { label: '?? Regular', color: 'bg-slate-500 text-white' },
    priority: { label: '? Priority', color: 'bg-orange-600 text-white' },
    vip: { label: '?? VIP', color: 'bg-destructive text-white' },
  } as const;

  type PriorityKey = keyof typeof PRIORITY_CONFIG;
  const key: PriorityKey =
    priority && priority in PRIORITY_CONFIG
      ? (priority as PriorityKey)
      : 'regular';
  const priorityConfig = PRIORITY_CONFIG[key];

  return (
    <Badge className={priorityConfig.color}>
      {priorityConfig.label}
    </Badge>
  );
};

const PaymentTermsDisplay = ({ terms }: { terms: string | null }) => {
  const PAYMENT_TERMS_CONFIG = {
    pod: { 
      label: '?? Pay on Delivery', 
      color: 'bg-orange-600 text-white',
      description: 'Payment required after work delivery'
    },
    poa: { 
      label: '? Pay on Approval', 
      color: 'bg-green-600 text-white',
      description: 'Payment required after client approval'
    },
  } as const;

  type TermsKey = keyof typeof PAYMENT_TERMS_CONFIG;
  const key: TermsKey = 
    terms && terms in PAYMENT_TERMS_CONFIG
      ? (terms as TermsKey)
      : 'pod';
  const termsConfig = PAYMENT_TERMS_CONFIG[key];

  return (
    <Badge className={termsConfig.color} title={termsConfig.description}>
      {termsConfig.label}
    </Badge>
  );
};

// Helper: check if user is active (approved status)
// DEPRECATED: Use canUserPerformActions() from user-status.ts instead
// const isUserActive = (user: User) => user.approved && user.status === 'approved';

function AdminUsersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Add sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Expand role-based lists to specific categories
  const [activeRoleTab, setActiveRoleTab] = useState<'all' | 'freelancers' | 'clients' | 'account_owners' | 'regular_clients' | 'on_hold_clients' | 'admins' | 'managers'>('all');
  
  // Invite Manager Dialog
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);
  
  // Invite Client Dialog
  const [inviteClientOpen, setInviteClientOpen] = useState(false);
  
  // Invite Freelancer Dialog
  const [inviteFreelancerOpen, setInviteFreelancerOpen] = useState(false);
  
  // Invitation Status Checker visibility
  const [showInvitationChecker, setShowInvitationChecker] = useState(false);
  
  // Selected user and action type state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'remove' | 'suspend' | 'unsuspend' | 'blacklist' | 'badge' | 'tier' | 'priority' | 'payment-terms' | 'message' | 'link' | 'file' | null>(null);
  
  // Suspend dialog state
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [suspendReason, setSuspendReason] = useState('');
  
  // Blacklist dialog state
  const [blacklistReason, setBlacklistReason] = useState('');

  // Badge/Tier dialog state
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string>('');

  // Message/Link/File state
  const [messageContent, setMessageContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Status Sync state
  const [syncingStatuses, setSyncingStatuses] = useState(false);

  // Helper: sync role to URL
  const pushRoleToUrl = (roleValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('role', roleValue);
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchUsers();
        
        // Handle role tab from URL
        const roleParam = searchParams.get('role');
        if (roleParam && ['all', 'freelancers', 'clients', 'account_owners', 'regular_clients', 'on_hold_clients', 'admins', 'managers'].includes(roleParam)) {
          setActiveRoleTab(roleParam as any);
        }
      }
    }
  }, [user, loading, router, searchParams]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await safeApiFetch('/api/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : (data?.data || data?.users || []));
      } else {
        console.error('Failed to fetch users, response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Separate users by role
  const freelancers = users.filter(u => u.role === 'freelancer');
  const clients = users.filter(u => u.role === 'client' || u.role === 'account_owner');
  const accountOwnersOnly = users.filter(u => u.role === 'account_owner');
  const regularClientsOnly = users.filter(u => u.role === 'client');
  const onHoldClientsOnly = users.filter(u => (u.role === 'client' || u.role === 'account_owner') && u.status === 'on_hold');
  const admins = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role === 'manager');

  // Calculate stats - UPDATED TO USE CENTRALIZED STATUS
  const stats = {
    totalUsers: users.length,
    totalFreelancers: freelancers.length,
    totalClients: clients.length,
    totalManagers: managers.length,
    totalAdmins: admins.length,
    activeUsers: users.filter(u => canUserPerformActions(u)).length,
    pendingUsers: users.filter(u => getUserStatusCategory(u) === 'pending').length,
    suspendedUsers: users.filter(u => getUserStatusCategory(u) === 'suspended').length,
  };

  // Display label for active role tab - UPDATED WITH SEO KEYWORDS
  const roleTabLabel: Record<typeof activeRoleTab, string> = {
    all: 'All Users',
    freelancers: 'Writers/Freelancers', // UPDATED: Combined terminology
    clients: 'Clients',
    account_owners: 'Account Owners',
    regular_clients: 'Regular Clients',
    on_hold_clients: 'On Hold Clients',
    admins: 'Admins',
    managers: 'Managers',
  } as const;

  // Determine if we should show the Priority column (client badge visibility in admin lists)
  const showPriorityColumn = ['clients','account_owners','regular_clients','on_hold_clients','all'].includes(activeRoleTab);

  // Get current list based on active role tab - NO STATUS FILTERING
  const getCurrentList = () => {
    switch (activeRoleTab) {
      case 'all': return users;
      case 'freelancers': return freelancers;
      case 'clients': return clients;
      case 'account_owners': return accountOwnersOnly;
      case 'regular_clients': return regularClientsOnly;
      case 'on_hold_clients': return onHoldClientsOnly;
      case 'admins': return admins;
      case 'managers': return managers;
      default: return [];
    }
  };

  const currentList = getCurrentList();

  // Action Handlers - FIXED API CALLS
  const handleApprove = async (userId: number) => {
    try {
      const response = await safeApiFetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('User approved successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to approve user'));
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      const response = await safeApiFetch(`/api/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Your application has been reviewed and not approved at this time.'
        }),
      });
      if (response.ok) {
        toast.success('User rejected successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to reject user'));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      const response = await safeApiFetch(`/api/users/${userId}/remove`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('User removed successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to remove user'));
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    try {
      // FIX: Use PATCH method and 'duration' field (not 'days')
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/suspend`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: parseInt(suspendDuration),
          reason: suspendReason,
        }),
      });
      if (response.ok) {
        toast.success('User suspended successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to suspend user'));
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSuspendDuration('7');
      setSuspendReason('');
    }
  };

  const handleUnsuspend = async (userId: number) => {
    try {
      // FIX: Use PATCH method (not POST)
      const response = await safeApiFetch(`/api/users/${userId}/unsuspend`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('User unsuspended successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to unsuspend user'));
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleBlacklist = async () => {
    if (!selectedUser || !blacklistReason.trim()) {
      toast.error('Please provide a reason for blacklist');
      return;
    }
    try {
      // FIX: Use PATCH method (not POST)
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/blacklist`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: blacklistReason }),
      });
      if (response.ok) {
        toast.success('User blacklisted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to blacklist user'));
      }
    } catch (error) {
      console.error('Error blacklisting user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setBlacklistReason('');
    }
  };

  const handleBadgeUpdate = async () => {
    if (!selectedUser || !selectedBadge) {
      toast.error('Please select a badge');
      return;
    }
    try {
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/badge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badge: selectedBadge }),
      });
      if (response.ok) {
        toast.success('Badge updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update badge');
      }
    } catch (error) {
      console.error('Error updating badge:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedBadge('');
    }
  };

  const handleTierUpdate = async () => {
    if (!selectedUser || !selectedTier) {
      toast.error('Please select a tier');
      return;
    }
    try {
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/tier`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: selectedTier }),
      });
      if (response.ok) {
        toast.success('Tier updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update tier');
      }
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedTier('');
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedUser || !selectedPriority) {
      toast.error('Please select a priority');
      return;
    }
    try {
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/priority`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: selectedPriority }),
      });
      if (response.ok) {
        toast.success('Priority updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedPriority('');
    }
  };

  const handlePaymentTermsUpdate = async () => {
    if (!selectedUser || !selectedPaymentTerms) {
      toast.error('Please select payment terms');
      return;
    }
    
    console.log('[Payment Terms] Updating for user:', selectedUser.id, selectedUser.email, 'to:', selectedPaymentTerms);
    
    try {
      const response = await safeApiFetch(`/api/users/${selectedUser.id}/payment-terms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentTerms: selectedPaymentTerms }),
      });
      
      const data = await response.json();
      console.log('[Payment Terms] Response:', { status: response.status, data });
      
      if (response.ok) {
        toast.success('Payment terms updated successfully');
        fetchUsers();
      } else {
        const errorMsg = data.error || 'Failed to update payment terms';
        console.error('[Payment Terms] Update failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating payment terms:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedPaymentTerms('');
    }
  };

  const handleSyncStatuses = async () => {
    setSyncingStatuses(true);
    try {
      const response = await safeApiFetch('/api/admin/sync-user-statuses', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Synchronized ${data.summary.fixed} user status(es)`);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to sync statuses'));
      }
    } catch (error) {
      console.error('Error syncing statuses:', error);
      toast.error('An error occurred');
    } finally {
      setSyncingStatuses(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || (!messageContent.trim() && !linkUrl.trim() && !fileUrl.trim())) {
      toast.error('Please provide message content, link, or file');
      return;
    }
    setSendingMessage(true);
    try {
      // Implementation would depend on your messaging API
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred');
    } finally {
      setSendingMessage(false);
      setSelectedUser(null);
      setActionType(null);
      setMessageContent('');
      setLinkUrl('');
      setFileUrl('');
    }
  };

  const handleRecalculateRatings = async () => {
    try {
      const response = await safeApiFetch('/api/users/calculate-ratings', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Ratings recalculated successfully');
      }
    } catch (error) {
      console.error('Error recalculating ratings:', error);
      toast.error('An error occurred');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Metadata */}
      <head>
        <title>{pageSEO.title}</title>
        <meta name="description" content={pageSEO.description} />
        <meta name="keywords" content={pageSEO.keywords.join(", ")} />
        <meta property="og:title" content={pageSEO.title} />
        <meta property="og:description" content={pageSEO.description} />
        <meta name="twitter:title" content={pageSEO.title} />
        <meta name="twitter:description" content={pageSEO.description} />
      </head>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border hover:bg-muted text-xs font-semibold">
            <Link href="/admin/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">User Management</h1>
            <p className="text-xs text-muted-foreground">
              Directory and role administration for writers, clients, and managers
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats Card - SHOW ONLY on All Users to reduce congestion */}
      {activeRoleTab === 'all' && (
        <Card className="mb-3 sm:mb-4 md:mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="p-4 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-sm sm:text-base md:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Platform Statistics - Academic Writing Services
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Overview of all users: writers, freelancers, clients, and assignments across the platform
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncStatuses}
                disabled={syncingStatuses}
                className="text-xs"
              >
                {syncingStatuses ? 'Syncing...' : 'Sync Statuses'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3 md:gap-4">
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.totalFreelancers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Writers/Freelancers</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.totalClients}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.totalManagers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Managers</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">{stats.totalAdmins}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Active</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="bg-background/50 p-4 sm:p-4 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold">User Management by Category</h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Choose a category to manage: academic writers, essay writers, freelancers, clients, assignments
          </p>
        </div>
        <Button onClick={handleRecalculateRatings} variant="outline" size="sm" className="text-xs sm:text-sm">
          <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Recalculate Ratings
        </Button>
      </div>

      {/* Invite Users Section */}
      <Card className="mb-4">
        <CardHeader className="p-4 sm:p-4 md:p-6 pb-2">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-3">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            Invite New Users
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Send invitation emails with registration links to new clients, freelancers, or managers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-4 md:p-6 pt-2">
          <div className="flex flex-wrap gap-3 sm:gap-3 mb-4">
            <Button 
              onClick={() => setInviteClientOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
            >
              <Briefcase className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Invite Client
            </Button>
            <Button 
              onClick={() => setInviteFreelancerOpen(true)} 
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            >
              <Users className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Invite Freelancer
            </Button>
            <Button 
              onClick={() => setInviteManagerOpen(true)} 
              variant="secondary"
              className="text-xs sm:text-sm"
            >
              <UserCog className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Invite Manager
            </Button>
            <Button 
              onClick={() => setShowInvitationChecker(!showInvitationChecker)} 
              variant="outline"
              className="text-xs sm:text-sm"
            >
              <Info className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {showInvitationChecker ? 'Hide' : 'Check'} Invitation Status
            </Button>
          </div>
          
          {/* Invitation Status Checker - Collapsible */}
          {showInvitationChecker && (
            <div className="mt-4 border-t pt-4">
              <InvitationStatusChecker />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role-based Tabs - UPDATED LABELS */}
      <Card className="mb-4">
        <CardHeader className="p-4 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Select Category</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Show users for one category at a time: writers, freelancers, clients, or admins
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-4 md:p-6">
          <Tabs value={activeRoleTab} onValueChange={(v) => {
            setActiveRoleTab(v as any);
            pushRoleToUrl(v);
          }} className="w-full">
            <TabsList className="grid grid-cols-7 w-full gap-1 h-auto p-1">
              <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Users className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>All Users</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{users.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="freelancers" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Briefcase className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>Writers/Freelancers</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{freelancers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="account_owners" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>Account Owners</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{accountOwnersOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="regular_clients" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>Regular Clients</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{regularClientsOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="on_hold_clients" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>On Hold Clients</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{onHoldClientsOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="managers" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <UserCog className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>Managers</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{managers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="admins" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Shield className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>Admins</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{admins.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Users Table - Single Card with Selected Category */}
      <Card>
        <CardHeader className="p-4 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg capitalize">
            {roleTabLabel[activeRoleTab]}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {activeRoleTab === 'freelancers' ? (
              <>Showing {currentList.length} academic writers, essay writers, assignment helpers, and freelancers available for online jobs</>
            ) : (
              <>Showing {currentList.length} {roleTabLabel[activeRoleTab].toLowerCase()}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-4 md:p-6">
          {loadingUsers ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
              No {roleTabLabel[activeRoleTab].toLowerCase()} found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Role</TableHead>
                    {activeRoleTab !== 'admins' && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                        {activeRoleTab === 'freelancers' ? 'Badge' : 'Tier'}
                      </TableHead>
                    )}
                    {showPriorityColumn && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Priority</TableHead>
                    )}
                    {(activeRoleTab === 'clients' || activeRoleTab === 'account_owners') && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Payment Terms</TableHead>
                    )}
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Phone</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Rating</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Stats</TableHead>
                    {activeRoleTab === 'freelancers' && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Balance</TableHead>
                    )}
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                        <Link 
                          href={
                            u.role === 'client' || u.role === 'account_owner' 
                              ? `/admin/user-management/clients/${u.id}`
                              : u.role === 'freelancer'
                              ? `/admin/user-management/freelancers/${u.id}`
                              : `/admin/users/${u.id}`
                          }
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {u.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="capitalize text-[8px] sm:text-xs">
                          {u.role}
                        </Badge>
                      </TableCell>
                      {activeRoleTab !== 'admins' && (
                        <TableCell className="whitespace-nowrap">
                          {u.role === 'freelancer' ? (
                            <FreelancerBadgeDisplay badge={u.freelancerBadge} />
                          ) : u.role === 'client' || u.role === 'account_owner' ? (
                            <ClientTierDisplay tier={u.clientTier} />
                          ) : (
                            <span className="text-muted-foreground text-[10px] sm:text-xs">N/A</span>
                          )}
                        </TableCell>
                      )}
                      {showPriorityColumn && (
                        <TableCell className="whitespace-nowrap">
                          {(u.role === 'client' || u.role === 'account_owner') ? (
                            <ClientPriorityDisplay priority={u.clientPriority} />
                          ) : (
                            <span className="text-muted-foreground text-[10px] sm:text-xs">N/A</span>
                          )}
                        </TableCell>
                      )}
                      {(activeRoleTab === 'clients' || activeRoleTab === 'account_owners') && (
                        <TableCell className="whitespace-nowrap">
                          {(u.role === 'client' || u.role === 'account_owner') ? (
                            <PaymentTermsDisplay terms={u.paymentTerms} />
                          ) : (
                            <span className="text-muted-foreground text-[10px] sm:text-xs">N/A</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{u.phone || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.rating ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="text-[10px] sm:text-xs md:text-sm">{u.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs md:text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground space-y-1">
                          <div>Jobs: {u.completedJobs ?? 0}</div>
                          {(u.role === 'client' || u.role === 'account_owner') && <div>Spent: KSh {(u.totalSpent ?? 0).toFixed(0)}</div>}
                        </div>
                      </TableCell>
                      {activeRoleTab === 'freelancers' && (
                        <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                          KSh {(u.balance ?? 0).toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge user={u} size="sm" />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
                          {getUserStatusCategory(u) === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('approve');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('reject');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <XCircle className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </>
                          )}
                          {canUserPerformActions(u) && (
                            <>
                              {u.role === 'freelancer' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedBadge(u.freelancerBadge || 'bronze');
                                    setActionType('badge');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Award className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Badge</span>
                                </Button>
                              )}
                              {(u.role === 'client' || u.role === 'account_owner') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedTier(u.clientTier || 'basic');
                                    setActionType('tier');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Crown className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Tier</span>
                                </Button>
                              )}
                              {(u.role === 'client' || u.role === 'account_owner') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedPriority(u.clientPriority || 'regular');
                                    setActionType('priority');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Zap className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Priority</span>
                                </Button>
                              )}
                              {(u.role === 'client' || u.role === 'account_owner') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedPaymentTerms(u.paymentTerms || 'pod');
                                    setActionType('payment-terms');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <CreditCard className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Payment</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('suspend');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <Ban className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Suspend</span>
                              </Button>
                            </>
                          )}
                          {getUserStatusCategory(u) === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('unsuspend');
                              }}
                              className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                            >
                              <PlayCircle className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Unsuspend</span>
                            </Button>
                          )}
                          {canUserPerformActions(u) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('remove');
                              }}
                              className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                            >
                              <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Remove</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== DIALOGS FOR ALL ACTIONS ====== */}
      
      {/* Approve/Reject/Remove/Unsuspend AlertDialog */}
      <AlertDialog open={!!selectedUser && ['approve', 'reject', 'remove', 'unsuspend'].includes(actionType || '')} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Approve User'}
              {actionType === 'reject' && 'Reject User'}
              {actionType === 'remove' && 'Remove User'}
              {actionType === 'unsuspend' && 'Unsuspend User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && `Are you sure you want to approve ${selectedUser?.name}? They will gain full access to the platform and can start using all features.`}
              {actionType === 'reject' && `Are you sure you want to reject ${selectedUser?.name}? Their status will be set to rejected and they will be notified.`}
              {actionType === 'remove' && `Are you sure you want to permanently remove ${selectedUser?.name} from the system? This action cannot be undone.`}
              {actionType === 'unsuspend' && `Are you sure you want to unsuspend ${selectedUser?.name}? They will regain access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  if (actionType === 'approve') handleApprove(selectedUser.id);
                  if (actionType === 'reject') handleReject(selectedUser.id);
                  if (actionType === 'remove') handleRemove(selectedUser.id);
                  if (actionType === 'unsuspend') handleUnsuspend(selectedUser.id);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <Dialog open={actionType === 'suspend'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setSuspendDuration('7');
          setSuspendReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Temporarily suspend {selectedUser?.name} from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Suspension Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Suspension *</Label>
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
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setSuspendDuration('7');
              setSuspendReason('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSuspend}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={actionType === 'blacklist'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setBlacklistReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist User</DialogTitle>
            <DialogDescription>
              Permanently blacklist {selectedUser?.name} from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blacklistReason">Reason for Blacklist *</Label>
              <Textarea
                id="blacklistReason"
                placeholder="Enter reason for blacklist..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setBlacklistReason('');
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlacklist}>
              Blacklist User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Update Dialog */}
      <Dialog open={actionType === 'badge'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setSelectedBadge('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Freelancer Badge</DialogTitle>
            <DialogDescription>
              Update badge for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="badge">Select Badge</Label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">?? Bronze (0-9 orders)</SelectItem>
                  <SelectItem value="silver">?? Silver (10-24 orders)</SelectItem>
                  <SelectItem value="gold">?? Gold (25-49 orders)</SelectItem>
                  <SelectItem value="platinum">?? Platinum (50-99 orders)</SelectItem>
                  <SelectItem value="elite">?? Elite (100+ orders)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setSelectedBadge('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleBadgeUpdate}>
              Update Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Update Dialog */}
      <Dialog open={actionType === 'tier'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setSelectedTier('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Client Tier</DialogTitle>
            <DialogDescription>
              Update tier for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Select Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">?? Basic</SelectItem>
                  <SelectItem value="silver">?? Silver</SelectItem>
                  <SelectItem value="gold">?? Gold</SelectItem>
                  <SelectItem value="platinum">?? Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setSelectedTier('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleTierUpdate}>
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Update Dialog */}
      <Dialog open={actionType === 'priority'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setSelectedPriority('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Client Priority</DialogTitle>
            <DialogDescription>
              Update priority for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Select Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">?? Regular</SelectItem>
                  <SelectItem value="priority">? Priority</SelectItem>
                  <SelectItem value="vip">?? VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setSelectedPriority('');
            }}>
              Cancel
            </Button>
            <Button onClick={handlePriorityUpdate}>
              Update Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Terms Update Dialog */}
      <Dialog open={actionType === 'payment-terms'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
          setSelectedPaymentTerms('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Terms</DialogTitle>
            <DialogDescription>
              Update payment terms for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Select Payment Terms</Label>
              <Select value={selectedPaymentTerms} onValueChange={setSelectedPaymentTerms}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod">
                    <div className="flex flex-col">
                      <span>?? Pay on Delivery (POD)</span>
                      <span className="text-xs text-muted-foreground">Payment required after work delivery</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="poa">
                    <div className="flex flex-col">
                      <span>? Pay on Approval (POA)</span>
                      <span className="text-xs text-muted-foreground">Payment required after client approval</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Payment Terms Explained:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><strong>POD (Pay on Delivery):</strong> Client must pay after work is delivered before full access</li>
                <li><strong>POA (Pay on Approval):</strong> Client gets immediate access and pays after approval</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setSelectedPaymentTerms('');
            }}>
              Cancel
            </Button>
            <Button onClick={handlePaymentTermsUpdate}>
              Update Payment Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialogs */}
      <InviteManagerDialog 
        open={inviteManagerOpen} 
        onOpenChange={setInviteManagerOpen} 
        onInviteSuccess={() => fetchUsers()}
      />
      <InviteClientDialog 
        open={inviteClientOpen} 
        onOpenChange={setInviteClientOpen} 
        onInviteSuccess={() => fetchUsers()}
      />
      <InviteFreelancerDialog 
        open={inviteFreelancerOpen} 
        onOpenChange={setInviteFreelancerOpen} 
        onInviteSuccess={() => fetchUsers()}
      />
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  );
}
