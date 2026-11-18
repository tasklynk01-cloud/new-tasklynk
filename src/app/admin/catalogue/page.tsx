"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  Edit3, 
  Percent, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  MessageCircle, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminCataloguePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'bundles' | 'quotes'>('services');

  // Editing state for modal or inline quick edit
  const [editingItem, setEditingItem] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        router.push('/');
        return;
      }
      fetchCatalogueData();
    }
  }, [user, authLoading]);

  const fetchCatalogueData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/catalogue');
      if (!res.ok) throw new Error('Failed to load catalogue');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching catalogue data');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (service: any) => {
    try {
      const nextPublished = !service.published;
      const res = await fetch('/api/admin/catalogue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service',
          slug: service.slug,
          published: nextPublished,
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`${service.name} is now ${nextPublished ? 'Published' : 'Unpublished'}`);

      // Optimistic update
      setData((prev: any) => ({
        ...prev,
        services: prev.services.map((s: any) =>
          s.slug === service.slug ? { ...s, published: nextPublished } : s
        ),
      }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleOrderable = async (service: any) => {
    try {
      const nextOrderable = !service.orderable;
      const res = await fetch('/api/admin/catalogue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service',
          slug: service.slug,
          orderable: nextOrderable,
        }),
      });

      if (!res.ok) throw new Error('Failed to update orderable flag');

      toast.success(`${service.name} direct ordering ${nextOrderable ? 'Enabled' : 'Disabled (Quote Only)'}`);

      setData((prev: any) => ({
        ...prev,
        services: prev.services.map((s: any) =>
          s.slug === service.slug ? { ...s, orderable: nextOrderable } : s
        ),
      }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportReport = () => {
    if (!data?.services) return;
    const headers = ['Category', 'Slug', 'Service Name', 'Pricing Model', 'Starting Price KSh', 'Turnaround', 'Published', 'Orderable'];
    const rows = data.services.map((s: any) => [
      `"${s.categorySlug}"`,
      `"${s.slug}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.pricingModel}"`,
      s.startingPrice || 0,
      `"${s.turnaround.split('.')[0]}"`,
      s.published ? 'YES' : 'NO',
      s.orderable ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tasklynk_service_catalogue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Operational catalogue report exported');
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7A3D]" />
        <p className="text-xs text-muted-foreground mt-2">Loading Service Catalogue Management...</p>
      </div>
    );
  }

  const services = data.services || [];
  const bundles = data.bundles || [];
  const categories = data.categories || [];
  const analytics = data.analytics || {};
  const recentQuotes = data.recentQuotes || [];

  const filteredServices = services.filter((s: any) => {
    if (selectedCategory !== 'all' && s.categorySlug !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || s.tools.some((t: string) => t.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B3A8C]/10 text-[#5B3A8C] text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Catalogue Operations & Governance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#22183D] dark:text-white">
            Service Catalogue & Commercial Analytics
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Publish, price, and monitor individual services, bundles, quotation requests, and specialist assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="text-xs bg-[#FF7A3D] hover:bg-[#E9662F] text-white flex items-center gap-1.5"
          >
            <Link href="/catalogue" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live Catalogue</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Total Services</span>
            <span className="text-2xl font-black text-[#22183D] dark:text-white mt-1 block">
              {analytics.totalCatalogueServices}
            </span>
            <span className="text-[10px] text-muted-foreground">Across 6 categories</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Published Live</span>
            <span className="text-2xl font-black text-[#25D366] mt-1 block">
              {analytics.publishedCount}
            </span>
            <span className="text-[10px] text-muted-foreground">Active in catalogue</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Direct Orderable</span>
            <span className="text-2xl font-black text-[#5B3A8C] dark:text-[#C5B3E6] mt-1 block">
              {analytics.orderableCount}
            </span>
            <span className="text-[10px] text-muted-foreground">With confirmed specialists</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Quote Requests</span>
            <span className="text-2xl font-black text-[#FF7A3D] mt-1 block">
              {analytics.totalQuotationRequests}
            </span>
            <span className="text-[10px] text-muted-foreground">Customer enquiries</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Total Revenue</span>
            <span className="text-2xl font-black text-[#22183D] dark:text-white mt-1 block">
              KSh {Number(analytics.totalRevenueKSh || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">{analytics.totalOrders} total jobs</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground block">Customer Rating</span>
            <span className="text-2xl font-black text-[#25D366] mt-1 block">
              ★ {analytics.averageSatisfactionRating} / 5.0
            </span>
            <span className="text-[10px] text-muted-foreground">Verified reviews</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E1F2] dark:border-[#2C2147] pb-3">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-[#22183D] text-white dark:bg-[#5B3A8C]'
              : 'text-muted-foreground hover:bg-[#F2EDF8]'
          }`}
        >
          Individual Services ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('bundles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bundles'
              ? 'bg-[#22183D] text-white dark:bg-[#5B3A8C]'
              : 'text-muted-foreground hover:bg-[#F2EDF8]'
          }`}
        >
          Service Bundles ({bundles.length})
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'quotes'
              ? 'bg-[#22183D] text-white dark:bg-[#5B3A8C]'
              : 'text-muted-foreground hover:bg-[#F2EDF8]'
          }`}
        >
          Recent Quotation Inquiries ({recentQuotes.length})
        </button>
      </div>

      {/* TAB 1: Individual Services */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search services by title, slug, or tool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 text-xs w-full sm:w-80 rounded-xl"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 text-xs w-48 rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground">
              Showing <strong>{filteredServices.length}</strong> of {services.length} services
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8FD] dark:bg-[#20183B] border-b border-[#E8E1F2] dark:border-[#2C2147] text-[#554C68] dark:text-[#C5BDD7] font-semibold">
                  <tr>
                    <th className="p-3.5">Service Name & Slug</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Pricing Model</th>
                    <th className="p-3.5">Turnaround</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Direct Order</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EBF8] dark:divide-[#251B3E]">
                  {filteredServices.map((service: any) => (
                    <tr key={service.slug} className="hover:bg-[#FAF8FD]/60 dark:hover:bg-[#1E1736]">
                      <td className="p-3.5">
                        <Link 
                          href={`/catalogue/${service.categorySlug}/${service.slug}`}
                          target="_blank"
                          className="font-bold text-[#22183D] dark:text-white hover:text-[#FF7A3D] transition-colors"
                        >
                          {service.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          /{service.slug}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] bg-[#FAF8FD] text-[#5B3A8C]">
                          {service.categorySlug.split('-')[0]}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <span className="capitalize">{service.pricingModel.replace('_', ' ')}</span>
                        {service.startingPrice && (
                          <span className="text-[10px] text-muted-foreground block">
                            From KSh {service.startingPrice}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {service.turnaround.split('.')[0]}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => togglePublish(service)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                            service.published
                              ? 'bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25'
                              : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                          }`}
                        >
                          {service.published ? 'Live' : 'Hidden'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleOrderable(service)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                            service.orderable
                              ? 'bg-[#5B3A8C]/15 text-[#5B3A8C] dark:text-[#C5B3E6]'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {service.orderable ? 'Orderable' : 'Quote Only'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/catalogue/${service.categorySlug}/${service.slug}`} target="_blank">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bundles */}
      {activeTab === 'bundles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map((bundle: any) => (
            <Card key={bundle.slug} className="rounded-3xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E] p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-[#FF7A3D] text-white text-xs">
                  Save {bundle.discountPercent}% Bundle Discount
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {bundle.includes.length} Connected Services
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#22183D] dark:text-white">
                {bundle.name}
              </h3>
              <p className="text-xs text-[#FF7A3D] font-medium mt-0.5">
                {bundle.tagline}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {bundle.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#F0EAF8] dark:border-[#261B42]">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Connected Underlying Services:
                </span>
                <ul className="space-y-1.5 text-xs">
                  {bundle.includes.map((item: any, i: number) => (
                    <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      <span>{item.serviceSlug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F0EAF8] dark:border-[#261B42] flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Turnaround: <strong>{bundle.turnaround.split('.')[0]}</strong>
                </span>
                <Badge variant="outline" className="text-xs text-[#25D366] bg-[#25D366]/10 border-transparent">
                  Active
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: Recent Quotes */}
      {activeTab === 'quotes' && (
        <div className="rounded-2xl border border-[#E5DEEE] dark:border-[#2D2347] bg-white dark:bg-[#1A132E] overflow-hidden">
          {recentQuotes.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              No recent quotation requests found in message history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8FD] dark:bg-[#20183B] border-b border-[#E8E1F2] dark:border-[#2C2147] text-[#554C68] dark:text-[#C5BDD7] font-semibold">
                  <tr>
                    <th className="p-3.5">Reference & Client</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EBF8] dark:divide-[#251B3E]">
                  {recentQuotes.map((msg: any) => (
                    <tr key={msg.id} className="hover:bg-[#FAF8FD]/60 dark:hover:bg-[#1E1736]">
                      <td className="p-3.5 font-bold text-[#22183D] dark:text-white">
                        {msg.senderName}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {msg.senderEmail}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {msg.senderPhone || 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-transparent">
                          {msg.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

