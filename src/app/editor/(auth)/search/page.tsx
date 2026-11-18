"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Search, Filter, FileText, Calendar, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

interface OrderSearchResult {
  id: number;
  orderId: string;
  displayId: string;
  title: string;
  status: string;
  editorStatus: string;
  deadline: string;
  clientName: string;
  assignedEditorId?: number;
  editorClaimedAt?: string;
}

export default function EditorSearchOrdersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await safeApiFetch(
        `/api/v2/editor/search?q=${encodeURIComponent(searchQuery)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.orders || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search orders");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      pending_editing: { label: "Pending", variant: "outline" },
      editing_in_progress: { label: "In Progress", variant: "default" },
      awaiting_revision: { label: "Needs Revision", variant: "secondary" },
      awaiting_admin_review: { label: "Ready for Admin", variant: "default" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Search Orders</h1>
          <p className="text-gray-600 mt-1">Search for orders by ID, title, or client name</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by Order ID, Title, or Client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 h-12 bg-[#ff8c42] hover:bg-[#e67a32]"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search Results</span>
                <span className="text-sm font-normal text-gray-600">
                  {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No orders found matching your search</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((order) => (
                    <Link
                      key={order.id}
                      href={`/editor/review-v2/${order.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-[#ff8c42] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{order.displayId}</h3>
                            {getStatusBadge(order.editorStatus)}
                            {order.assignedEditorId === user?.id && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Your Assignment
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700">{order.title}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4" />
                          <span>{order.clientName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(order.deadline), "MMM dd, yyyy")}</span>
                        </div>
                        {order.editorClaimedAt && (
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4" />
                            <span>Claimed {format(new Date(order.editorClaimedAt), "MMM dd")}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
