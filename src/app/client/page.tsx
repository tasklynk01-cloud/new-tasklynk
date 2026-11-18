import { redirect } from 'next/navigation';

// Root client route redirects to dashboard
export default function ClientRootPage() {
  redirect('/client/dashboard');
}
