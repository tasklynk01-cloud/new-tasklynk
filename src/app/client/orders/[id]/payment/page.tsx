"use client";
import { safeApiFetch, unwrapApiData } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, CreditCard, Shield, CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import PaystackPaymentButton from '@/components/PaystackPaymentButton';

type Order = {
  id: number;
  clientId: number;
  displayId: string;
  title: string;
  amount: number;
  status: string;
  deadline: string;
  workType: string;
  pages: number | null;
  slides: number | null;
};

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const responseData = await response.json();
      const payload = unwrapApiData<{ order: Order }>(responseData);
      const orderData = payload && 'order' in payload ? payload.order : (payload as Order | null);
      setOrder(orderData || null);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      router.push('/client/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Order not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href={`/client/orders/${orderId}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Order
        </Button>
      </Link>

      <div className="grid gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-medium">{order.displayId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{order.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Type:</span>
                <Badge variant="outline">{order.workType}</Badge>
              </div>
              {order.pages && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="font-medium">{order.pages}</span>
                </div>
              )}
              {order.slides && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slides:</span>
                  <span className="font-medium">{order.slides}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium">{format(parseISO(order.deadline), 'PPp')}</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  KSh {order.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your payment is secured by Paystack. Choose your preferred payment method (M-Pesa, Card, or Bank Transfer) on the next page.
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-lg">Secure Payment via Paystack</p>
                    <p className="text-sm text-muted-foreground">You’ll be redirected to Paystack’s secure checkout</p>
                  </div>
                </div>

                <PaystackPaymentButton
                  jobId={order.id}
                  clientId={order.clientId}
                  amount={Math.round(order.amount)}
                  email={user?.email || 'client@tasklynk.co.ke'}
                  buttonText={`Pay KSh ${Math.round(order.amount).toLocaleString()} Now`}
                  buttonVariant="default"
                  className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                  onError={(error) => {
                    toast.error(error || 'Payment failed. Please try again.');
                  }}
                />

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>✓ M-Pesa, Visa & Mastercard</p>
                  <p>✓ Bank Transfer & Mobile Banking</p>
                  <p>✓ Secure Paystack checkout</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Order */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/client/orders/${orderId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order Details
          </Button>
        </div>
      </div>
    </div>
  );
}
