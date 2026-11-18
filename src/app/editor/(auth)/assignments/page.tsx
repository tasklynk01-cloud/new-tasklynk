"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Assignment {
  assignment: {
    id: number;
    approvalStatus: string;
    assignedAt: string;
    reviewStartedAt: string | null;
    approvalReason: string | null;
    revisionsRequested: boolean;
    revisionNotes: string | null;
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

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function EditorAssignmentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusFilter);

  const fetchAssignments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await safeApiFetch(`/api/editor/dashboard?editorId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      const result = await response.json();
      
      // Combine all assignments
      const allAssignments = [
        ...(result.pendingReviews || []),
        ...(result.inReview || []),
        ...(result.completed || []),
      ];
      
      setAssignments(allAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.id]);

  // Filter assignments
  const filteredAssignments = assignments.filter(item => {
    const matchesStatus = selectedStatus === 'all' || item.assignment.approvalStatus === selectedStatus;
    const matchesSearch = search === '' || 
      item.job.title.toLowerCase().includes(search.toLowerCase()) ||
      item.job.displayId.toLowerCase().includes(search.toLowerCase()) ||
      item.client.name.toLowerCase().includes(search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      case 'reviewing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">In Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'reviewing':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchAssignments}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">
            View and manage your assigned orders for review
          </p>
        </div>
        <Button onClick={fetchAssignments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, title, or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments ({filteredAssignments.length})</CardTitle>
          <CardDescription>
            {selectedStatus === 'all' 
              ? 'All your assigned orders' 
              : `Showing ${selectedStatus} assignments`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length > 0 ? (
            <div className="space-y-4">
              {filteredAssignments.map((item) => (
                <div
                  key={item.assignment.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.assignment.approvalStatus === 'pending' ? 'bg-yellow-500/10' :
                      item.assignment.approvalStatus === 'reviewing' ? 'bg-blue-500/10' :
                      item.assignment.approvalStatus === 'approved' ? 'bg-green-500/10' :
                      'bg-red-500/10'
                    }`}>
                      {getStatusIcon(item.assignment.approvalStatus)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.job.title}</p>
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
                        {item.assignment.reviewStartedAt && (
                          <>  Review started: {new Date(item.assignment.reviewStartedAt).toLocaleDateString()}</>
                        )}
                      </p>
                      {item.assignment.revisionNotes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Notes: {item.assignment.revisionNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(item.assignment.approvalStatus)}
                    {(item.assignment.approvalStatus === 'pending' || item.assignment.approvalStatus === 'reviewing') && (
                      <Link href={`/editor/review/${item.job.id}`}>
                        <Button size="sm">
                          {item.assignment.approvalStatus === 'pending' ? 'Start Review' : 'Continue Review'}
                        </Button>
                      </Link>
                    )}
                    <Link href={`/editor/review/${item.job.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No assignments found</p>
              <p className="text-sm text-muted-foreground">
                {search || selectedStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'You have no assigned orders yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
