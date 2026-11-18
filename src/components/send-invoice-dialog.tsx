"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Mail, FileText, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { format } from 'date-fns';

interface Client {
  id: number;
  name: string;
  email: string;
  displayId: string;
}

interface Order {
  id: number;
  displayId: string;
  title: string;
  workType: string | null;
  pages: number | null;
  slides: number | null;
  totalAmount: number | null;
  createdAt: string | null;
  status: string | null;
}

interface SendInvoiceDialogProps {
  trigger?: React.ReactNode;
  preSelectedClientId?: number;
  preSelectedOrderIds?: number[];
  onSuccess?: () => void;
}

export function SendInvoiceDialog({
  trigger,
  preSelectedClientId,
  preSelectedOrderIds,
  onSuccess,
}: SendInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<number | null>(preSelectedClientId || null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>(preSelectedOrderIds || []);
  const [customMessage, setCustomMessage] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Result state
  const [invoiceResult, setInvoiceResult] = useState<{
    invoiceNumber: string;
    clientEmail: string;
    orderCount: number;
    totalAmount: number;
  } | null>(null);

  // Fetch clients on open
  useEffect(() => {
    if (open) {
      fetchClients();
      setSuccess(false);
      setInvoiceResult(null);
    }
  }, [open]);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch.trim()) {
      const search = clientSearch.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            c.displayId?.toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearch, clients]);

  // Fetch orders when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchClientOrders(selectedClientId);
    } else {
      setOrders([]);
      setSelectedOrderIds([]);
    }
  }, [selectedClientId]);

  // Pre-select orders if provided
  useEffect(() => {
    if (preSelectedOrderIds && preSelectedOrderIds.length > 0) {
      setSelectedOrderIds(preSelectedOrderIds);
    }
  }, [preSelectedOrderIds]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/admin/send-invoice', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setFilteredClients(data.clients || []);
      } else {
        toast.error('Failed to load clients');
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOrders = async (clientId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/admin/send-invoice?clientId=${clientId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/v2/admin/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: selectedClientId,
          orderIds: selectedOrderIds,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setInvoiceResult({
          invoiceNumber: data.invoiceNumber,
          clientEmail: data.clientEmail,
          orderCount: data.orderCount,
          totalAmount: data.totalAmount,
        });
        toast.success(`Invoice sent to ${data.clientEmail}`);
        onSuccess?.();
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

  const selectedTotal = orders
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleClose = () => {
    setOpen(false);
    // Reset form after dialog closes
    setTimeout(() => {
      if (!preSelectedClientId) {
        setSelectedClientId(null);
      }
      if (!preSelectedOrderIds) {
        setSelectedOrderIds([]);
      }
      setCustomMessage('');
      setSuccess(false);
      setInvoiceResult(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            Send Invoice to Client
          </DialogTitle>
          <DialogDescription>
            Select a client and orders to generate and send an invoice via email.
          </DialogDescription>
        </DialogHeader>

        {success && invoiceResult ? (
          // Success state
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Invoice Sent Successfully!</h3>
            <p className="text-muted-foreground text-center mb-6">
              The invoice has been sent to the client's email.
            </p>
            
            <div className="bg-muted rounded-lg p-6 w-full max-w-md space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-mono font-semibold">{invoiceResult.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent To:</span>
                <span className="font-medium">{invoiceResult.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders:</span>
                <span className="font-medium">{invoiceResult.orderCount}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-green-600">KSh {invoiceResult.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          // Form state
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Select Client</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name, email, or ID..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {loading && !selectedClientId ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[150px] border rounded-lg">
                  <div className="p-4 space-y-1">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedClientId === client.id
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{client.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {client.displayId || `#${client.id}`}
                        </Badge>
                      </div>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No clients found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Order Selection */}
            {selectedClientId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Orders</Label>
                  {orders.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={selectAllOrders}>
                      {selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No orders found for this client
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-4 space-y-1">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                            selectedOrderIds.includes(order.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleOrderSelection(order.id)}
                        >
                          <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm">{order.displayId}</span>
                              <Badge variant="outline" className="text-xs">
                                {order.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {order.title}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold">KSh {(order.totalAmount || 0).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.createdAt ? format(new Date(order.createdAt), 'MMM dd') : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Custom Message */}
            {selectedOrderIds.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a personal message to include in the invoice email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Summary */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Selected Orders:</span>
                  <span className="font-medium">{selectedOrderIds.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    KSh {selectedTotal.toFixed(2)}
                  </span>
                </div>
                {selectedClient && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Send To:</span>
                    <span className="font-medium">{selectedClient.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          {success ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvoice}
                disabled={sending || !selectedClientId || selectedOrderIds.length === 0}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
