"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, PlusCircle, CheckCircle, XCircle, Smartphone, Receipt } from 'lucide-react';
import { format } from "date-fns";
import { toast } from "sonner";
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { InvoiceDownload, SingleInvoiceDownload } from "@/components/invoice-download";
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';
import { isValidWalletTopup } from '@/lib/payment-policy';

interface TransactionItem {
  id: number;
  amount: number;
  status: string;
  paymentMethod: string | null;
  confirmedAt: string | null;
  createdAt: string;
  job: {
    id: number | null;
    displayId: string | null;
    title: string | null;
    status: string | null;
  } | null;
}
export default function ClientFinancialOverviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FinancialOverviewContent />
    </Suspense>
  );
}

function FinancialOverviewContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pesapalStatus = searchParams.get("pesapalStatus");
  const pesapalMerchantReference = searchParams.get("merchantReference");
  const pesapalOrderTrackingId = searchParams.get("orderTrackingId");
  const pesapalReason = searchParams.get("pesapalReason") || searchParams.get("pesapalError");

  const [summary, setSummary] = useState<{
    totalSpent: number;
    currentBalance: number;
    totalOrders: number;
    completedOrders: number;
    pendingPayments: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(1000);

  // Old Add Funds form state (Payment Request) - kept for compatibility
  const [amount, setAmount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pesapalStatus) return;

    const lowered = pesapalStatus.toLowerCase();
    const reference = pesapalMerchantReference || pesapalOrderTrackingId;
    const reason = pesapalReason;
    const suffix = reference ? ` (Ref: ${reference})` : "";

    if (lowered === "completed" || lowered === "confirmed") {
      toast.success(`Payment confirmed${suffix}.`);
    } else if (lowered === "failed") {
      toast.error(
        `Payment failed${suffix}. ${
          reason ? `Please contact support with code ${reason}.` : "Please try again."
        }`.trim()
      );
    } else {
      toast.info(`Payment is being verified${suffix}. We will refresh your balance shortly.`);
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      [
        "pesapalStatus",
        "merchantReference",
        "orderTrackingId",
        "pesapalReason",
        "pesapalError",
      ].forEach((param) => url.searchParams.delete(param));
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, [pesapalStatus, pesapalMerchantReference, pesapalOrderTrackingId, pesapalReason, router]);

  useEffect(() => {
    if (!loading) {
      // Allow both clients and account owners
      if (!user || (user.role !== "client" && user.role !== "account_owner")) {
        router.push("/");
      } else {
        fetchFinancials();
      }
    }
  }, [user, loading, router]);

  const fetchFinancials = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const ts = Date.now();
      const res = await safeApiFetch(`/api/clients/${user.id}/financial-history?limit=50&_=${ts}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to fetch financials", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreatePaymentRequest = async () => {
    if (!user) return;

    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Enter your M-Pesa phone number");
      return;
    }
    if (!transactionRef.trim()) {
      toast.error("Enter your M-Pesa transaction reference");
      return;
    }

    setSubmitting(true);
    try {
      const res = await safeApiFetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: user.id,
          amount: Number(amount),
          paymentMethod: "mpesa",
          phoneNumber: phoneNumber.trim(),
          transactionReference: transactionRef.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to submit payment request"));
      } else {
        toast.success("Payment request submitted! Admin will review shortly.");
        setAmount(0);
        setTransactionRef("");
        // keep phone prefilled for convenience
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Breadcrumb Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Client Financials &amp; Wallet</h1>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 text-xs rounded-full border border-emerald-500/20">
              Verified Wallet
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your TaskLynk balance, add prepaid funds via M-Pesa STK, and download official receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (!isValidWalletTopup(topupAmount)) {
                toast.error('Please enter an amount of at least KSh 100');
                return;
              }
              setPaymentDialogOpen(true);
            }}
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Top Up Wallet
          </Button>
        </div>
      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Wallet Balance */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Wallet Balance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              KSh {summary?.currentBalance?.toFixed(0) || "0"}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">ready to use</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Spent</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-foreground">
              KSh {summary?.totalSpent?.toFixed(0) || "0"}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">lifetime orders</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-foreground">
              {summary?.totalOrders || 0}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">submitted</span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400">
              {summary?.completedOrders || 0}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">delivered</span>
          </div>
        </div>
      </div>

      {/* Instant Deposit & Payment Methods Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Instant M-Pesa Topup Box */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-sm space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Instant M-Pesa STK Topup</h3>
                <p className="text-[10px] text-muted-foreground">Enter amount to receive prompt on your phone</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Instant</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">KSh</span>
              <Input
                type="number"
                value={topupAmount || ""}
                onChange={(e) => setTopupAmount(Number(e.target.value))}
                placeholder="2000"
                className="pl-11 h-9 text-xs rounded-lg border-border/70"
                min="100"
                step="1"
              />
            </div>
            <Button
              onClick={() => {
                if (!isValidWalletTopup(topupAmount)) {
                  toast.error('Please enter amount of at least KSh 100');
                  return;
                }
                setPaymentDialogOpen(true);
              }}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg h-9 px-4 text-xs shadow-sm shrink-0"
            >
              Deposit Now
            </Button>
          </div>
        </div>

        {/* Manual Till Info Card */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Manual Buy Goods Till</h4>
            </div>
            <p className="text-[11px] font-black text-primary mt-1">Till No: 6392479</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pay manually via Buy Goods &amp; submit ref</p>
          </div>
          <Button
            onClick={() => setPaymentDialogOpen(true)}
            variant="outline"
            size="sm"
            className="w-full text-xs h-7 rounded-lg border-border"
          >
            Submit Till Ref
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Your recent payments with order references</CardDescription>
          </div>
          {transactions.length > 0 && (
            <InvoiceDownload
              items={transactions.map(t => ({
                orderId: t.job?.displayId || `#${t.job?.id || t.id}`,
                title: t.job?.title || 'Payment',
                amount: Number(t.amount || 0),
                date: t.createdAt,
                status: t.status,
              }))}
              title="Client Transaction History"
              userName={user?.name}
              userEmail={user?.email}
              userRole="Client"
              totalAmount={summary?.totalSpent || 0}
            />
          )}
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-10">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell className="font-semibold">KSh {Number(t.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "confirmed" ? "default" : t.status === "failed" ? "destructive" : "secondary"} className="capitalize rounded-xl">
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{t.paymentMethod || "-"}</TableCell>
                      <TableCell>
                        {t.job?.id ? (
                          <span className="text-sm">
                            {t.job.displayId ? `#${t.job.displayId}` : `#${t.job.id}`}  {t.job.title || "Order"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground"></span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.job?.id && (
                          <SingleInvoiceDownload
                            orderId={t.job.displayId || `${t.job.id}`}
                            title={t.job.title || 'Order'}
                            client={user?.name}
                            amount={Number(t.amount || 0)}
                            date={t.createdAt}
                            status={t.status}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Payment Dialog for Wallet Top-Up */}
      <UnifiedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        amount={topupAmount}
        description="Wallet Top-Up"
        type="topup"
        defaultPhoneNumber={user?.phone || ''}
        customerName={user?.name || ''}
        customerEmail={user?.email || ''}
        clientId={user?.clientId || String(user?.id || '')}
        onSuccess={async () => {
          toast.success('Payment confirmed and wallet credited.');
          await fetchFinancials();
          setPaymentDialogOpen(false);
        }}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
