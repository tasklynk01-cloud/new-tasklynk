import { redirect } from 'next/navigation';

// Alternative route for order creation - redirects to new-job
export default function PlaceOrderPage() {
  redirect('/client/new-job');
}
