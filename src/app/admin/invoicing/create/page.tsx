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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  Download,
  Loader2,
  FileText,
  Mail,
  CheckCircle2,
  Users,
  Receipt,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { format } from 'date-fns';
import { InvoiceDownload, type InvoiceItem } from '@/components/invoice-download';

type User = {
  id: number;
  name: string;
  email: string;
  displayId: string;
  role: string;
  roleId: number;
};

type Order = {
  id: number;
  displayId: string;
  title: string;
  workType: string | null;
  pages: number | null;
  slides: number | null;
  amount: number;
  createdAt: string | null;
  status: string;
  clientName?: string;
  freelancerName?: string;
  paymentConfirmed?: boolean;
};

export default function CreateInvoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // User selection
  const [userType, setUserType] = useState<string>('client');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Order selection
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  
  // Invoice details
  const [customMessage, setCustomMessage] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<{
    invoiceNumber: string;
    email: string;
    orderCount: number;
    totalAmount: number;
  } | null>(null);

  // Auth check
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    }
  }, [loading, user, router]);

  // Fetch users when type changes
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [userType, user]);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim()) {
      const search = userSearch.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.displayId?.toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  // Fetch orders when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchUserOrders(selectedUserId);
    } else {
      setOrders([]);
      setSelectedOrderIds([]);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await safeApiFetch(`/api/v2/admin/invoice-users?userType=${userType}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserOrders = async (userId: number) => {
    try {
      setLoadingOrders(true);
      const res = await safeApiFetch(`/api/v2/admin/invoice-users?userId=${userId}&userType=${userType}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        // Auto-select all orders by default
        setSelectedOrderIds((data.orders || []).map((o: Order) => o.id));
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    try {
      setSending(true);
      const res = await safeApiFetch('/api/v2/admin/invoice-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          orderIds: selectedOrderIds,
          userType,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setInvoiceResult({
          invoiceNumber: data.invoiceNumber,
          email: data.email,
          orderCount: data.orderCount,
          totalAmount: data.totalAmount,
        });
        toast.success(`Invoice sent to ${data.email}`);
      } else {
        toast.error(extractErrorMessage(data, 'Failed to send invoice'));
      }
    } catch (error) {
      console.error('Send invoice error:', error);
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setInvoiceResult(null);
    setSelectedUserId(null);
    setSelectedOrderIds([]);
    setCustomMessage('');
    setUserSearch('');
  };

  const selectedTotal = orders
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Convert selected orders to invoice items for download
  const invoiceItems: InvoiceItem[] = orders
    .filter((o) => selectedOrderIds.includes(o.id))
    .map((order) => ({
      orderId: order.displayId,
      title: order.title,
      client: order.clientName,
      freelancer: order.freelancerName,
      workType: order.workType || undefined,
      pages: order.pages || undefined,
      slides: order.slides || undefined,
      amount: order.amount,
      date: order.createdAt || new Date().toISOString(),
      status: order.status,
    }));

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/invoicing">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoicing
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Receipt className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create & Send Invoice</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate invoices for clients, freelancers, or managers
            </p>
          </div>
        </div>
      </div>

      {success && invoiceResult ? (
        // Success State
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Invoice Sent Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                The invoice has been emailed to the recipient.
              </p>
              
              <div className="bg-muted rounded-lg p-6 w-full space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="font-mono font-semibold">{invoiceResult.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent To:</span>
                  <span className="font-medium">{invoiceResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orders Included:</span>
                  <span className="font-medium">{invoiceResult.orderCount}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    KSh {invoiceResult.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  Create Another Invoice
                </Button>
                <Link href="/admin/invoicing">
                  <Button>Back to Invoicing</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Form State
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - User Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  Select Recipient Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={userType} onValueChange={(v) => {
                  setUserType(v);
                  setSelectedUserId(null);
                  setSelectedOrderIds([]);
                }}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="client">Clients</TabsTrigger>
                    <TabsTrigger value="freelancer">Freelancers</TabsTrigger>
                    <TabsTrigger value="manager">Managers</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${userType}s by name, email, or ID...`}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No {userType}s found</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] border rounded-lg">
                      <div className="p-4 space-y-1">
                        {filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              selectedUserId === u.id
                                ? 'bg-primary/10 border-2 border-primary shadow-sm'
                                : 'hover:bg-muted border-2 border-transparent'
                            }`}
                            onClick={() => setSelectedUserId(u.id)}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{u.name}</div>
                              <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {u.displayId || `#${u.id}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Selection */}
            {selectedUserId && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      Select Orders/Items
                    </CardTitle>
                    {orders.length > 0 && (
                      <Button variant="outline" size="sm" onClick={selectAllOrders}>
                        {selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {userType === 'client' 
                      ? 'Select orders to include in the invoice'
                      : 'Select completed orders for earnings statement'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No orders found</p>
                      <p className="text-sm mt-1">
                        {userType === 'client' 
                          ? 'This client has no orders yet'
                          : 'No completed orders for this user'
                        }
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] border rounded-lg">
                      <div className="p-4 space-y-1">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              selectedOrderIds.includes(order.id)
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'hover:bg-muted border-2 border-transparent'
                            }`}
                            onClick={() => toggleOrderSelection(order.id)}
                          >
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-semibold">{order.displayId}</span>
                                <Badge 
                                  variant={order.status === 'completed' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {order.status}
                                </Badge>
                                {order.paymentConfirmed && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate mt-1">
                                {order.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {order.workType || 'Standard'}  {order.pages ? `${order.pages} pages` : ''} 
                                {order.slides ? `${order.slides} slides` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-green-600">
                                KSh {order.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : '-'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Custom Message */}
            {selectedOrderIds.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Custom Message (Optional)</CardTitle>
                  <CardDescription>Add a personalized note to the invoice email</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any additional information or notes to include in the invoice..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Invoice Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="pb-3 border-b bg-muted/50">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Receipt className="w-5 h-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {!selectedUserId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a recipient to create an invoice</p>
                  </div>
                ) : selectedOrderIds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select orders to include</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Recipient Info */}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Invoice To
                      </div>
                      <div className="font-semibold">{selectedUser?.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
                      <Badge className="mt-2" variant="outline">{userType}</Badge>
                    </div>

                    {/* Order Count */}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Orders Selected</span>
                      <span className="font-semibold">{selectedOrderIds.length}</span>
                    </div>

                    {/* Total Amount */}
                    <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-950/20 rounded-lg px-3">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        KSh {selectedTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-4">
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleSendInvoice}
                        disabled={sending}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Invoice via Email
                          </>
                        )}
                      </Button>

                      {/* Download Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <InvoiceDownload
                          items={invoiceItems}
                          title={`Invoice for ${selectedUser?.name}`}
                          subtitle={`${userType.charAt(0).toUpperCase() + userType.slice(1)} Invoice`}
                          totalAmount={selectedTotal}
                          userName={selectedUser?.name}
                          userEmail={selectedUser?.email}
                          userRole={userType}
                          variant="outline"
                          size="default"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoice Types
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">Client</Badge>
                  <span className="text-muted-foreground">Payment requests for orders</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">Freelancer</Badge>
                  <span className="text-muted-foreground">Earnings statements</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">Manager</Badge>
                  <span className="text-muted-foreground">Commission statements</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
