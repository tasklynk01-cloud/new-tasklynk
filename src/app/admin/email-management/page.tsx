'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  Users,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  UserCheck,
  AtSign,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  variables: string[];
}

interface DirectoryUser {
  id: number;
  displayId?: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  status: string;
}

type RecipientMode = 'group' | 'users' | 'manual';

const MASS_GROUPS: Array<{ id: string; label: string; roleFilter: string | null }> = [
  { id: 'all_users', label: 'All Users', roleFilter: null },
  { id: 'clients', label: 'All Clients', roleFilter: 'client' },
  { id: 'freelancers', label: 'All Freelancers', roleFilter: 'freelancer' },
  { id: 'managers', label: 'All Managers', roleFilter: 'manager' },
  { id: 'admins', label: 'All Admins', roleFilter: 'admin' },
  { id: 'editors', label: 'All Editors', roleFilter: 'editor' },
  { id: 'account_owners', label: 'All Account Owners', roleFilter: 'account_owner' },
];

const ROLE_LABELS: Record<string, string> = {
  all: 'All Roles',
  client: 'Clients',
  freelancer: 'Freelancers',
  manager: 'Managers',
  admin: 'Admins',
  editor: 'Editors',
  account_owner: 'Account Owners',
};

export default function AdminEmailManagementPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [usersList, setUsersList] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Recipient selection state
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('group');
  const [selectedGroup, setSelectedGroup] = useState<string>('all_users');
  const [approvedOnly, setApprovedOnly] = useState<boolean>(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [manualRecipients, setManualRecipients] = useState<string>('');

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customHtml, setCustomHtml] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [failedDetails, setFailedDetails] = useState<Array<{ email: string; error: string }>>([]);

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await safeApiFetch('/api/v2/admin/emails', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await safeApiFetch('/api/users?limit=1000', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users directory');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'none') {
      setVariables({});
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      const vars: Record<string, string> = {};
      template.variables.forEach(v => {
        vars[v] = '';
      });
      setVariables(vars);
    }
  };

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of MASS_GROUPS) {
      counts[group.id] = usersList.filter(u => {
        if (approvedOnly && !u.approved) return false;
        if (group.roleFilter && u.role !== group.roleFilter) return false;
        return Boolean(u.email);
      }).length;
    }
    return counts;
  }, [usersList, approvedOnly]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return usersList.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.displayId?.toLowerCase().includes(q)
      );
    });
  }, [usersList, roleFilter, userSearch]);

  const parsedManualEmails = useMemo(() => {
    return Array.from(
      new Set(
        manualRecipients
          .split(/[,\n]/)
          .map(e => e.trim())
          .filter(e => e.length > 0)
      )
    );
  }, [manualRecipients]);

  const targetCount = useMemo(() => {
    if (recipientMode === 'group') return groupCounts[selectedGroup] ?? 0;
    if (recipientMode === 'users') return selectedEmails.length;
    return parsedManualEmails.length;
  }, [recipientMode, groupCounts, selectedGroup, selectedEmails.length, parsedManualEmails.length]);

  const toggleUserEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    setSelectedEmails(prev =>
      prev.includes(normalized)
        ? prev.filter(e => e !== normalized)
        : [...prev, normalized]
    );
  };

  const selectAllFiltered = () => {
    const filteredEmails = filteredUsers
      .map(u => u.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e));
    setSelectedEmails(prev => Array.from(new Set([...prev, ...filteredEmails])));
  };

  const clearSelectedUsers = () => {
    setSelectedEmails([]);
  };

  const handleSendEmail = async () => {
    if (recipientMode === 'group' && (groupCounts[selectedGroup] ?? 0) === 0) {
      toast.error('No users found in the selected group');
      return;
    }

    if (recipientMode === 'users' && selectedEmails.length === 0) {
      toast.error('Please select at least one user from the list');
      return;
    }

    if (recipientMode === 'manual' && parsedManualEmails.length === 0) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    const usingTemplate = selectedTemplate && selectedTemplate !== 'none';

    if (!usingTemplate && (!customSubject.trim() || !customHtml.trim())) {
      toast.error('Please select a template or provide custom subject and HTML');
      return;
    }

    setSending(true);
    setFailedDetails([]);

    try {
      const payload: Record<string, unknown> = {};

      if (recipientMode === 'group') {
        payload.recipientGroup = selectedGroup;
        payload.includeUnapproved = !approvedOnly;
      } else if (recipientMode === 'users') {
        payload.to = selectedEmails;
      } else {
        payload.to = parsedManualEmails;
      }

      if (usingTemplate) {
        payload.templateId = selectedTemplate;
        payload.variables = variables;
        if (customSubject.trim()) {
          payload.customSubject = customSubject.trim();
        }
      } else {
        payload.customSubject = customSubject.trim();
        payload.customHtml = customHtml;
      }

      const response = await safeApiFetch('/api/v2/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      if (data.failed > 0) {
        const failedList = Array.isArray(data.failedEmails) ? data.failedEmails : [];
        setFailedDetails(failedList);
        const sampleReason = failedList[0]?.error ? ` (${failedList[0].error})` : '';
        toast.warning(
          `Sent ${data.sent}/${data.total} emails. ${data.failed} failed${sampleReason}`,
          { duration: 8000 }
        );
        console.error('Failed emails:', failedList);
      } else {
        setFailedDetails([]);
        toast.success(`Successfully sent ${data.sent} email(s)!`);
      }

      if (data.sent > 0 && data.failed === 0) {
        setManualRecipients('');
        setSelectedEmails([]);
        setSelectedTemplate('none');
        setCustomSubject('');
        setCustomHtml('');
        setVariables({});
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Management</h1>
          <p className="text-gray-600">
            Send mass announcements, role-based campaigns, or targeted emails to selected users
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/emails"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Logs &amp; History
          </Link>
          <Link
            href="/admin/email-preview"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF7A3D] hover:bg-[#E5682C] text-white rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            <Eye className="w-4 h-4" />
            Live Email Previewer
          </Link>
          <a
            href="/api/preview-email?template=registration_approved"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#241B3F] hover:bg-[#35255C] text-white rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            Open Standalone Tab ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                Compose Email
              </CardTitle>
              <CardDescription>
                Choose a mass user group, pick users from the directory, or enter manual emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Recipient Mode Selector */}
              <div className="space-y-3">
                <Label>
                  Recipients <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={recipientMode === 'group' ? 'default' : 'outline'}
                    onClick={() => setRecipientMode('group')}
                    className="justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Mass Group
                  </Button>
                  <Button
                    type="button"
                    variant={recipientMode === 'users' ? 'default' : 'outline'}
                    onClick={() => setRecipientMode('users')}
                    className="justify-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Select Users
                    {selectedEmails.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                        {selectedEmails.length}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant={recipientMode === 'manual' ? 'default' : 'outline'}
                    onClick={() => setRecipientMode('manual')}
                    className="justify-center gap-2"
                  >
                    <AtSign className="h-4 w-4" />
                    Manual Emails
                  </Button>
                </div>

                {/* Mode 1: Mass Group */}
                {recipientMode === 'group' && (
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MASS_GROUPS.map(group => {
                        const active = selectedGroup === group.id;
                        const count = groupCounts[group.id] ?? 0;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setSelectedGroup(group.id)}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                              active
                                ? 'border-primary bg-primary/10 font-semibold text-primary shadow-sm'
                                : 'border-border bg-background hover:border-primary/40'
                            }`}
                          >
                            <span className="truncate">{group.label}</span>
                            <Badge variant={active ? 'default' : 'secondary'} className="ml-2 text-xs">
                              {usersLoading ? '...' : count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox
                          checked={approvedOnly}
                          onCheckedChange={checked => setApprovedOnly(Boolean(checked))}
                        />
                        <span>Approved / Active users only (recommended)</span>
                      </label>
                      <span className="text-xs font-medium text-primary">
                        {usersLoading
                          ? 'Counting recipients...'
                          : `${groupCounts[selectedGroup] ?? 0} recipient(s) will receive this email`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mode 2: Select from Users List */}
                {recipientMode === 'users' && (
                  <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, or ID..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="pl-8 bg-background"
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-44 bg-background">
                          <SelectValue placeholder="Filter role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">
                        Showing {filteredUsers.length} of {usersList.length} users ·{' '}
                        <strong className="text-foreground">{selectedEmails.length} selected</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllFiltered}
                          disabled={filteredUsers.length === 0}
                          className="h-7 text-xs"
                        >
                          Select All Filtered ({filteredUsers.length})
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSelectedUsers}
                          disabled={selectedEmails.length === 0}
                          className="h-7 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-md border bg-background divide-y">
                      {usersLoading ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                          Loading users...
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No users match your search/filter.
                        </div>
                      ) : (
                        filteredUsers.map(u => {
                          const normalizedEmail = (u.email || '').trim().toLowerCase();
                          const isChecked = selectedEmails.includes(normalizedEmail);
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40 ${
                                isChecked ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleUserEmail(u.email)}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {u.name}{' '}
                                    {u.displayId && (
                                      <span className="text-xs text-muted-foreground font-normal">
                                        ({u.displayId})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {u.role.replace('_', ' ')}
                                </Badge>
                                <Badge
                                  variant={u.approved ? 'secondary' : 'outline'}
                                  className="text-[10px]"
                                >
                                  {u.approved ? 'Approved' : u.status || 'Pending'}
                                </Badge>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Mode 3: Manual Emails */}
                {recipientMode === 'manual' && (
                  <div className="space-y-1.5">
                    <Textarea
                      id="recipients"
                      placeholder="Enter email addresses (comma or newline separated)&#10;Example:&#10;user1@example.com, user2@example.com&#10;user3@example.com"
                      value={manualRecipients}
                      onChange={e => setManualRecipients(e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Separate multiple emails with commas or new lines ({parsedManualEmails.length} email
                      {parsedManualEmails.length === 1 ? '' : 's'} detected)
                    </p>
                  </div>
                )}
              </div>

              {/* Template Selection */}
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Custom Email (No Template)</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-3">
                          <span>{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Variables */}
              {selectedTemplateData && selectedTemplateData.variables.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Template Variables</Label>
                    {recipientMode === 'group' && (
                      <span className="text-xs text-muted-foreground">
                        Leave <code>userName</code> blank to auto-fill each user&apos;s name
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplateData.variables.map(variable => (
                      <div key={variable} className="space-y-1">
                        <Label htmlFor={variable} className="text-sm">
                          {variable.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Input
                          id={variable}
                          placeholder={`Enter ${variable}`}
                          value={variables[variable] || ''}
                          onChange={e =>
                            setVariables({ ...variables, [variable]: e.target.value })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Subject */}
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="subject">
                  Subject {selectedTemplate === 'none' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="subject"
                  placeholder="Email subject line"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                />
                {selectedTemplate !== 'none' && (
                  <p className="text-xs text-gray-500">
                    Leave empty to use template default
                  </p>
                )}
              </div>

              {/* Custom HTML (only if no template selected) */}
              {selectedTemplate === 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="html">
                    Email HTML / Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="html"
                    placeholder="Enter HTML or message content for the email..."
                    value={customHtml}
                    onChange={e => setCustomHtml(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Full HTML content including styling
                  </p>
                </div>
              )}

              {failedDetails.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>{failedDetails.length} email(s) failed to send</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-300 bg-white hover:bg-red-100 text-red-800"
                      onClick={() => {
                        const retryable = failedDetails
                          .filter(f => !String(f.error || '').includes('Skipped reserved/test domain'))
                          .map(f => f.email);
                        const listToLoad = retryable.length > 0 ? retryable : failedDetails.map(f => f.email);
                        setRecipientMode('manual');
                        setManualRecipients(listToLoad.join(', '));
                        toast.info(`Loaded ${listToLoad.length} failed email(s) into Manual Emails`);
                      }}
                    >
                      Load Failed Emails to Retry ({failedDetails.length})
                    </Button>
                  </div>
                  <p className="text-xs text-red-700">
                    Reason: {failedDetails[0]?.error || 'Unknown error'}
                  </p>
                  <div className="text-xs text-red-700/90 max-h-24 overflow-y-auto font-mono">
                    {failedDetails.slice(0, 10).map((f, i) => (
                      <div key={i}>
                        {f.email}: {f.error}
                      </div>
                    ))}
                    {failedDetails.length > 10 && (
                      <div>...and {failedDetails.length - 10} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Ready to send to <strong>{targetCount}</strong> recipient{targetCount === 1 ? '' : 's'}
                </span>
                <Button
                  onClick={handleSendEmail}
                  disabled={sending || targetCount === 0}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email{targetCount > 0 ? ` (${targetCount})` : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Templates Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <FileText className="h-5 w-5" />
                Available Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
                    {template.variables.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Variables: {template.variables.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Use Mass Group to email all users, clients, freelancers, managers, admins, editors, or account owners</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Use Select Users to search, filter by role, and pick specific accounts</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Variables personalize templates automatically per recipient</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p>Double-check recipient count and subject before sending</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
