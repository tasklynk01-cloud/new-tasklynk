"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, UserCheck, Crown, Zap, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type OnlineUser = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  role: string;
  presenceStatus: string;
  lastLoginAt: string | null;
  balance: number;
  completedJobs: number;
  clientTier: string | null;
  phone: string;
  lastSeenText: string;
  isOnline: boolean;
};

export default function OnlineClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<OnlineUser[]>([]);
  const [filteredClients, setFilteredClients] = useState<OnlineUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.push('/');
    } else if (user) {
      fetchOnlineClients();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchOnlineClients, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const fetchOnlineClients = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const response = await safeApiFetch('/api/v2/users/online?role=client', {
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.users || []);
        setFilteredClients(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch online clients:', error);
    } finally {
      setLoadingData(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.displayId.toLowerCase().includes(term)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading online clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-600" />
              Online Clients
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} currently online
            </p>
          </div>
          
          <Button
            onClick={() => fetchOnlineClients(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Clients List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No online clients found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Check back later'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <span
                        className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500"
                        title="Online"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {client.displayId}
                        </Badge>
                        {client.clientTier && client.clientTier !== 'basic' && (
                          <Badge className={`text-xs ${
                            client.clientTier === 'platinum' ? 'bg-purple-600' :
                            client.clientTier === 'gold' ? 'bg-yellow-500' :
                            client.clientTier === 'silver' ? 'bg-gray-400' :
                            'bg-gray-500'
                          }`}>
                            <Crown className="w-4 h-4 mr-1" />
                            {client.clientTier.charAt(0).toUpperCase() + client.clientTier.slice(1)}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {client.lastSeenText}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {client.role === 'account_owner' ? 'Account Owner' : 'Client'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate">{client.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{client.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Orders Placed</p>
                          <p className="text-sm font-medium">{client.completedJobs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="text-sm font-medium">
                            KSh {client.balance.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {client.lastLoginAt && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Last login: {format(new Date(client.lastLoginAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <Link href={`/admin/users/${client.id}`}>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
