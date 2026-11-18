"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { 
  Building, 
  Users, 
  DollarSign, 
  FileText, 
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  User,
  Calendar,
  Crown,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type LinkedUser = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  approved: boolean;
  totalSpent: number;
  completedJobs: number;
  createdAt: string;
};

type RecentOrder = {
  id: number;
  displayId: string;
  title: string;
  status: string;
  totalCost: number;
  deadline: string;
  createdAt: string;
  clientId: number;
};

type Account = {
  id: number;
  accountName: string;
  contactPerson: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
};

type AvailableClient = {
  id: number;
  displayId: string;
  name: string;
  email: string;
};

export default function AdminAccountDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  // Link user dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [availableClients, setAvailableClients] = useState<AvailableClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [setAsOwner, setSetAsOwner] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchAccountDetails();
    }
  }, [user, authLoading, router, accountId]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/v2/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
        setLinkedUsers(data.linkedUsers || []);
        setRecentOrders(data.recentOrders || []);
        setOrderStats(data.orderStats || {
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          totalSpent: 0,
        });
      } else {
        toast.error('Failed to load account details');
        router.push('/admin/accounts');
      }
    } catch (error) {
      console.error('Failed to fetch account details:', error);
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClients = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      // Fetch clients not linked to any account
      const response = await safeApiFetch('/api/v2/clients?unlinked=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch available clients:', error);
    }
  };

  const handleLinkUser = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    try {
      setLinking(true);
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/v2/accounts/${accountId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: parseInt(selectedClientId),
          setAsOwner,
        }),
      });

if (response.ok) {
        toast.success('User linked to account successfully');
        setShowLinkDialog(false);
        setSelectedClientId('');
        setSetAsOwner(false);
        fetchAccountDetails();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to link user'));
      }
    } catch (error) {
      console.error('Failed to link user:', error);
      toast.error('Failed to link user');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/v2/accounts/${accountId}/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

if (response.ok) {
        toast.success('User unlinked from account');
        fetchAccountDetails();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to unlink user'));
      }
    } catch (error) {
      console.error('Failed to unlink user:', error);
      toast.error('Failed to unlink user');
    }
  };

  const openLinkDialog = () => {
    fetchAvailableClients();
    setShowLinkDialog(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Link */}
      <div className="mb-4">
        <Link 
          href="/admin/accounts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Accounts
        </Link>
      </div>

      {/* Account Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{account.accountName}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {account.contactPerson}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {account.contactEmail}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={openLinkDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Link User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Linked Users</p>
                <p className="text-2xl font-bold">{linkedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{orderStats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-amber-100">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">KSh {orderStats.totalSpent.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linked Users */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            Linked Users ({linkedUsers.length})
          </CardTitle>
          <CardDescription>Users associated with this account</CardDescription>
        </CardHeader>
        <CardContent>
          {linkedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No users linked to this account</p>
              <Button className="mt-4" onClick={openLinkDialog}>
                <UserPlus className="h-4 w-4 mr-2" />
                Link First User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedUsers.map((linkedUser) => (
                  <TableRow key={linkedUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {linkedUser.role === 'account_owner' && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{linkedUser.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {linkedUser.displayId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{linkedUser.email}</TableCell>
                    <TableCell>{linkedUser.phone}</TableCell>
                    <TableCell>
                      <Badge variant={linkedUser.role === 'account_owner' ? 'default' : 'secondary'}>
                        {linkedUser.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={linkedUser.approved ? 'default' : 'outline'}>
                        {linkedUser.approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{linkedUser.completedJobs}</TableCell>
                    <TableCell className="text-right text-green-600">
                      KSh {linkedUser.totalSpent.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleUnlinkUser(linkedUser.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest orders from account users</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link 
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{order.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {order.displayId}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-green-600">
                      KSh {order.totalCost?.toFixed(2) || '0.00'}
                    </span>
                    <span>•</span>
                    <span>Due: {format(new Date(order.deadline), 'MMM dd, yyyy')}</span>
                    <span>•</span>
                    <span>Posted: {format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link User Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link User to Account</DialogTitle>
            <DialogDescription>
              Select a client to link to {account.accountName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="client">Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableClients.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No unlinked clients available. All clients are already linked to accounts.
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="setAsOwner"
                checked={setAsOwner}
                onCheckedChange={(checked) => setSetAsOwner(!!checked)}
              />
              <Label htmlFor="setAsOwner" className="text-sm font-normal cursor-pointer">
                Set as Account Owner (can manage account users)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkUser} disabled={linking || !selectedClientId}>
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                'Link User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
