"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function ManagerJobDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full pb-20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Manager Job Details</h1>
            <p className="text-muted-foreground mt-2">Full job details page coming soon...</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
