"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context-v2";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Database, RefreshCw, Loader2, ArrowLeft, Users, UserPlus, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type UserCategorySummary = Record<string, number>;

type CategoryMeta = {
  key: string;
  label: string;
  description: string;
  accentClass: string;
  route?: string;
};

type UserForBulkAssign = {
  id: number;
  name: string;
  email: string;
  role: string;
  currentCategory: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "freelancer", label: "Freelancer" },
  { value: "client_with_account", label: "Client (Account)" },
  { value: "client_without_account", label: "Client (Individual)" },
  { value: "vip", label: "VIP Client" },
  { value: "preferred", label: "Preferred" },
  { value: "new", label: "New User" },
  { value: "inactive", label: "Inactive" },
];

const CATEGORY_META: CategoryMeta[] = [
  {
    key: "admin",
    label: "Admins",
    description: "Platform administrators with full access",
    accentClass: "text-red-600 dark:text-red-400",
    route: "/admin/user-management/admins",
  },
  {
    key: "manager",
    label: "Managers",
    description: "Team managers coordinating writers",
    accentClass: "text-purple-600 dark:text-purple-300",
    route: "/admin/user-management/managers",
  },
  {
    key: "freelancer",
    label: "Freelancers",
    description: "Approved writers available for assignments",
    accentClass: "text-green-600 dark:text-green-400",
    route: "/admin/user-management/freelancers",
  },
  {
    key: "client_with_account",
    label: "Clients (Account)",
    description: "Clients linked to corporate accounts",
    accentClass: "text-blue-600 dark:text-blue-400",
    route: "/admin/user-management/clients",
  },
  {
    key: "client_without_account",
    label: "Clients (Individual)",
    description: "Standalone clients without account linkage",
    accentClass: "text-orange-600 dark:text-orange-400",
    route: "/admin/user-management/clients",
  },
];

