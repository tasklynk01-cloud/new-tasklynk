import { redirect } from 'next/navigation';

export default function LegacyManagerDashboardLayout() {
  redirect('/manager/dashboard');
}
