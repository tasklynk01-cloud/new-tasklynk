"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Eye,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeApiFetch } from '@/lib/client-api-helpers';

interface SpecialistProfileRecord {
  profileId: number;
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  profileStatus: string;
  publicSlug: string | null;
  education: Array<{
    institution: string;
    course: string;
    qualification: string;
    completionYear?: string;
  }>;
  experience: Array<{
    title: string;
    organization: string;
    period: string;
    description: string;
  }>;
  portfolio: Array<{
    title: string;
    role: string;
    description: string;
    imageUrl?: string;
  }>;
  reviewNotes: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export default function AdminSpecialistProfilesPage() {
  const [profiles, setProfiles] = useState<SpecialistProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected profile for deep inspection / action
  const [selectedProfile, setSelectedProfile] = useState<SpecialistProfileRecord | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'request_changes' | 'reject' | 'unpublish' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [statusFilter]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await safeApiFetch(`/api/admin/specialist-profiles?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setProfiles(json.data || []);
        }
      } else {
        toast.error('Failed to load specialist profiles');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading profiles');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (profile: SpecialistProfileRecord, action: 'approve' | 'request_changes' | 'reject' | 'unpublish') => {
    setSelectedProfile(profile);
    setCurrentAction(action);
    setActionNotes(profile.reviewNotes || '');
    setCustomSlug(profile.publicSlug || '');
    setActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedProfile || !currentAction) return;

    try {
      setProcessingAction(true);
      const res = await safeApiFetch('/api/admin/specialist-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedProfile.userId,
          action: currentAction,
          reviewNotes: actionNotes,
          customSlug: customSlug || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Action executed successfully');
        setActionModalOpen(false);
        fetchProfiles();
      } else {
        toast.error(json.error || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error executing action');
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.headline || '').toLowerCase().includes(q) ||
      (p.publicSlug || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-600 text-white font-bold text-xs">Published</Badge>;
      case 'pending_review':
        return <Badge className="bg-amber-500 text-white font-bold text-xs">Pending Review</Badge>;
      case 'changes_requested':
        return <Badge className="bg-rose-500 text-white font-bold text-xs">Corrections Requested</Badge>;
      case 'rejected':
        return <Badge className="bg-red-800 text-white font-bold text-xs">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF7A3D]" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Specialist Profile Evaluation &amp; Directory Review
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review submitted qualifications, inspect portfolios, approve, request changes, or publish specialist profiles to the public directory.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending_review', label: 'Pending Review' },
              { id: 'published', label: 'Published' },
              { id: 'changes_requested', label: 'Corrections' },
              { id: 'draft', label: 'Draft' },
            ].map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
                className="text-xs rounded-xl font-bold"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profiles List */}
      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-xs text-muted-foreground">Loading specialist profiles...</p>
        </Card>
      ) : filteredProfiles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm font-bold text-foreground">No profiles found</p>
          <p className="text-xs text-muted-foreground mt-1">
            No specialist profiles match the selected status filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProfiles.map((p) => (
            <Card key={p.userId} className="rounded-2xl shadow-sm border hover:border-border/80 transition-all">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B3594] to-[#FF7A3D] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                      {(p.name || 'S').charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-base text-foreground">{p.name}</h3>
                        {getStatusBadge(p.profileStatus)}
                        {p.publicSlug && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            /professionals/{p.publicSlug}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#FF7A3D] mt-0.5">
                        {p.headline || 'No headline set'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.email} • {p.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {p.profileStatus === 'published' && p.publicSlug && (
                      <Button asChild size="sm" variant="outline" className="text-xs rounded-xl">
                        <a href={`/professionals/${p.publicSlug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Live
                        </a>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(p, 'request_changes')}
                      className="text-xs rounded-xl text-amber-600 dark:text-amber-400 hover:text-amber-700"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Request Changes
                    </Button>

                    {p.profileStatus !== 'published' ? (
                      <Button
                        size="sm"
                        onClick={() => openActionModal(p, 'approve')}
                        className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve &amp; Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openActionModal(p, 'unpublish')}
                        className="text-xs rounded-xl text-rose-600 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Unpublish
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {p.bio && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 bg-muted/20 p-3 rounded-xl border">
                    {p.bio}
                  </p>
                )}

                {/* Credentials & Experience Highlights */}
                <div className="grid md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div>
                    <span className="font-bold text-foreground block mb-1">
                      Education ({p.education?.length || 0}):
                    </span>
                    {p.education && p.education.length > 0 ? (
                      <ul className="space-y-1 text-muted-foreground">
                        {p.education.slice(0, 2).map((edu, idx) => (
                          <li key={idx} className="line-clamp-1">
                            • {edu.course} ({edu.institution})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground italic">None listed</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-foreground block mb-1">
                      Experience ({p.experience?.length || 0}):
                    </span>
                    {p.experience && p.experience.length > 0 ? (
                      <ul className="space-y-1 text-muted-foreground">
                        {p.experience.slice(0, 2).map((exp, idx) => (
                          <li key={idx} className="line-clamp-1">
                            • {exp.title} ({exp.organization})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground italic">None listed</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-foreground block mb-1">
                      Portfolio ({p.portfolio?.length || 0}/3):
                    </span>
                    {p.portfolio && p.portfolio.length > 0 ? (
                      <div className="flex gap-2">
                        {p.portfolio.map((item, idx) => (
                          item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={idx}
                              src={item.imageUrl}
                              alt={item.title || 'Portfolio sample'}
                              className="w-12 h-12 object-cover rounded-lg border"
                              title={item.title}
                            />
                          ) : (
                            <span key={idx} className="px-2 py-1 bg-muted rounded text-[10px]">
                              {item.title}
                            </span>
                          )
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No screenshots</span>
                    )}
                  </div>
                </div>

                {/* Review Notes alert if present */}
                {p.reviewNotes && (
                  <div className="text-[11px] p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
                    <strong>Previous Note:</strong> {p.reviewNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {currentAction === 'approve' && 'Approve & Publish Specialist Profile'}
              {currentAction === 'request_changes' && 'Request Corrections'}
              {currentAction === 'reject' && 'Reject Specialist Profile'}
              {currentAction === 'unpublish' && 'Unpublish Profile from Directory'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Specialist: <strong>{selectedProfile?.name}</strong> ({selectedProfile?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {currentAction === 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="customSlug" className="text-xs">Public Profile Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">tasklynk.co.ke/professionals/</span>
                  <Input
                    id="customSlug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. catherine-w"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs">
                {currentAction === 'approve' ? 'Approval / Internal Notes (Optional)' : 'Review Notes & Instructions for Specialist *'}
              </Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder={
                  currentAction === 'request_changes'
                    ? 'Specify exactly what the specialist should edit or update before approval...'
                    : 'Add any review notes or quality observations...'
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActionModalOpen(false)}
              disabled={processingAction}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteAction}
              disabled={processingAction || (currentAction === 'request_changes' && !actionNotes.trim())}
              className={`text-xs rounded-xl font-bold ${
                currentAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : currentAction === 'request_changes'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {processingAction ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                'Confirm Action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