export default function UserCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<UserCategorySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
  // Bulk assignment state
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [usersForAssignment, setUsersForAssignment] = useState<UserForBulkAssign[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [targetCategory, setTargetCategory] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const response = await safeApiFetch("/api/admin/user-categories", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch category summary");
      }

      const data = await response.json();
      setSummary(data.summary || {});
    } catch (error) {
      console.error("[UserCategoriesPage] Failed to load summary", error);
      toast.error("Failed to load category summary");
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const handleSeedCategories = useCallback(async () => {
    if (!confirm("Categorize all users based on their roles?")) {
      return;
    }

    setSeeding(true);
    try {
      const response = await safeApiFetch("/api/admin/user-categories/seed", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed categories");
      }

      toast.success(`Categorized ${data.categorizations?.length ?? 0} users`);
      await fetchSummary();
    } catch (error) {
      console.error("[UserCategoriesPage] Failed to seed categories", error);
      toast.error("Failed to categorize users. Please try again.");
    } finally {
      setSeeding(false);
    }
  }, [fetchSummary]);

  const fetchUsersForAssignment = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await safeApiFetch("/api/admin/users?limit=500", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const users = (data.users || []).map((u: any) => ({
        id: u.id,
        name: u.name || "Unnamed",
        email: u.email,
        role: u.role || "unknown",
        currentCategory: u.category || null,
      }));
      setUsersForAssignment(users);
    } catch (error) {
      console.error("[UserCategoriesPage] Failed to fetch users", error);
      toast.error("Failed to load users for assignment");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleOpenBulkDialog = useCallback(() => {
    setShowBulkDialog(true);
    setSelectedUserIds(new Set());
    setTargetCategory("");
    setAssignmentNotes("");
    setSearchQuery("");
    fetchUsersForAssignment();
  }, [fetchUsersForAssignment]);

  const handleBulkAssign = useCallback(async () => {
    if (selectedUserIds.size === 0) {
      toast.error("Please select at least one user");
      return;
    }
    if (!targetCategory) {
      toast.error("Please select a target category");
      return;
    }

    setAssigning(true);
    try {
      const response = await safeApiFetch("/api/admin/user-categories/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          category: targetCategory,
          notes: assignmentNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign categories");
      }

      toast.success(`Successfully assigned ${data.assigned || selectedUserIds.size} users to "${targetCategory}"`);
      setShowBulkDialog(false);
      await fetchSummary();
    } catch (error) {
      console.error("[UserCategoriesPage] Bulk assignment failed", error);
      toast.error("Failed to assign categories. Please try again.");
    } finally {
      setAssigning(false);
    }
  }, [selectedUserIds, targetCategory, assignmentNotes, fetchSummary]);

  const toggleUserSelection = useCallback((userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const filteredUsers = usersForAssignment.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  }, [usersForAssignment, searchQuery, selectedUserIds]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return usersForAssignment;
    return usersForAssignment.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersForAssignment, searchQuery]);

  useEffect(() => {
    if (!loading && user?.role === "admin") {
      fetchSummary();
    }
  }, [loading, user?.role, fetchSummary]);

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return null;
  }

  const categories = useMemo(() => CATEGORY_META, []);

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6">
      <Link
        href="/admin/user-management"
        className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to User Management Tools
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">User Categories Overview</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Monitor and maintain the automatic user categorization system. Categories are derived from role assignments
          and account linkage, helping admins quickly identify coverage gaps.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <Card className="rounded-xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <Database className="h-5 w-5" /> Category Maintenance
            </CardTitle>
            <CardDescription>
              Rebuild categories when new users join or roles change. This keeps reporting accurate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSeedCategories}
              disabled={seeding}
              className="w-full sm:w-auto"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Categorizing users...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed categories now
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenBulkDialog}
              className="w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Bulk Assign Categories
            </Button>
            <Button
              variant="outline"
              onClick={fetchSummary}
              disabled={loadingSummary}
              className="w-full sm:w-auto"
            >
              {loadingSummary ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh summary
            </Button>
            <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p> Categories sync automatically each time you seed the system.</p>
              <p> Corporate clients appear under Clients (Account) once their account linkage is confirmed.</p>
              <p> Individual clients remain under Clients (Individual) until linked to an account.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <Users className="h-5 w-5" /> Category Breakdown
            </CardTitle>
            <CardDescription>
              Live counts per category. Use the quick links to drill into each user list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                Loading summary...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {categories.map((category) => {
                  const count = summary?.[category.key] ?? 0;
                  return (
                    <Card key={category.key} className="border border-border/40 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-3">
                          <span className={category.accentClass}>{category.label}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {count}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {category.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {category.route && (
                          <Link href={category.route} className="text-xs text-primary hover:underline">
                            View {category.label}
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Assignment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <UserPlus className="h-5 w-5" />
              Bulk Assign Categories
            </DialogTitle>
            <DialogDescription>
              Select multiple users and assign them to a category at once.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Category Selection and Search */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Category</label>
                <Select value={targetCategory} onValueChange={setTargetCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <Textarea
                placeholder="Add notes about this assignment..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Selection Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedUserIds.size} of {filteredUsers.length} users selected
              </span>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectedUserIds.size === filteredUsers.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Current Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 100).map((u) => (
                      <TableRow
                        key={u.id}
                        className={selectedUserIds.has(u.id) ? "bg-primary/5" : ""}
                        onClick={() => toggleUserSelection(u.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(u.id)}
                            onCheckedChange={() => toggleUserSelection(u.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.currentCategory ? (
                            <Badge variant="secondary" className="capitalize">
                              {u.currentCategory.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredUsers.length > 100 && (
                <div className="text-center py-2 text-xs text-muted-foreground border-t">
                  Showing first 100 users. Use search to narrow down.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={assigning || selectedUserIds.size === 0 || !targetCategory}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign {selectedUserIds.size} Users
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
