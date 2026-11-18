"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle, RefreshCw, Search, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assignment {
  assignment: {
    id: number;
    approvalStatus: string;
    assignedAt: string;
    reviewStartedAt: string | null;
    approvalReason: string | null;
    revisionNotes: string | null;
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

export default function RejectedAssignmentsPage() {
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
      const response = await safeApiFetch(`/api/editor/assignments?status=rejected`, {
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
            <XCircle className="h-6 w-6 text-red-500" />
            Rejected Orders
          </h1>
          <p className="text-muted-foreground">Orders requiring revisions</p>
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
              placeholder="Search rejected orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rejected Orders ({filteredAssignments.length})</CardTitle>
          <CardDescription>Orders sent back for revisions</CardDescription>
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
                  className="flex flex-col p-4 border rounded-lg hover:bg-red-50/50 transition-colors gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Order: {item.job.displayId}  Client: {item.client.name}  {item.job.pages} pages
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">Rejected</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/editor/review/${item.job.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {(item.assignment.approvalReason || item.assignment.revisionNotes) && (
                    <div className="ml-14 p-4 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-semibold text-red-700 mb-1">Revision Notes:</p>
                      <p className="text-sm text-red-600">
                        {item.assignment.revisionNotes || item.assignment.approvalReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No rejected orders</p>
              <p className="text-sm text-muted-foreground">Great work! All orders are approved.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
