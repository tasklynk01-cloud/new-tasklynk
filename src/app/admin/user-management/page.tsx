"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Tag, RefreshCw, Database } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

export default function AdminUserManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [restoringRoles, setRestoringRoles] = useState(false);
  const [seedingCategories, setSeedingCategories] = useState(false);
  const [categoriesSummary, setCategoriesSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleRestoreRoles = async () => {
    if (!confirm('Are you sure you want to restore all users to their original roles? This will revert any manual role changes.')) {
      return;
    }

    setRestoringRoles(true);
    try {
      const response = await safeApiFetch('/api/admin/restore-original-roles', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

if (response.ok) {
        toast.success(`Successfully restored ${data.updates.length} users to their original roles`);
        if (data.updates.length > 0) {
        }
      } else {
        toast.error(extractErrorMessage(data, 'Failed to restore user roles'));
      }
    } catch (error) {
      console.error('Error restoring roles:', error);
      toast.error('Failed to restore user roles');
    } finally {
      setRestoringRoles(false);
    }
  };

  const handleSeedCategories = async () => {
    if (!confirm('This will categorize all users based on their current roles. Continue?')) {
      return;
    }

    setSeedingCategories(true);
    try {
      const response = await safeApiFetch('/api/admin/user-categories/seed', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully categorized ${data.categorizations.length} users`);
        fetchCategoriesSummary(); // Refresh summary
      } else {
        toast.error(extractErrorMessage(data, 'Failed to seed user categories'));
      }
    } catch (error) {
      console.error('Error seeding categories:', error);
      toast.error('Failed to seed user categories');
    } finally {
      setSeedingCategories(false);
    }
  };

  const fetchCategoriesSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await safeApiFetch('/api/admin/user-categories', {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setCategoriesSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching categories summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    router.push('/');
    return null;
  }

  return (
    <div className="w-full bg-background min-h-screen space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border hover:bg-muted text-xs font-semibold">
            <Link href="/admin/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">User Management Tools</h1>
            <p className="text-xs text-muted-foreground">
              Restore original roles and manage user categorization
            </p>
          </div>
        </div>
      </div>

      {/* Restore Original Roles Card */}
      <Card className="mb-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <CardHeader className="rounded-t-2xl bg-gradient-to-r from-primary/5 to-secondary/10 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5" />
            Restore Original User Roles
          </CardTitle>
          <CardDescription>
            Reset all users to their original intended roles (freelancer, client, admin). 
            This removes any unintended role changes like managers who shouldn't be managers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-6">
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                ?? Important Information
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li> Freelancers will remain freelancers</li>
                <li> Clients will remain clients</li>
                <li> Admins will remain admins</li>
                <li> Account owners will remain account owners</li>
                <li> Valid managers (with invitations) will remain managers</li>
                <li> Any incorrectly assigned roles will be corrected</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleRestoreRoles} 
              disabled={restoringRoles}
              variant="default"
              size="lg"
              className="w-full sm:w-auto"
            >
              {restoringRoles ? (
                <>
                  <span className="animate-spin mr-2">?</span>
                  Restoring Roles...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restore Original Roles
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Categories Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Tag className="w-5 h-5" />
            User Categories System
          </CardTitle>
          <CardDescription>
            Categorize users into groups for better reporting and organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                ?? Category Types
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li> <strong>Clients with Account</strong> - Clients belonging to a company account</li>
                <li> <strong>Clients without Account</strong> - Individual clients not linked to any account</li>
                <li> <strong>Admin</strong> - Platform administrators</li>
                <li> <strong>Freelancers</strong> - Registered writers</li>
                <li> <strong>Managers</strong> - Team managers with assigned users</li>
              </ul>
            </div>

            {categoriesSummary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-background border rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{categoriesSummary.admin}</div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </div>
                <div className="bg-background border rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{categoriesSummary.manager}</div>
                  <div className="text-xs text-muted-foreground">Managers</div>
                </div>
                <div className="bg-background border rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{categoriesSummary.freelancer}</div>
                  <div className="text-xs text-muted-foreground">Freelancers</div>
                </div>
                <div className="bg-background border rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{categoriesSummary.client_with_account}</div>
                  <div className="text-xs text-muted-foreground">Clients (Account)</div>
                </div>
                <div className="bg-background border rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{categoriesSummary.client_without_account}</div>
                  <div className="text-xs text-muted-foreground">Clients (No Account)</div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={handleSeedCategories} 
                disabled={seedingCategories}
                variant="default"
                size="lg"
                className="flex-1"
              >
                {seedingCategories ? (
                  <>
                    <span className="animate-spin mr-2">?</span>
                    Categorizing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Categories
                  </>
                )}
              </Button>
              <Button 
                onClick={fetchCategoriesSummary} 
                disabled={loadingSummary}
                variant="outline"
                size="lg"
              >
                {loadingSummary ? (
                  <span className="animate-spin">?</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
