"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, RefreshCw, Search, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Assignment {
  assignment: {
    id: number;
    approvalStatus: string;
    assignedAt: string;
    reviewStartedAt: string | null;
  };
  job: {
    id: number;
    title: string;
    displayId: string;
    status: string;
    deadline: string;
    pages: number;
    subject: string;
  };
  client: {
    name: string;
    email: string;
  };
}

export default function AllAssignmentsPage() {
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
      const response = await safeApiFetch(`/api/editor/assignments?status=all`, {
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

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = search === '' || 
      item.job.title.toLowerCase().includes(search.toLowerCase()) ||
      item.job.displayId.toLowerCase().includes(search.toLowerCase()) ||
      item.client.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1 inline" />Pending</Badge>;
      case 'reviewing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><AlertCircle className="h-3 w-3 mr-1 inline" />In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1 inline" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1 inline" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Assignments</h1>
          <p className="text-muted-foreground">View all your assigned orders</p>
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
              placeholder="Search by order ID, title, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments ({filteredAssignments.length})</CardTitle>
          <CardDescription>Complete list of all your review assignments</CardDescription>
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
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4 cursor-pointer"
                  onClick={() => router.push(`/editor/review/${item.job.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.job.title}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span>Order: {item.job.displayId}</span>
                      <span></span>
                      <span>Client: {item.client.name}</span>
                      <span></span>
                      <span>{item.job.pages} pages</span>
                      {item.job.subject && (
                        <>
                          <span></span>
                          <span>{item.job.subject}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned: {new Date(item.assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(item.assignment.approvalStatus)}
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/editor/review/${item.job.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
