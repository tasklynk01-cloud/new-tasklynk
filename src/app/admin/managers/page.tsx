"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, UserCog, Users, FileText, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { InviteManagerDialog } from '@/components/invite-manager-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

type Manager = {
  id: number;
  name: string;
  email: string;
  approved: boolean;
  assignedClientsCount?: number;
  assignedWritersCount?: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedManagerId: number | null;
};

export default function AdminManagersManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [writers, setWriters] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Assignment dialog state
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [selectedWriterIds, setSelectedWriterIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  
  // Invite Manager Dialog
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);

  const getAuthHeader = () => {
    return {};
  };

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
      const [managersRes, clientsRes, writersRes] = await Promise.all([
        safeApiFetch('/api/users?role=manager', { credentials: 'include' }),
        safeApiFetch('/api/users?role=client,account_owner', { credentials: 'include' }),
        safeApiFetch('/api/users?role=freelancer', { credentials: 'include' })
      ]);

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }
      if (writersRes.ok) {
        const writersData = await writersRes.json();
        setWriters(writersData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const openAssignDialog = (manager: Manager) => {
    setSelectedManager(manager);
    
    // Pre-select clients and writers already assigned to this manager
    const assignedClients = clients
      .filter(c => c.assignedManagerId === manager.id)
      .map(c => c.id);
    const assignedWriters = writers
      .filter(w => w.assignedManagerId === manager.id)
      .map(w => w.id);
    
    setSelectedClientIds(assignedClients);
    setSelectedWriterIds(assignedWriters);
    setAssignDialogOpen(true);
  };

  const handleAssignUsers = async () => {
    if (!selectedManager) return;

    try {
      setAssigning(true);
      const res = await safeApiFetch(`/api/admin/managers/${selectedManager.id}/assign-users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientIds: selectedClientIds,
          writerIds: selectedWriterIds
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic state update: reflect new assignments immediately
        setClients(prev => prev.map(c => {
          if (selectedClientIds.includes(c.id)) return { ...c, assignedManagerId: selectedManager.id };
          if (c.assignedManagerId === selectedManager.id && !selectedClientIds.includes(c.id)) return { ...c, assignedManagerId: null };
          return c;
        }));
        setWriters(prev => prev.map(w => {
          if (selectedWriterIds.includes(w.id)) return { ...w, assignedManagerId: selectedManager.id };
          if (w.assignedManagerId === selectedManager.id && !selectedWriterIds.includes(w.id)) return { ...w, assignedManagerId: null };
          return w;
        }));

        toast.success(`Assigned ${data.assignedClients} client(s) and ${data.assignedWriters} writer(s) to ${selectedManager.name}`);
        setAssignDialogOpen(false);
        setSelectedManager(null);
        setSelectedClientIds([]);
        setSelectedWriterIds([]);
        // Optional: background refresh to ensure consistency
        // fetchData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(extractErrorMessage(error, 'Failed to assign users'));
      }
    } catch (error) {
      console.error('Failed to assign users:', error);
      toast.error('Failed to assign users');
    } finally {
      setAssigning(false);
    }
  };

  const toggleClient = (clientId: number) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleWriter = (writerId: number) => {
    setSelectedWriterIds(prev =>
      prev.includes(writerId)
        ? prev.filter(id => id !== writerId)
        : [...prev, writerId]
    );
  };

  const approvedManagers = managers.filter(m => m.approved);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6">
      {/* Floating Back Button */}
      <Link 
        href="/admin/dashboard"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
      >
        <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        <span className="absolute right-full mr-2 sm:mr-3 px-2 sm:px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Back to Dashboard
        </span>
      </Link>

      {/* Header Section with Invite Button */}
      <div className="mb-6 sm:mb-8 border-b pb-4">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserCog className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold">Manage Managers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Assign clients and writers to managers for better organization
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button 
              onClick={() => setInviteManagerOpen(true)} 
              variant="default" 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg hover:from-blue-700 hover:to-cyan-600 transition-all whitespace-nowrap"
            >
              <Mail className="w-5 h-5 mr-2" />
              Invite Manager
            </Button>
          </div>
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-3">
                  <UserCog className="w-4 h-4" />
                  Total Managers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                  {approvedManagers.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                  {clients.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  Total Writers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                  {writers.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Managers Table */}
          <Card>
            <CardHeader className="p-4 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Manager Assignments</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Click "Assign Users" to manage client and writer assignments for each manager
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-4 md:p-6">
              {approvedManagers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No approved managers found. Approve managers first to assign users.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Manager</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Email</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Assigned Clients</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Assigned Writers</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedManagers.map((manager) => {
                        const assignedClientsCount = clients.filter(c => c.assignedManagerId === manager.id).length;
                        const assignedWritersCount = writers.filter(w => w.assignedManagerId === manager.id).length;
                        
                        return (
                          <TableRow 
                            key={manager.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                              {manager.name}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                              {manager.email}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={assignedClientsCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs">
                                {assignedClientsCount} Clients
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={assignedWritersCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs">
                                {assignedWritersCount} Writers
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openAssignDialog(manager)}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Assign Users</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Invite Manager Dialog */}
      <InviteManagerDialog
        open={inviteManagerOpen}
        onOpenChange={setInviteManagerOpen}
        onInviteSuccess={() => {
          toast.success('Manager invitation sent successfully!');
          fetchData(); // Refresh the managers list
        }}
      />

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              Assign Users to {selectedManager?.name}
            </DialogTitle>
            <DialogDescription>
              Select clients and writers to assign to this manager. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Clients Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  Clients ({selectedClientIds.length} selected)
                </h3>
                <Badge variant="outline">{clients.length} total</Badge>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {clients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No clients available
                  </div>
                ) : (
                  <div className="divide-y">
                    {clients.map((client) => {
                      const isAssignedElsewhere = client.assignedManagerId && client.assignedManagerId !== selectedManager?.id;
                      return (
                        <div 
                          key={client.id} 
                          className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${isAssignedElsewhere ? 'opacity-60' : ''}`}
                        >
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={() => toggleClient(client.id)}
                          />
                          <Label 
                            htmlFor={`client-${client.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                            {isAssignedElsewhere && (
                              <div className="text-xs text-orange-500 mt-1">
                                Currently assigned to another manager
                              </div>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Writers Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-3">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Writers ({selectedWriterIds.length} selected)
                </h3>
                <Badge variant="outline">{writers.length} total</Badge>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {writers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No writers available
                  </div>
                ) : (
                  <div className="divide-y">
                    {writers.map((writer) => {
                      const isAssignedElsewhere = writer.assignedManagerId && writer.assignedManagerId !== selectedManager?.id;
                      return (
                        <div 
                          key={writer.id} 
                          className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${isAssignedElsewhere ? 'opacity-60' : ''}`}
                        >
                          <Checkbox
                            id={`writer-${writer.id}`}
                            checked={selectedWriterIds.includes(writer.id)}
                            onCheckedChange={() => toggleWriter(writer.id)}
                          />
                          <Label 
                            htmlFor={`writer-${writer.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{writer.name}</div>
                            <div className="text-xs text-muted-foreground">{writer.email}</div>
                            {isAssignedElsewhere && (
                              <div className="text-xs text-orange-500 mt-1">
                                Currently assigned to another manager
                              </div>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignUsers} 
              disabled={assigning}
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              {assigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Assignments
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
