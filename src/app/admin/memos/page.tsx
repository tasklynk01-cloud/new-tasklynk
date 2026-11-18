"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, Plus, Eye, Trash2, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

type Memo = {
  id: number;
  title: string;
  content: string;
  targetRole: string;
  priority: string;
  requiresAcknowledgement: boolean;
  expiresAt: string | null;
  createdBy: number;
  createdAt: string;
  readCount?: number;
  totalTargetUsers?: number;
};

export default function AdminMemosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loadingMemos, setLoadingMemos] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>(['all']); // Support multiple roles
  const [priority, setPriority] = useState('normal');
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchMemos();
      }
    }
  }, [user, loading, router]);

  const fetchMemos = async () => {
    try {
      const response = await safeApiFetch('/api/v2/memos', {
        credentials: 'include', // Use session cookie
      });
      if (response.ok) {
        const data = await response.json();
        setMemos(data.memos || []);
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    } finally {
      setLoadingMemos(false);
    }
  };

  const handleCreateMemo = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await safeApiFetch('/api/v2/memos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use session cookie
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetRoles, // Send array of selected roles
          priority,
          requiresAcknowledgement,
          expiresAt: expiresAt || null,
        }),
      });

      if (response.ok) {
        toast.success('Success! Memo created and sent to users.');
        setShowCreateDialog(false);
        resetForm();
        fetchMemos();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to create memo'));
      }
    } catch (error) {
      console.error('Create memo error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('Are you sure you want to delete this memo? Users who haven\'t read it will no longer see it.')) {
      return;
    }

    try {
      const response = await safeApiFetch(`/api/v2/memos/${memoId}`, {
        method: 'DELETE',
        credentials: 'include', // Use session cookie
      });

      if (response.ok) {
        toast.success('Memo deleted successfully');
        fetchMemos();
      } else {
        toast.error('Failed to delete memo');
      }
    } catch (error) {
      console.error('Delete memo error:', error);
      toast.error('Network error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetRoles(['all']);
    setPriority('normal');
    setRequiresAcknowledgement(true);
    setExpiresAt('');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      all: 'bg-purple-600',
      admin: 'bg-destructive',
      client: 'bg-blue-600',
      freelancer: 'bg-green-600',
      manager: 'bg-primary',
      editor: 'bg-orange-600',
      account_owner: 'bg-pink-600',
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-600'}>
        {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-4 lg:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <Megaphone className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              System Memos & Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage important announcements for users. Memos can be targeted to specific roles and require acknowledgement.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-3">
            <Plus className="w-4 h-4" />
            Create Memo
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Memos</p>
                <p className="text-3xl font-bold">{memos.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-blue-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Memos</p>
                <p className="text-3xl font-bold text-green-600">
                  {memos.filter(m => !m.expiresAt || new Date(m.expiresAt) > new Date()).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent Memos</p>
                <p className="text-3xl font-bold text-red-600">
                  {memos.filter(m => m.priority === 'urgent' || m.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memos List */}
      <Card>
        <CardHeader>
          <CardTitle>All Memos ({memos.length})</CardTitle>
          <CardDescription>
            View and manage all system memos. Click on a memo to see read statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMemos ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : memos.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No memos created yet</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4" variant="outline">
                Create Your First Memo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Read Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memos.map((memo) => {
                  const isExpired = memo.expiresAt && new Date(memo.expiresAt) < new Date();
                  const readPercentage = memo.totalTargetUsers && memo.totalTargetUsers > 0
                    ? ((memo.readCount || 0) / memo.totalTargetUsers) * 100
                    : 0;

                  return (
                    <TableRow key={memo.id} className={isExpired ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{memo.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {memo.content.substring(0, 100)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(memo.targetRole)}</TableCell>
                      <TableCell>{getPriorityBadge(memo.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {memo.readCount || 0} / {memo.totalTargetUsers || 0}
                          </span>
                          {memo.totalTargetUsers && memo.totalTargetUsers > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {readPercentage.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(memo.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {memo.expiresAt ? (
                          <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date(memo.expiresAt).toLocaleDateString()}
                            {isExpired && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('View details feature coming soon')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMemo(memo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Memo Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Megaphone className="w-5 h-5" />
              Create New Memo
            </DialogTitle>
            <DialogDescription>
              Create an announcement or important message for users. You can target specific roles and set priority levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., System Maintenance Schedule"
                className="mt-1"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Message Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement or memo here..."
                rows={8}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} characters
              </p>
            </div>

            {/* Target Roles (Multi-Select) */}
            <div>
              <Label>Target Audience * (Select one or more)</Label>
              <div className="mt-2 space-y-2 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="role-all"
                    checked={targetRoles.includes('all')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTargetRoles(['all']);
                      } else {
                        setTargetRoles([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="role-all" className="cursor-pointer font-normal">
                    All Users (Clients, Freelancers, Managers - excludes Admin)
                  </Label>
                </div>
                
                {!targetRoles.includes('all') && (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="role-client"
                        checked={targetRoles.includes('client')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, 'client']);
                          } else {
                            setTargetRoles(targetRoles.filter(r => r !== 'client'));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="role-client" className="cursor-pointer font-normal">
                        Clients
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="role-freelancer"
                        checked={targetRoles.includes('freelancer')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, 'freelancer']);
                          } else {
                            setTargetRoles(targetRoles.filter(r => r !== 'freelancer'));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="role-freelancer" className="cursor-pointer font-normal">
                        Freelancers
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="role-manager"
                        checked={targetRoles.includes('manager')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, 'manager']);
                          } else {
                            setTargetRoles(targetRoles.filter(r => r !== 'manager'));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="role-manager" className="cursor-pointer font-normal">
                        Managers
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="role-account_owner"
                        checked={targetRoles.includes('account_owner')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, 'account_owner']);
                          } else {
                            setTargetRoles(targetRoles.filter(r => r !== 'account_owner'));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="role-account_owner" className="cursor-pointer font-normal">
                        Account Owners
                      </Label>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {targetRoles.includes('all') 
                  ? 'Memo will be shown to all non-admin users' 
                  : `Selected: ${targetRoles.length} role(s)`}
              </p>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority Level *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General information</SelectItem>
                  <SelectItem value="normal">Normal - Standard announcement</SelectItem>
                  <SelectItem value="high">High - Important message</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical alert (with animation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requires Acknowledgement */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresAck"
                checked={requiresAcknowledgement}
                onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresAck" className="cursor-pointer">
                Require users to acknowledge (blocks access until confirmed)
              </Label>
            </div>

            {/* Expiry Date (Optional) */}
            <div>
              <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for no expiry. Users who haven't read it won't see it after expiry.
              </p>
            </div>

            {/* Warning Alert */}
            {requiresAcknowledgement && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>Blocking Memo:</strong> Users in the target audience will see a popup that blocks all activity until they acknowledge this memo.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCreateMemo}
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1"
            >
              {submitting ? 'Creating...' : 'Create & Send Memo'}
            </Button>
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={submitting}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
