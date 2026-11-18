"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import { Fragment, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Eye, DollarSign } from "lucide-react";
import OrderFinancialsCard from "@/components/OrderFinancialsCard";
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  actualDeadline: string;
  createdAt: string;
  acceptedAt?: string;
  approvedByClientAt?: string;
  updatedAt?: string;
  writer?: { id: number; displayId: string; name: string } | null;
};

export default function ClientAcceptedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await safeApiFetch(`/api/v2/orders?status=accepted&clientId=${user?.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJobs(unwrapOrderList<Job>(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== "client" && user.role !== "account_owner")) {
        router.push("/");
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router, fetchJobs]);



  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BadgeCheck className="w-6 h-6 text-cyan-600" /> Accepted Orders
              </h1>
              <p className="text-muted-foreground">Orders you have accepted after delivery. Proceed with payment to download the files.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">Accepted Orders ({jobs.length})</CardTitle>
                <CardDescription>Review and pay for accepted orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No accepted orders</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Writer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Accepted Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <Fragment key={job.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => router.push(`/client/orders/${job.id}`)}
                          >
                            <TableCell className="font-mono text-xs">
                              <Badge variant="outline">{job.displayId}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.writer?.name || "Unassigned"}</TableCell>
                            <TableCell className="font-semibold">KSh {job.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {format(new Date(job.acceptedAt || job.approvedByClientAt || job.updatedAt || job.createdAt), "MMM dd, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedOrderId(expandedOrderId === job.id ? null : job.id);
                                }}
                              >
                                {expandedOrderId === job.id ? "Hide Details" : "Show Details"}
                              </Button>
                              <Link href={`/client/orders/${job.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(job.id);
                                  setPaymentDialogOpen(true);
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-1" /> Pay Now
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedOrderId === job.id && (
                            <TableRow key={`${job.id}-details`}>
                              <TableCell colSpan={6}>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <OrderFinancialsCard orderId={job.id} userRole="client" variant="compact" />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

      {selectedOrderId !== null && (
        <UnifiedPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrderId}
          orderDisplayId={jobs.find(j => j.id === selectedOrderId)?.displayId || ''}
          customerName={user?.name || ''}
          customerEmail={user?.email || ''}
          clientId={user?.clientId || String(user?.id || '')}
          amount={jobs.find(j => j.id === selectedOrderId)?.amount || 0}
          description="Payment for accepted order"
          type="order"
          defaultPhoneNumber={user?.phone || ''}
          onSuccess={async () => {
            toast.success('Payment initiated successfully!');
            await fetchJobs();
            setPaymentDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
