'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface WriterTier {
  id: number;
  name: string;
  minRating: number;
  minJobs: number;
  minSuccessRate: number;
  benefits: string[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export default function WriterTiersPage() {
  const [tiers, setTiers] = useState<WriterTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<WriterTier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<WriterTier | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    minRating: '0',
    minJobs: '0',
    minSuccessRate: '0',
    benefits: '',
    color: '#3B82F6',
    icon: '?',
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await safeApiFetch('/api/v2/writer-tiers');
      const data = await response.json();

      if (data.success) {
        setTiers(data.tiers);
      } else {
        toast.error('Failed to load writer tiers');
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load writer tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tier?: WriterTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        name: tier.name,
        minRating: tier.minRating.toString(),
        minJobs: tier.minJobs.toString(),
        minSuccessRate: tier.minSuccessRate.toString(),
        benefits: tier.benefits.join('\n'),
        color: tier.color,
        icon: tier.icon,
      });
    } else {
      setEditingTier(null);
      setFormData({
        name: '',
        minRating: '0',
        minJobs: '0',
        minSuccessRate: '0',
        benefits: '',
        color: '#3B82F6',
        icon: '?',
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const benefits = formData.benefits
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const payload = {
        name: formData.name,
        minRating: parseFloat(formData.minRating),
        minJobs: parseInt(formData.minJobs),
        minSuccessRate: parseFloat(formData.minSuccessRate),
        benefits,
        color: formData.color,
        icon: formData.icon,
      };

      const url = editingTier
        ? `/api/v2/writer-tiers/${editingTier.id}`
        : '/api/v2/writer-tiers';
      
      const method = editingTier ? 'PATCH' : 'POST';

      const response = await safeApiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingTier ? 'Tier updated successfully' : 'Tier created successfully');
        setShowDialog(false);
        fetchTiers();
      } else {
        toast.error(extractErrorMessage(data, 'Failed to save tier'));
      }
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error('Failed to save tier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tierToDelete) return;

    try {
      const response = await safeApiFetch(`/api/v2/writer-tiers/${tierToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tier deleted successfully');
        setDeleteDialogOpen(false);
        setTierToDelete(null);
        fetchTiers();
      } else {
        toast.error(extractErrorMessage(data, 'Failed to delete tier'));
      }
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading writer tiers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Writer Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Manage freelancer progression tiers and benefits
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card key={tier.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <CardTitle>{tier.name}</CardTitle>
                </div>
                <Badge style={{ backgroundColor: tier.color }}>
                  Tier
                </Badge>
              </div>
              <CardDescription>
                Requirements for this tier level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min Rating:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {tier.minRating.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min Jobs:</span>
                  <span className="font-medium">{tier.minJobs}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-medium">
                    {(tier.minSuccessRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {tier.benefits && tier.benefits.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Benefits:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-500 mt-0.5">?</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(tier)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setTierToDelete(tier);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tiers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No writer tiers defined yet. Create your first tier to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Writer Tier' : 'Create Writer Tier'}
            </DialogTitle>
            <DialogDescription>
              Define the requirements and benefits for this tier level
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beginner, Expert"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon/Emoji</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="?"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minRating">Min Rating (0-5) *</Label>
                <Input
                  id="minRating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.minRating}
                  onChange={(e) => setFormData({ ...formData, minRating: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minJobs">Min Jobs Completed *</Label>
                <Input
                  id="minJobs"
                  type="number"
                  min="0"
                  value={formData.minJobs}
                  onChange={(e) => setFormData({ ...formData, minJobs: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSuccessRate">Success Rate (0-1) *</Label>
                <Input
                  id="minSuccessRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.minSuccessRate}
                  onChange={(e) => setFormData({ ...formData, minSuccessRate: e.target.value })}
                  placeholder="0.85 = 85%"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Tier Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (one per line)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="Priority job access&#10;Higher pay rates&#10;Featured profile"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Enter each benefit on a new line
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingTier ? 'Update Tier' : 'Create Tier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tier &quot;{tierToDelete?.name}&quot;.
              Freelancers currently in this tier will have their tier reference removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTierToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
