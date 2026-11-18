"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Users, Award, Star, DollarSign, RefreshCw } from 'lucide-react';
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
  rating: number | null;
  completedJobs: number;
  freelancerBadge: string | null;
  phone: string;
  lastSeenText: string;
  isOnline: boolean;
};

export default function OnlineFreelancersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<OnlineUser[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<OnlineUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'manager')) {
      router.push('/');
    } else if (user) {
      fetchOnlineFreelancers();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchOnlineFreelancers, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const fetchOnlineFreelancers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const response = await safeApiFetch('/api/v2/users/online?role=freelancer', {
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFreelancers(data.users || []);
        setFilteredFreelancers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch online freelancers:', error);
    } finally {
      setLoadingData(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFreelancers(freelancers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = freelancers.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.email.toLowerCase().includes(term) ||
          f.displayId.toLowerCase().includes(term)
      );
      setFilteredFreelancers(filtered);
    }
  }, [searchTerm, freelancers]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading online freelancers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/manager/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              Online Freelancers
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''} currently online
            </p>
          </div>
          
          <Button
            onClick={() => fetchOnlineFreelancers(true)}
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

      {/* Online Freelancers List */}
      {filteredFreelancers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No online freelancers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Check back later'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFreelancers.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <span
                        className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500"
                        title="Online"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{freelancer.name}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {freelancer.displayId}
                        </Badge>
                        {freelancer.freelancerBadge && (
                          <Badge className={`text-xs ${
                            freelancer.freelancerBadge === 'elite' ? 'bg-purple-600' :
                            freelancer.freelancerBadge === 'platinum' ? 'bg-purple-500' :
                            freelancer.freelancerBadge === 'gold' ? 'bg-yellow-500' :
                            freelancer.freelancerBadge === 'silver' ? 'bg-gray-400' :
                            'bg-orange-700'
                          }`}>
                            <Award className="w-4 h-4 mr-1" />
                            {freelancer.freelancerBadge.charAt(0).toUpperCase() + freelancer.freelancerBadge.slice(1)}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {freelancer.lastSeenText}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate">{freelancer.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{freelancer.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completed Jobs</p>
                          <p className="text-sm font-medium">{freelancer.completedJobs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                          <p className="text-sm font-medium flex items-center">
                            {freelancer.rating ? (
                              <>
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                                {freelancer.rating.toFixed(1)}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">
                            KSh {freelancer.balance.toFixed(0)}
                          </span>
                        </div>
                        {freelancer.lastLoginAt && (
                          <p className="text-xs text-muted-foreground">
                            Last login: {format(new Date(freelancer.lastLoginAt), 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
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
