"use client";

import { Button } from '@/components/ui/button';
import { ExternalLink, CreditCard } from 'lucide-react';

interface PaystackPageButtonProps {
  amount?: number;
  customerName?: string;
  customerEmail?: string;      // Customer's email address
  customerPhone?: string;
  clientId?: string;
  orderId?: string;
  orderDisplayId?: string;
  invoiceId?: string;          // For bulk payments
  isBulkPayment?: boolean;     // True if paying for multiple orders
  orderCount?: number;         // Number of orders in bulk payment
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
  fullWidth?: boolean;
}

/**
 * Paystack Payment Page Button
 * 
 * Simple button that redirects to your Paystack Payment Page.
 * No authentication required - perfect for public payments.
 * 
 * **Note:** Amount should be passed in major currency units (KSh, not cents).
 * The Payment Page handles currency formatting automatically.
 * 
 * Usage:
 * ```tsx
 * <PaystackPageButton
 *   amount={2400}  // KSh 2,400 (not 240,000)
 *   customerName="John Doe"
 *   customerPhone="254712345678"
 *   buttonText="Pay Now"
 * />
 * ```
 */
export default function PaystackPageButton({
  amount,
  customerName,
  customerEmail,
  customerPhone,
  clientId,
  orderId,
  orderDisplayId,
  invoiceId,
  isBulkPayment = false,
  orderCount,
  buttonText = 'Pay with M-Pesa',
  buttonVariant = 'default',
  className = '',
  fullWidth = false,
}: PaystackPageButtonProps) {
  const handlePayment = () => {
    // Your Paystack Payment Page URL
    let paymentUrl = 'https://paystack.shop/pay/tasklynk';

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (amount) params.append('amount', String(amount)); // Payment Page handles currency formatting
    if (customerEmail) params.append('email', customerEmail); // Customer email for receipts
    
    // Custom fields that match Paystack Payment Page setup
    if (clientId) params.append('Client ID', clientId);
    if (customerName) params.append('Name', customerName); // Client's actual name
    if (customerPhone) params.append('Phone Number', customerPhone);
    
    // Invoice ID/Order Number field (shows order number or invoice ID)
    if (isBulkPayment && invoiceId) {
      params.append('Invoice ID/Order Number', invoiceId); // Just the invoice ID
    } else if (orderDisplayId) {
      params.append('Invoice ID/Order Number', orderDisplayId); // Just the order number
    }
    
    // Add metadata for backend processing
    if (orderId) params.append('metadata[orderId]', orderId);
    if (orderDisplayId) params.append('metadata[orderDisplayId]', orderDisplayId);
    if (invoiceId) params.append('metadata[invoiceId]', invoiceId);
    if (isBulkPayment) params.append('metadata[isBulkPayment]', 'true');
    if (orderCount) params.append('metadata[orderCount]', String(orderCount));

    if (params.toString()) {
      paymentUrl += '?' + params.toString();
    }

    // Open payment page in new tab
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handlePayment}
      variant={buttonVariant}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      size="lg"
    >
      <CreditCard className="mr-2 h-5 w-5" />
      {buttonText}
    </Button>
  );
}
