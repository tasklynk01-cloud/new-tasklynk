"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Assignment {
  assignment: {
    id: number;
    approvalStatus: string;
    assignedAt: string;
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

export default function PendingAssignmentsPage() {
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
      const response = await safeApiFetch(`/api/editor/assignments?status=pending`, {
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
            <Clock className="h-6 w-6 text-yellow-500" />
            Pending Reviews
          </h1>
          <p className="text-muted-foreground">Orders waiting for your quality review</p>
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
              placeholder="Search pending reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews ({filteredAssignments.length})</CardTitle>
          <CardDescription>Start reviewing these orders</CardDescription>
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-yellow-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">{item.job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {item.job.displayId}  Client: {item.client.name}  {item.job.pages} pages
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Deadline: {new Date(item.job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
                    <Link href={`/editor/review/${item.job.id}`}>
                      <Button size="sm">Start Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No pending reviews</p>
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
