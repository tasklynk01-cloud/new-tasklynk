"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Briefcase, 
  Search, 
  RefreshCw, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle,
  UserCog,
  DollarSign,
  TrendingUp,
  Edit,
  Award,
  Crown,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: number;
  displayId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  balance?: number;
  totalSpent?: number;
  completedJobs?: number;
  assignedManagerId?: number | null;
  tier?: string;
  priority?: string;
  clientTier?: string | null;
  clientPriority?: string | null;
};

export default function ClientsManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit form state
  const [editTier, setEditTier] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editBudget, setEditBudget] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      const clientsRes = await safeApiFetch('/api/users?role=client', {
        credentials: 'include',
      });
      
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      } else {
        toast.error('Failed to load clients');
      }

      const managersRes = await safeApiFetch('/api/users/by-role?role=manager&approved=true', {
        credentials: 'include',
      });
      
      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      
      let endpoint = '';
      let method: 'POST' | 'PATCH' = 'POST';
      let body: any = undefined;
      
      if (newStatus === 'approved') {
        endpoint = `/api/users/${userId}/approve`;
      } else if (newStatus === 'suspended') {
        endpoint = `/api/users/${userId}/suspend`;
        method = 'PATCH';
        body = JSON.stringify({ duration: 7, reason: 'Suspended by admin' });
      } else if (newStatus === 'rejected') {
        endpoint = `/api/users/${userId}/reject`;
      } else if (newStatus === 'unsuspend') {
        endpoint = `/api/users/${userId}/unsuspend`;
        newStatus = 'approved';
        method = 'PATCH';
      }

      const response = await safeApiFetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        ...(body ? { body } : {}),
      });

      if (response.ok) {
        toast.success(`Client ${newStatus} successfully`);
        await fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || errorData.message || `Failed to ${newStatus} client`);
        console.error('Status change failed:', errorData);
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      const managerIdValue = selectedManagerId === '0' ? null : parseInt(selectedManagerId);
      
      const response = await safeApiFetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ assignedManagerId: managerIdValue }),
      });

      if (response.ok) {
        toast.success(managerIdValue ? 'Manager assigned successfully' : 'Manager removed successfully');
        setShowAssignDialog(false);
        setSelectedUser(null);
        setSelectedManagerId('');
        await fetchData();
      } else {
        toast.error('Failed to assign manager');
      }
    } catch (error) {
      console.error('Assign manager error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClient = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      const updates: any = {};
      if (editTier) updates.clientTier = editTier;
      if (editPriority) updates.clientPriority = editPriority;
      if (editBudget) updates.balance = parseFloat(editBudget);

      const response = await safeApiFetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Client updated successfully');
        setShowEditDialog(false);
        setSelectedUser(null);
        setEditTier('');
        setEditPriority('');
        setEditBudget('');
        await fetchData();
      } else {
        toast.error('Failed to update client');
      }
    } catch (error) {
      console.error('Edit client error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      client.status === statusFilter ||
      (statusFilter === 'approved' && (client.status === 'approved' || client.status === 'active'));
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      rejected: { label: 'Rejected', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' },
    };
    
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={`${config.className} rounded-xl`}>{config.label}</Badge>;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Client Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage all clients, approve/reject applications, and assign managers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {clients.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.status === 'approved' || c.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {clients.filter(c => c.status === 'suspended').length}
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>View and manage all client accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/admin/user-management/clients/${client.id}`)}
                  className="border-2 rounded-xl p-5 transition-all hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg">
                          {client.name}
                        </h3>
                        <Badge variant="outline" className="rounded-xl">{client.displayId}</Badge>
                        {getStatusBadge(client.status)}
                        {/* Client Tier Badge */}
                        {(client.clientTier || client.tier) && (
                          <Badge className={`rounded-xl flex items-center gap-1 ${
                            (client.clientTier || client.tier) === 'platinum' ? 'bg-purple-600 text-white' :
                            (client.clientTier || client.tier) === 'gold' ? 'bg-yellow-500 text-white' :
                            (client.clientTier || client.tier) === 'silver' ? 'bg-gray-400 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            <Crown className="w-4 h-4" />
                            {((client.clientTier || client.tier) || 'Basic').charAt(0).toUpperCase() + ((client.clientTier || client.tier) || 'basic').slice(1)}
                          </Badge>
                        )}
                        {/* Client Priority Badge */}
                        {(client.clientPriority || client.priority) && (client.clientPriority || client.priority) !== 'regular' && (
                          <Badge className={`rounded-xl flex items-center gap-1 ${
                            (client.clientPriority || client.priority) === 'vip' ? 'bg-destructive text-white' :
                            (client.clientPriority || client.priority) === 'priority' ? 'bg-orange-600 text-white' :
                            'bg-slate-500 text-white'
                          }`}>
                            <Zap className="w-4 h-4" />
                            {((client.clientPriority || client.priority) || '').toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{client.email}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {client.totalSpent !== undefined && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Spent: KSh {client.totalSpent?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        {client.completedJobs !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span>{client.completedJobs || 0} orders</span>
                          </div>
                        )}
                        {client.balance !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Budget: KSh {client.balance?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-3">
                        {client.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleStatusChange(client.id, 'approved')}
                              disabled={actionLoading}
                              size="sm"
                              className="rounded-xl"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(client.id, 'rejected')}
                              disabled={actionLoading}
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(client.status === 'approved' || client.status === 'active') && (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedUser(client);
                                setEditTier(client.clientTier || '');
                                setEditPriority(client.clientPriority || '');
                                setEditBudget(client.balance?.toString() || '');
                                setShowEditDialog(true);
                              }}
                              disabled={actionLoading}
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedUser(client);
                                setSelectedManagerId(client.assignedManagerId?.toString() || '0');
                                setShowAssignDialog(true);
                              }}
                              disabled={actionLoading}
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                            >
                              <UserCog className="w-4 h-4 mr-2" />
                              Manager
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(client.id, 'suspended')}
                              disabled={actionLoading}
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </Button>
                          </>
                        )}
                        {client.status === 'suspended' && (
                          <Button
                            onClick={() => handleStatusChange(client.id, 'unsuspend')}
                            disabled={actionLoading}
                            size="sm"
                            className="rounded-xl"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Unsuspend
                          </Button>
                        )}
                      </div>
                      {/* Assigned Manager Display */}
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Assigned Manager:</span>{' '}
                        <span className="font-medium">
                          {client.assignedManagerId
                            ? (managers.find(m => m.id === client.assignedManagerId)?.name || `ID ${client.assignedManagerId}`)
                            : 'No manager assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update tier, priority, and budget for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tier</Label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget (KSh)</Label>
              <Input
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEditClient} disabled={actionLoading} className="rounded-xl">
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Select a manager to assign to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0">No Manager</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAssignManager} disabled={actionLoading} className="rounded-xl">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
