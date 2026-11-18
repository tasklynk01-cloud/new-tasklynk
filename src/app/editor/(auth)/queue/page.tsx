"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Clock, AlertTriangle, CheckCircle, XCircle, 
  Filter, RefreshCw, Eye, Flag, Calendar, User,
  Download, Search, ArrowUpDown, ChevronDown, Loader2
} from "lucide-react";
import { format, differenceInHours, isPast, addDays } from "date-fns";
import { toast } from "sonner";

interface OrderQueueItem {
  id: number;
  orderId: string;
  displayId: string;
  title: string;
  status: string;
  editorStatus: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline: string;
  clientName: string;
  assignedAt: string;
  pages?: number;
  slides?: number;
  isFlagged: boolean;
  hasRevisionRequest: boolean;
  editorNotes?: any;
  hoursUntilDeadline: number;
  isOverdue: boolean;
}

type FilterType = 'all' | 'pending' | 'in-progress' | 'overdue' | 'flagged' | 'revision';
type SortField = 'deadline' | 'assignedAt' | 'priority' | 'orderId';
type SortOrder = 'asc' | 'desc';

export default function EditorQueuePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderQueueItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchQueueOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, selectedFilter, sortField, sortOrder, searchQuery]);

  const fetchQueueOrders = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch('/api/v2/editor/queue', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch queue orders');
      }

      const data = await response.json();
      
      // Transform and enrich orders
      const enrichedOrders = data.orders.map((order: any) => {
        const deadline = new Date(order.deadline);
        const now = new Date();
        const hoursUntilDeadline = differenceInHours(deadline, now);
        
        return {
          ...order,
          hoursUntilDeadline,
          isOverdue: isPast(deadline),
          priority: determinePriority(hoursUntilDeadline, order.editorStatus),
        };
      });

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching queue orders:', error);
      toast.error('Failed to load queue orders');
    } finally {
      setLoading(false);
    }
  };

  const determinePriority = (hoursUntilDeadline: number, editorStatus: string): 'low' | 'normal' | 'high' | 'urgent' => {
    if (hoursUntilDeadline < 0) return 'urgent';
    if (hoursUntilDeadline < 12) return 'urgent';
    if (hoursUntilDeadline < 24) return 'high';
    if (hoursUntilDeadline < 48) return 'normal';
    return 'low';
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Apply filter
    switch (selectedFilter) {
      case 'pending':
        filtered = filtered.filter(o => o.editorStatus === 'pending_editing');
        break;
      case 'in-progress':
        filtered = filtered.filter(o => o.editorStatus === 'editing_in_progress');
        break;
      case 'overdue':
        filtered = filtered.filter(o => o.isOverdue);
        break;
      case 'flagged':
        filtered = filtered.filter(o => o.isFlagged);
        break;
      case 'revision':
        filtered = filtered.filter(o => o.hasRevisionRequest);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.orderId.toLowerCase().includes(query) ||
        o.displayId.toLowerCase().includes(query) ||
        o.title.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'deadline':
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'assignedAt':
          comparison = new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'orderId':
          comparison = a.orderId.localeCompare(b.orderId);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredOrders(filtered);
  };

  const handleClaimOrder = async (orderId: number) => {
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/claim`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to claim order');
      }

      toast.success('Order claimed successfully');
      fetchQueueOrders();
    } catch (error) {
      console.error('Error claiming order:', error);
      toast.error('Failed to claim order');
    }
  };

  const handleReleaseOrder = async (orderId: number) => {
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/release`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to release order');
      }

      toast.success('Order released successfully');
      fetchQueueOrders();
    } catch (error) {
      console.error('Error releasing order:', error);
      toast.error('Failed to release order');
    }
  };

  const handleToggleFlag = async (orderId: number) => {
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/flag`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to toggle flag');
      }

      toast.success('Flag status updated');
      fetchQueueOrders();
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Failed to update flag');
    }
  };

  const handleBulkClaim = async () => {
    if (selectedOrders.size === 0) {
      toast.error('No orders selected');
      return;
    }

    try {
      setBulkActionLoading(true);
      const orderIds = Array.from(selectedOrders);

      const response = await safeApiFetch('/api/v2/editor/orders/bulk-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderIds })
      });

      if (!response.ok) {
        throw new Error('Failed to claim orders');
      }

      const result = await response.json();
      toast.success(`Claimed ${result.successCount} orders successfully`);
      setSelectedOrders(new Set());
      fetchQueueOrders();
    } catch (error) {
      console.error('Error bulk claiming:', error);
      toast.error('Failed to claim orders');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[priority as keyof typeof styles] || styles.normal;
  };

  const getStatusBadge = (editorStatus: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending_editing: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      editing_in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      awaiting_revision: { label: 'Revision', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      awaiting_admin_review: { label: 'Admin Review', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' }
    };
    const status = statusMap[editorStatus] || { label: editorStatus, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    return status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Queue</h1>
          <p className="text-gray-600">Manage your assigned editing tasks efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Queue</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.editorStatus === 'pending_editing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.editorStatus === 'editing_in_progress').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.isOverdue).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Flagged</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.isFlagged).length}
                </p>
              </div>
              <Flag className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, title, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-3">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="overdue">Overdue</option>
                <option value="flagged">Flagged</option>
                <option value="revision">Needs Revision</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as SortField);
                  setSortOrder(order as SortOrder);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent"
              >
                <option value="deadline-asc">Deadline (Earliest)</option>
                <option value="deadline-desc">Deadline (Latest)</option>
                <option value="priority-asc">Priority (High to Low)</option>
                <option value="assignedAt-desc">Recently Assigned</option>
                <option value="orderId-asc">Order ID (A-Z)</option>
              </select>

              <button
                onClick={fetchQueueOrders}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.size > 0 && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkClaim}
                disabled={bulkActionLoading}
                className="px-4 py-1.5 bg-[#ff8c42] hover:bg-[#e67a32] text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>Claim Selected</>
                )}
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No orders found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-gray-300 text-[#ff8c42] focus:ring-[#ff8c42]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {order.isFlagged && <Flag className="h-4 w-4 text-orange-500 fill-orange-500" />}
                          {order.hasRevisionRequest && <AlertTriangle className="h-4 w-4 text-purple-500" />}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{order.displayId}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs" title={order.title}>
                              {order.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{order.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.editorStatus).className}`}>
                          {getStatusBadge(order.editorStatus).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(order.priority)}`}>
                          {order.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className={`font-medium ${order.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {format(new Date(order.deadline), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.deadline), 'hh:mm a')}
                          </p>
                          {order.isOverdue ? (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {Math.abs(order.hoursUntilDeadline)}h overdue
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              {order.hoursUntilDeadline}h remaining
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          {order.pages && <p>{order.pages} pages</p>}
                          {order.slides && <p>{order.slides} slides</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => router.push(`/editor/review/${order.id}`)}
                            className="p-4 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Review Order"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFlag(order.id)}
                            className={`p-4 rounded-lg transition-colors ${
                              order.isFlagged 
                                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={order.isFlagged ? 'Remove Flag' : 'Add Flag'}
                          >
                            <Flag className={`h-4 w-4 ${order.isFlagged ? 'fill-orange-600' : ''}`} />
                          </button>
                          {order.editorStatus === 'pending_editing' && (
                            <button
                              onClick={() => handleClaimOrder(order.id)}
                              className="px-3 py-1.5 bg-[#ff8c42] hover:bg-[#e67a32] text-white text-xs rounded-lg transition-colors"
                            >
                              Claim
                            </button>
                          )}
                          {order.editorStatus === 'editing_in_progress' && (
                            <button
                              onClick={() => handleReleaseOrder(order.id)}
                              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing {filteredOrders.length} of {orders.length} total orders
          </p>
          <p>
            Last updated: {format(new Date(), 'hh:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}
