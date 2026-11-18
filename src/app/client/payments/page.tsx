import { redirect } from 'next/navigation';

// Alternative route for payments - redirects to financial-overview
export default function PaymentsPage() {
  redirect('/client/financial-overview');
}
