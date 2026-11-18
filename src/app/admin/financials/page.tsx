"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Package, CheckCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { InvoiceDownload } from "@/components/invoice-download";

interface FinancialOrder {
  id: number;
  orderId: string;
  displayId: string;
  clientName: string;
  freelancerName: string;
  pages: number;
  slides: number;
  workType: string;
  status: string;
  cpp: number;
  total: number;
  freelancerTotal: number;
  managerTotal: number;
  companyProfit: number;
  createdAt: string;
}

interface FinancialSummary {
  totalOrders: number;
  totalRevenue: number;
  totalFreelancerPayout: number;
  totalManagerPayout: number;
  totalCompanyProfit: number;
}

export default function FinancialsPage() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<FinancialOrder[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<FinancialOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<FinancialOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<FinancialOrder[]>([]);
  
  const [allSummary, setAllSummary] = useState<FinancialSummary | null>(null);
  const [deliveredSummary, setDeliveredSummary] = useState<FinancialSummary | null>(null);
  const [paidSummary, setPaidSummary] = useState<FinancialSummary | null>(null);
  const [completedSummary, setCompletedSummary] = useState<FinancialSummary | null>(null);

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<string>('all');
  const [clients, setClients] = useState<{ name: string; value: string }[]>([]);
  const [freelancers, setFreelancers] = useState<{ name: string; value: string }[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch("/api/v2/admin/financials");
      
      if (!response.ok) {
        throw new Error("Failed to fetch financial data");
      }

      const data = await response.json();
      
      setAllOrders(data.allOrders || []);
      setDeliveredOrders(data.deliveredOrders || []);
      setPaidOrders(data.paidOrders || []);
      setCompletedOrders(data.completedOrders || []);
      
      setAllSummary(data.allSummary || null);
      setDeliveredSummary(data.deliveredSummary || null);
      setPaidSummary(data.paidSummary || null);
      setCompletedSummary(data.completedSummary || null);

      // Extract unique clients and freelancers for filters
      const allOrdersData = (data?.allOrders || []) as FinancialOrder[];
      const uniqueClients = Array.from(
        new Set(
          allOrdersData
            .map((o) => o.clientName)
            .filter((name): name is string => Boolean(name))
        )
      );
      const uniqueFreelancers = Array.from(
        new Set(
          allOrdersData
            .map((o) => o.freelancerName)
            .filter((name): name is string => Boolean(name))
        )
      );
      
      setClients(uniqueClients.map((name: string) => ({ name, value: name })));
      setFreelancers(uniqueFreelancers.map((name: string) => ({ name, value: name })));
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Filter orders based on selected client and freelancer
  const filterOrders = (orders: FinancialOrder[]) => {
    return orders.filter(order => {
      const clientMatch = selectedClient === 'all' || order.clientName === selectedClient;
      const freelancerMatch = selectedFreelancer === 'all' || order.freelancerName === selectedFreelancer;
      return clientMatch && freelancerMatch;
    });
  };

  // Calculate summary for filtered orders
  const calculateFilteredSummary = (orders: FinancialOrder[]): FinancialSummary => {
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      totalFreelancerPayout: orders.reduce((sum, o) => sum + o.freelancerTotal, 0),
      totalManagerPayout: orders.reduce((sum, o) => sum + o.managerTotal, 0),
      totalCompanyProfit: orders.reduce((sum, o) => sum + o.companyProfit, 0),
    };
  };

  // Get filtered data for current tab
  const getFilteredData = (orders: FinancialOrder[]) => {
    const filtered = filterOrders(orders);
    const summary = calculateFilteredSummary(filtered);
    return { orders: filtered, summary };
  };

  const SummaryCards = ({ summary, isFiltered }: { summary: FinancialSummary | null; isFiltered?: boolean }) => {
    if (!summary) return null;

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        {isFiltered && (
          <div className="col-span-full">
            <Badge variant="outline" className="mb-2">
              <Filter className="w-4 h-4 mr-1" />
              Filtered Results
            </Badge>
          </div>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freelancer Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalFreelancerPayout)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manager Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalManagerPayout)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Company Profit</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalCompanyProfit)}</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const OrdersTable = ({ orders }: { orders: FinancialOrder[] }) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No orders found for this category
        </div>
      );
    }

    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Freelancer Assigned</TableHead>
              <TableHead className="text-right">CPP</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Freelancer Total</TableHead>
              <TableHead className="text-right">Manager Total</TableHead>
              <TableHead className="text-right">Company Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link 
                    href={`/admin/jobs/${order.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {order.displayId || order.orderId}
                  </Link>
                </TableCell>
                <TableCell>{order.clientName || "N/A"}</TableCell>
                <TableCell>{order.freelancerName || "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  KSh {order.cpp.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.freelancerTotal)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.managerTotal)}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-700">
                  {formatCurrency(order.companyProfit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Check if filters are active
  const isFiltered = selectedClient !== 'all' || selectedFreelancer !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive financial overview and order profitability
          </p>
        </div>
        <InvoiceDownload
          items={filterOrders(allOrders).map(order => ({
            orderId: order.displayId || order.orderId,
            title: `Order by ${order.clientName}`,
            client: order.clientName,
            freelancer: order.freelancerName,
            workType: order.workType,
            pages: order.pages,
            slides: order.slides,
            amount: order.total,
            date: order.createdAt,
            status: order.status,
          }))}
          title={isFiltered ? "Filtered Financial Report" : "Financial Summary Report"}
          subtitle={isFiltered ? `Filtered Results` : "All Orders Overview"}
          totalAmount={calculateFilteredSummary(filterOrders(allOrders)).totalRevenue}
          userRole="Admin"
        />
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.value} value={client.value}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Freelancer</label>
                <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Freelancers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Freelancers</SelectItem>
                    {freelancers.map((freelancer) => (
                      <SelectItem key={freelancer.value} value={freelancer.value}>
                        {freelancer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isFiltered && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedClient('all');
                  setSelectedFreelancer('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <SummaryCards summary={getFilteredData(allOrders).summary} isFiltered={isFiltered} />
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Current Orders {isFiltered && `(${getFilteredData(allOrders).orders.length})`}</CardTitle>
                <CardDescription>
                  Complete financial breakdown of all orders in the system
                </CardDescription>
              </div>
              {getFilteredData(allOrders).orders.length > 0 && (
                <InvoiceDownload
                  items={getFilteredData(allOrders).orders.map(order => ({
                    orderId: order.displayId || order.orderId,
                    title: `Order by ${order.clientName}`,
                    client: order.clientName,
                    freelancer: order.freelancerName,
                    workType: order.workType,
                    pages: order.pages,
                    slides: order.slides,
                    amount: order.total,
                    date: order.createdAt,
                    status: order.status,
                  }))}
                  title={isFiltered ? "Filtered All Orders Report" : "All Orders Financial Report"}
                  totalAmount={getFilteredData(allOrders).summary.totalRevenue}
                  size="sm"
                />
              )}
            </CardHeader>
            <CardContent>
              <OrdersTable orders={getFilteredData(allOrders).orders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          <SummaryCards summary={getFilteredData(deliveredOrders).summary} isFiltered={isFiltered} />
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Delivered Orders {isFiltered && `(${getFilteredData(deliveredOrders).orders.length})`}</CardTitle>
                <CardDescription>
                  Orders that have been delivered and awaiting client approval
                </CardDescription>
              </div>
              {getFilteredData(deliveredOrders).orders.length > 0 && (
                <InvoiceDownload
                  items={getFilteredData(deliveredOrders).orders.map(order => ({
                    orderId: order.displayId || order.orderId,
                    title: `Order by ${order.clientName}`,
                    client: order.clientName,
                    freelancer: order.freelancerName,
                    workType: order.workType,
                    pages: order.pages,
                    slides: order.slides,
                    amount: order.total,
                    date: order.createdAt,
                    status: order.status,
                  }))}
                  title={isFiltered ? "Filtered Delivered Orders Report" : "Delivered Orders Report"}
                  totalAmount={getFilteredData(deliveredOrders).summary.totalRevenue}
                  size="sm"
                />
              )}
            </CardHeader>
            <CardContent>
              <OrdersTable orders={getFilteredData(deliveredOrders).orders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <SummaryCards summary={getFilteredData(paidOrders).summary} isFiltered={isFiltered} />
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Paid Orders {isFiltered && `(${getFilteredData(paidOrders).orders.length})`}</CardTitle>
                <CardDescription>
                  Orders that have been paid for and confirmed
                </CardDescription>
              </div>
              {getFilteredData(paidOrders).orders.length > 0 && (
                <InvoiceDownload
                  items={getFilteredData(paidOrders).orders.map(order => ({
                    orderId: order.displayId || order.orderId,
                    title: `Order by ${order.clientName}`,
                    client: order.clientName,
                    freelancer: order.freelancerName,
                    workType: order.workType,
                    pages: order.pages,
                    slides: order.slides,
                    amount: order.total,
                    date: order.createdAt,
                    status: order.status,
                  }))}
                  title={isFiltered ? "Filtered Paid Orders Report" : "Paid Orders Report"}
                  totalAmount={getFilteredData(paidOrders).summary.totalRevenue}
                  size="sm"
                />
              )}
            </CardHeader>
            <CardContent>
              <OrdersTable orders={getFilteredData(paidOrders).orders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <SummaryCards summary={getFilteredData(completedOrders).summary} isFiltered={isFiltered} />
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Completed Orders {isFiltered && `(${getFilteredData(completedOrders).orders.length})`}</CardTitle>
                <CardDescription>
                  Fully completed orders with all payments processed
                </CardDescription>
              </div>
              {getFilteredData(completedOrders).orders.length > 0 && (
                <InvoiceDownload
                  items={getFilteredData(completedOrders).orders.map(order => ({
                    orderId: order.displayId || order.orderId,
                    title: `Order by ${order.clientName}`,
                    client: order.clientName,
                    freelancer: order.freelancerName,
                    workType: order.workType,
                    pages: order.pages,
                    slides: order.slides,
                    amount: order.total,
                    date: order.createdAt,
                    status: order.status,
                  }))}
                  title={isFiltered ? "Filtered Completed Orders Report" : "Completed Orders Report"}
                  totalAmount={getFilteredData(completedOrders).summary.totalRevenue}
                  size="sm"
                />
              )}
            </CardHeader>
            <CardContent>
              <OrdersTable orders={getFilteredData(completedOrders).orders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
