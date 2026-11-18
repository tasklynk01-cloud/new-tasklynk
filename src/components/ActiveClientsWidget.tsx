'use client';

import { useEffect, useState } from 'react';
import { extractErrorMessage, safeApiFetch } from '@/lib/client-api-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ClientContact {
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  lastSeenAt: string;
}

export default function ActiveClientsWidget() {
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      try {
        setLoading(true);
        setError(null);

        const response = await safeApiFetch('/api/v2/clients/active', {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(extractErrorMessage(errorData, 'Failed to fetch online clients'));
        }

        const data = await response.json();
        setClients(data.clients || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError(error instanceof Error ? error.message : 'Failed to load clients');
        // Don't show toast for empty results - it's not an error
        if (error instanceof Error && !error.message.includes('empty')) {
          toast.error('Could not load online clients');
        }
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchClients();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchClients, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-3">
            <User className="h-4 w-4 text-green-600" />
            Active Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            Clients Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-3">
            <User className="h-4 w-4 text-gray-400" />
            Active Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No clients currently online</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-3">
            <User className="h-4 w-4 text-green-600" />
            Active Clients
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {clients.length} Online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {clients.map((client) => (
          <div
            key={client.clientId}
            className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{client.clientName}</p>
                <p className="text-xs text-muted-foreground truncate">{client.clientEmail}</p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex gap-3">
              {client.clientPhone && (
                <a
                  href={`tel:${client.clientPhone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-600 text-primary-foreground hover:bg-green-700 transition-colors"
                  title={`Call ${client.clientName}`}
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
              )}
              <a
                href={`mailto:${client.clientEmail}`}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={`Email ${client.clientName}`}
              >
                <Mail className="h-3 w-3" />
                Email
              </a>
            </div>

            {/* Phone Display if available */}
            {client.clientPhone && (
              <div className="mt-2 text-xs text-green-700 dark:text-green-300 font-medium">
                📞 {client.clientPhone}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

