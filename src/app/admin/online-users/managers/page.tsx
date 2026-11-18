"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Shield, RefreshCw } from 'lucide-react';
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
  phone: string;
  lastSeenText: string;
  isOnline: boolean;
};

export default function OnlineManagersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<OnlineUser[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<OnlineUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin/dashboard');
    } else if (user) {
      fetchOnlineManagers();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchOnlineManagers, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const fetchOnlineManagers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const response = await safeApiFetch('/api/v2/users/online?role=manager', {
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setManagers(data.users || []);
        setFilteredManagers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch online managers:', error);
    } finally {
      setLoadingData(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredManagers(managers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = managers.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.displayId.toLowerCase().includes(term)
      );
      setFilteredManagers(filtered);
    }
  }, [searchTerm, managers]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading online managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              Online Managers
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredManagers.length} manager{filteredManagers.length !== 1 ? 's' : ''} currently online
            </p>
          </div>
          
          <Button
            onClick={() => fetchOnlineManagers(true)}
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

      {/* Online Managers List */}
      {filteredManagers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No online managers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Check back later'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredManagers.map((manager) => (
            <Card key={manager.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <span
                        className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500"
                        title="Online"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{manager.name}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {manager.displayId}
                        </Badge>
                        <Badge className="bg-purple-600 text-white text-xs">
                          Manager
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {manager.lastSeenText}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate">{manager.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{manager.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="text-sm font-medium">
                            KSh {manager.balance.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {manager.lastLoginAt && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Last login: {format(new Date(manager.lastLoginAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <Link href={`/admin/users/${manager.id}`}>
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
