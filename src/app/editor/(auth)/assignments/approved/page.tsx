"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, RefreshCw, Search, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assignment {
  assignment: {
    id: number;
    approvalStatus: string;
    assignedAt: string;
    reviewStartedAt: string | null;
    approvalReason: string | null;
  };
  job: {
    id: number;
    title: string;
    displayId: string;
    deadline: string;
    pages: number;
    subject: string;
  };
  client: {
    name: string;
  };
}

export default function ApprovedAssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAssignments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/editor/assignments?status=approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setAssignments(result.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.id]);

  const filteredAssignments = assignments.filter(item =>
    search === '' || 
    item.job.title.toLowerCase().includes(search.toLowerCase()) ||
    item.job.displayId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Approved Orders
          </h1>
          <p className="text-muted-foreground">Orders you have approved for delivery</p>
        </div>
        <Button onClick={fetchAssignments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search approved orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Orders ({filteredAssignments.length})</CardTitle>
          <CardDescription>Successfully approved orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="space-y-4">
              {filteredAssignments.map((item) => (
                <div
                  key={item.assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {item.job.displayId}  Client: {item.client.name}  {item.job.pages} pages
                      </p>
                      {item.assignment.approvalReason && (
                        <p className="text-xs text-green-600 mt-1 italic">
                          Note: {item.assignment.approvalReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500">Approved</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/editor/review/${item.job.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No approved orders yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
