"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Crown,
  Building,
  MapPin,
  CreditCard,
  Globe,
  Percent
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type ClientDetails = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  approved: boolean;
  balance: number;
  totalSpent: number;
  completedJobs: number;
  createdAt: string;
};

type BillingAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type ClientProfile = {
  id: number;
  userId: number;
  companyName: string | null;
  industry: string | null;
  website: string | null;
  taxId: string | null;
  businessRegistration: string | null;
  billingAddress: BillingAddress | null;
  shippingAddress: BillingAddress | null;
  preferredPaymentMethod: string | null;
  automatePayments: boolean;
  totalJobsPosted: number;
  totalSpent: number;
  recurringClientDiscount: number;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

type Order = {
  id: number;
  displayId: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  deadline: string;
};

export default function ManagerClientDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchClientDetails();
      }
    }
  }, [user, loading, router, clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('bearer_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [clientRes, ordersRes, profileRes] = await Promise.all([
        safeApiFetch(`/api/users/${clientId}`, { headers }),
        safeApiFetch(`/api/v2/orders?clientId=${clientId}`, { headers }),
        safeApiFetch(`/api/v2/client/profile?userId=${clientId}`, { headers })
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      } else {
        toast.error('Failed to load client details');
        router.push('/manager/clients/all');
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setClientProfile(profileData.profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch client details:', error);
      toast.error('Failed to load client details');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link 
          href="/manager/clients/all"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                {client.role === 'account_owner' && <Crown className="w-8 h-8 text-yellow-600" />}
                {client.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{client.displayId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge 
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {client.status}
              </Badge>
              {client.role === 'account_owner' && (
                <Badge className="bg-purple-500">Account Owner</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{activeOrders.length}</p>
                <p className="text-xs text-muted-foreground">Active Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-600">KSh {client.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Account details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                  <Badge variant={client.approved ? 'default' : 'secondary'} className="capitalize">
                    {client.approved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{format(new Date(client.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-lg font-semibold text-green-600">KSh {client.balance.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                  <p className="text-lg font-semibold">
                    {orders.length > 0 
                      ? Math.round((completedOrders.length / orders.length) * 100)
                      : 0}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Returning Client</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {orders.length > 1 ? 'Yes' : 'No'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount Spent</p>
                  <p className="text-lg font-semibold text-green-600">
                    KSh {client.totalSpent.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                  <p className="text-lg font-semibold text-amber-600">
                    KSh {orders.length > 0 
                      ? (client.totalSpent / orders.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Building className="h-5 w-5" />
              Company Profile
            </CardTitle>
            <CardDescription>Business information and payment preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {clientProfile ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Company Info */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                    <p className="font-medium">{clientProfile.companyName || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Industry</p>
                    <p className="font-medium capitalize">{clientProfile.industry || 'Not provided'}</p>
                  </div>

                  {clientProfile.website && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Website</p>
                      <a 
                        href={clientProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {clientProfile.website}
                      </a>
                    </div>
                  )}

                  {clientProfile.taxId && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tax ID / VAT</p>
                      <p className="font-medium font-mono">{clientProfile.taxId}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Billing Address */}
                  {clientProfile.billingAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Billing Address
                      </p>
                      <div className="text-sm">
                        <p>{clientProfile.billingAddress.street}</p>
                        <p>{clientProfile.billingAddress.city}, {clientProfile.billingAddress.state}</p>
                        <p>{clientProfile.billingAddress.postalCode}</p>
                        <p>{clientProfile.billingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Preferences */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Preferred Payment
                    </p>
                    <p className="font-medium capitalize">
                      {clientProfile.preferredPaymentMethod?.replace(/_/g, ' ') || 'Not set'}
                    </p>
                    {clientProfile.automatePayments && (
                      <Badge variant="secondary" className="mt-1">Auto-pay Enabled</Badge>
                    )}
                  </div>

                  {/* Discount Info */}
                  {clientProfile.recurringClientDiscount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Client Discount
                      </p>
                      <Badge variant="default" className="bg-amber-500">
                        {clientProfile.recurringClientDiscount}% discount
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No company profile created yet</p>
                <p className="text-sm">Client has not set up their extended profile</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders ({orders.length})</CardTitle>
            <CardDescription>Order history for this client</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 10).map((order) => (
                  <Link 
                    key={order.id}
                    href={`/manager/orders/${order.id}`}
                    className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{order.title}</h4>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {order.displayId}
                        </p>
                      </div>
                      <Badge className="capitalize">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-green-600">
                        KSh {order.amount.toFixed(2)}
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
      </div>
    </div>
  );
}