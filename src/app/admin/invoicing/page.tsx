"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Users, 
  FileText, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Wallet,
  Receipt,
  Send,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { format } from 'date-fns';
import { InvoiceDownload } from '@/components/invoice-download';
import { SendInvoiceDialog } from '@/components/send-invoice-dialog';

type UserSummary = {
  user: {
    id: number;
    name: string;
    email: string;
    displayId: string;
    role: string;
  };
  currentBalance: number;
  unsettledAmount: number;
  unsettledOrdersCount: number;
  unsettledOrders: Array<{
    id: number;
    displayId: string;
    title: string;
    amount: number;
    completedAt: string;
  }>;
  totalSettledAllTime: number;
  recentSettlements: any[];
};

type Fine = {
  id: number;
  userId: number;
  fineAmount: number;
  fineType: string;
  reason: string;
  status: string;
  issuedAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
};

export default function AdminInvoicingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);
  
  const [activeTab, setActiveTab] = useState('summaries');
  const [loadingData, setLoadingData] = useState(true);
  
  // Invoice summaries state
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [totals, setTotals] = useState({ 
    totalFreelancerBalance: 0, 
    totalManagerBalance: 0, 
    totalUnsettledOrders: 0 
  });
  const [filterType, setFilterType] = useState<string>('all');
  
  // Settlement dialog state
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settling, setSettling] = useState(false);
  
  // Fine dialog state
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [fines, setFines] = useState<Fine[]>([]);
  const [fineUserId, setFineUserId] = useState<number | null>(null);
  const [fineAmount, setFineAmount] = useState('');
  const [fineType, setFineType] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [fineJobId, setFineJobId] = useState('');
  const [issuingFine, setIssuingFine] = useState(false);
  
  // Additional payment dialog state
  const [additionalPaymentDialogOpen, setAdditionalPaymentDialogOpen] = useState(false);
  const [additionalJobId, setAdditionalJobId] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalReason, setAdditionalReason] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);

  const getAuthHeader = () => {
    return {};
  };

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchData();
    }
  }, [loading, user, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch invoice summaries
      const summariesRes = await safeApiFetch(`/api/v2/admin/invoices?userType=${filterType}`, { credentials: 'include' });
      if (summariesRes.ok) {
        const data = await summariesRes.json();
        setSummaries(data.summaries || []);
        setTotals(data.totals || { totalFreelancerBalance: 0, totalManagerBalance: 0, totalUnsettledOrders: 0 });
      }
      
      // Fetch fines
      const finesRes = await safeApiFetch('/api/v2/admin/fines', { credentials: 'include' });
      if (finesRes.ok) {
        const finesData = await finesRes.json();
        setFines(finesData.fines || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load invoicing data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [filterType]);

  const openSettlementDialog = (userSummary: UserSummary) => {
    setSelectedUser(userSummary);
    setSelectedOrderIds(userSummary.unsettledOrders.map(o => o.id)); // Select all by default
    setSettlementNotes('');
    setSettlementDialogOpen(true);
  };

  const handleSettle = async () => {
    if (!selectedUser || selectedOrderIds.length === 0) {
      toast.error('Please select at least one order to settle');
      return;
    }

    try {
      setSettling(true);
      const res = await safeApiFetch('/api/v2/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          userId: selectedUser.user.id,
          orderIds: selectedOrderIds,
          notes: settlementNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Settlement completed successfully');
        setSettlementDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(extractErrorMessage(error, 'Failed to settle invoices'));
      }
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to settle invoices');
    } finally {
      setSettling(false);
    }
  };

  const openFineDialog = (userId?: number) => {
    setFineUserId(userId || null);
    setFineAmount('');
    setFineType('');
    setFineReason('');
    setFineJobId('');
    setFineDialogOpen(true);
  };

  const handleIssueFine = async () => {
    if (!fineUserId || !fineAmount || !fineType || !fineReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIssuingFine(true);
      const res = await safeApiFetch('/api/v2/admin/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          userId: fineUserId,
          fineAmount: parseFloat(fineAmount),
          fineType,
          reason: fineReason,
          jobId: fineJobId ? parseInt(fineJobId) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Fine issued successfully');
        setFineDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(extractErrorMessage(error, 'Failed to issue fine'));
      }
    } catch (error) {
      console.error('Issue fine error:', error);
      toast.error('Failed to issue fine');
    } finally {
      setIssuingFine(false);
    }
  };

  const handleAddAdditionalPayment = async () => {
    if (!additionalJobId || !additionalAmount || !additionalReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAddingPayment(true);
      const res = await safeApiFetch('/api/v2/admin/additional-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          jobId: parseInt(additionalJobId),
          additionalAmount: parseFloat(additionalAmount),
          reason: additionalReason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Additional payment added successfully');
        setAdditionalPaymentDialogOpen(false);
        setAdditionalJobId('');
        setAdditionalAmount('');
        setAdditionalReason('');
        fetchData();
      } else {
        const error = await res.json();
        toast.error(extractErrorMessage(error, 'Failed to add additional payment'));
      }
    } catch (error) {
      console.error('Add additional payment error:', error);
      toast.error('Failed to add additional payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
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
    <div className="w-full p-4 sm:p-6">
      {/* Back button */}
      <Link 
        href="/admin/dashboard"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
      >
        <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        <span className="absolute right-full mr-2 sm:mr-3 px-2 sm:px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Back to Dashboard
        </span>
      </Link>

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Invoicing & Payments</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage settlements, fines, and additional payments
              </p>
            </div>
          </div>
          
          {/* Primary Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/invoicing/create">
              <Button className="gap-3 bg-[#1B3A5F] hover:bg-[#2C4F7C]">
                <Plus className="w-4 h-4" />
                Create & Send Invoice
              </Button>
            </Link>
            <SendInvoiceDialog />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-3">
              <Wallet className="w-4 h-4 text-blue-500" />
              Freelancer Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KSh {totals.totalFreelancerBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaries.filter(s => s.user.role === 'freelancer').length} freelancers
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-3">
              <Wallet className="w-4 h-4 text-purple-500" />
              Manager Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              KSh {totals.totalManagerBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaries.filter(s => s.user.role === 'manager').length} managers
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-3">
              <FileText className="w-4 h-4 text-orange-500" />
              Unsettled Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totals.totalUnsettledOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending settlement
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-green-500" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {(totals.totalFreelancerBalance + totals.totalManagerBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SendInvoiceDialog
          trigger={
            <Button variant="default">
              <Mail className="w-4 h-4 mr-2" />
              Send Invoice to Client
            </Button>
          }
          onSuccess={fetchData}
        />
        <Button onClick={() => setAdditionalPaymentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Additional Payment
        </Button>
        <Button variant="destructive" onClick={() => openFineDialog()}>
          <Minus className="w-4 h-4 mr-2" />
          Issue Fine
        </Button>
        {summaries.length > 0 && (
          <InvoiceDownload
            items={summaries.flatMap(summary => 
              summary.unsettledOrders.map(order => ({
                orderId: order.displayId,
                title: order.title,
                freelancer: summary.user.role === 'freelancer' ? summary.user.name : undefined,
                manager: summary.user.role === 'manager' ? summary.user.name : undefined,
                amount: order.amount,
                date: order.completedAt,
                status: 'Unsettled',
              }))
            )}
            title="Unsettled Invoices Report"
            subtitle={`${filterType === 'all' ? 'All Users' : filterType === 'freelancer' ? 'Freelancers Only' : 'Managers Only'}`}
            totalAmount={totals.totalFreelancerBalance + totals.totalManagerBalance}
            userRole="Admin"
          />
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summaries">Invoice Summaries</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="summaries">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>User Invoice Summaries</CardTitle>
                  <CardDescription>View and settle outstanding balances</CardDescription>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="freelancer">Freelancers</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users with unsettled balances found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Unsettled Orders</TableHead>
                        <TableHead>Unsettled Amount</TableHead>
                        <TableHead>Total Settled</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaries.map((summary) => (
                        <TableRow key={summary.user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{summary.user.name}</div>
                              <div className="text-xs text-muted-foreground">{summary.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={summary.user.role === 'freelancer' ? 'default' : 'secondary'}>
                              {summary.user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{summary.unsettledOrdersCount}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            KSh {summary.unsettledAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            KSh {summary.totalSettledAllTime.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                onClick={() => openSettlementDialog(summary)}
                                disabled={summary.unsettledOrdersCount === 0}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openFineDialog(summary.user.id)}
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Fine
                              </Button>
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
        </TabsContent>

        <TabsContent value="fines">
          <Card>
            <CardHeader>
              <CardTitle>Issued Fines</CardTitle>
              <CardDescription>Track fines issued to freelancers and managers</CardDescription>
            </CardHeader>
            <CardContent>
              {fines.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No fines have been issued
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fines.map((fine) => (
                        <TableRow key={fine.id}>
                          <TableCell>
                            {format(new Date(fine.issuedAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{fine.user?.name || `User #${fine.userId}`}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{fine.fineType.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">
                            - KSh {fine.fineAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {fine.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fine.status === 'applied' ? 'destructive' : 'secondary'}>
                              {fine.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Dialog */}
      <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settle Invoice</DialogTitle>
            <DialogDescription>
              Settle outstanding balance for {selectedUser?.user.name}. 
              <span className="text-red-600 font-medium"> This action is irreversible.</span>
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">User</div>
                    <div className="font-medium">{selectedUser.user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Outstanding</div>
                    <div className="font-bold text-green-600">
                      KSh {selectedUser.unsettledAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Select Orders to Settle</Label>
                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                  {selectedUser.unsettledOrders.map((order) => (
                    <div 
                      key={order.id}
                      className="flex items-center gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleOrderSelection(order.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{order.displayId}</div>
                        <div className="text-sm text-muted-foreground truncate">{order.title}</div>
                      </div>
                      <div className="font-semibold">KSh {order.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Settlement Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    KSh {selectedUser.unsettledOrders
                      .filter(o => selectedOrderIds.includes(o.id))
                      .reduce((sum, o) => sum + o.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="settlementNotes">Notes (Optional)</Label>
                <Textarea
                  id="settlementNotes"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="Add any notes about this settlement..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettle} disabled={settling || selectedOrderIds.length === 0}>
              {settling ? 'Settling...' : 'Confirm Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Dialog */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Fine</DialogTitle>
            <DialogDescription>
              Issue a fine that will be deducted from the user's balance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fineUserId">User ID</Label>
              <Input
                id="fineUserId"
                type="number"
                value={fineUserId || ''}
                onChange={(e) => setFineUserId(parseInt(e.target.value) || null)}
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <Label htmlFor="fineAmount">Fine Amount (KSh)</Label>
              <Input
                id="fineAmount"
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="fineType">Fine Type</Label>
              <Select value={fineType} onValueChange={setFineType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fine type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_complaint">Client Complaint</SelectItem>
                  <SelectItem value="late_delivery">Late Delivery</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fineReason">Reason</Label>
              <Textarea
                id="fineReason"
                value={fineReason}
                onChange={(e) => setFineReason(e.target.value)}
                placeholder="Detailed explanation for the fine..."
              />
            </div>

            <div>
              <Label htmlFor="fineJobId">Related Job ID (Optional)</Label>
              <Input
                id="fineJobId"
                type="number"
                value={fineJobId}
                onChange={(e) => setFineJobId(e.target.value)}
                placeholder="Enter job ID if applicable"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleIssueFine} disabled={issuingFine}>
              {issuingFine ? 'Issuing...' : 'Issue Fine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Payment Dialog */}
      <Dialog open={additionalPaymentDialogOpen} onOpenChange={setAdditionalPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional Payment</DialogTitle>
            <DialogDescription>
              Add extra payment to a freelancer for a specific order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="additionalJobId">Job ID</Label>
              <Input
                id="additionalJobId"
                type="number"
                value={additionalJobId}
                onChange={(e) => setAdditionalJobId(e.target.value)}
                placeholder="Enter job ID"
              />
            </div>

            <div>
              <Label htmlFor="additionalAmount">Additional Amount (KSh)</Label>
              <Input
                id="additionalAmount"
                type="number"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
                placeholder="Enter amount to add"
              />
            </div>

            <div>
              <Label htmlFor="additionalReason">Reason</Label>
              <Textarea
                id="additionalReason"
                value={additionalReason}
                onChange={(e) => setAdditionalReason(e.target.value)}
                placeholder="Explain why additional payment is needed..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdditionalPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdditionalPayment} disabled={addingPayment}>
              {addingPayment ? 'Adding...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
