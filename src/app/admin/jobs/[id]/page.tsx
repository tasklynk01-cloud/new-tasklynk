"use client";

import { useParams, redirect } from 'next/navigation';

// Redirect wrapper to maintain legacy URL compatibility
// /admin/jobs/{id} redirects to /admin/orders/{id}
export default function AdminJobPage() {
  const params = useParams();
  redirect(`/admin/orders/${params.id}`);
}
