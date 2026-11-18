import { redirect } from 'next/navigation';

export default async function ClientLegacyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/client/orders/${id}`);
}
