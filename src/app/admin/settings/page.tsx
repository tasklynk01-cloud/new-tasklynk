'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteManagerDialog } from '@/components/invite-manager-dialog';
import { InviteEditorDialog } from '@/components/invite-editor-dialog';
import { Mail, Save, User, Download, Upload, History, Clock, ArrowRight } from 'lucide-react';
import { validateKenyanPhone, validateOptionalKenyanPhone } from '@/lib/phone-validation';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemSettings {
  [key: string]: string | number | boolean;
}

interface SettingsHistoryItem {
  id: number;
  settingKey: string;
  previousValue: string | null;
  newValue: string;
  previousType: string | null;
  newType: string;
  changedBy: number | null;
  changedByName: string | null;
  changeReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [changes, setChanges] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [monthlyVolumeAddition, setMonthlyVolumeAddition] = useState<string>('');
  const [addingMonthlyVolume, setAddingMonthlyVolume] = useState(false);
  const hasCheckedAuth = useRef(false);
  
  // Invite Manager Dialog
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);
  
  // Invite Editor Dialog
  const [inviteEditorOpen, setInviteEditorOpen] = useState(false);
  
  // History state
  const [history, setHistory] = useState<SettingsHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  
  // Import state
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchSettings();
    }
  }, [loading, user, router]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const response = await safeApiFetch('/api/admin/settings', {
        credentials: 'include',
      });
      const data = await response.json();
      setSettings(data || {});
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await safeApiFetch('/api/admin/settings/history?limit=100', {
        credentials: 'include',
      });
      const data = await response.json();
      setHistory(data.history || []);
      setHistoryTotal(data.total || 0);
    } catch (error) {
      toast.error('Failed to load settings history');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!settings) return;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user?.name || 'Admin',
      settings: settings,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasklynk-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully');
  }, [settings, user]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the imported data
      if (!data.settings || typeof data.settings !== 'object') {
        toast.error('Invalid settings file format');
        return;
      }
      
      // Apply imported settings
      const response = await safeApiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data.settings),
      });
      
      if (response.ok) {
        toast.success('Settings imported successfully');
        fetchSettings();
        fetchHistory();
      } else {
        toast.error('Failed to import settings');
      }
    } catch (error) {
      toast.error('Invalid settings file');
      console.error(error);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchSettings, fetchHistory]);

  const handleChange = useCallback((key: string, value: string | number | boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value,
    }));
    setChanges((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const response = await safeApiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(changes),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setChanges({});
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }, [changes]);

  const hasChanges = Object.keys(changes).length > 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (loadingSettings) {
    return (
      <div className="w-full p-4 md:p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-4 lg:p-6">
      <InviteManagerDialog open={inviteManagerOpen} onOpenChange={setInviteManagerOpen} />
      <div className="mb-6 border-b pb-4">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure platform settings, pricing, and features
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <Button 
              onClick={() => setInviteManagerOpen(true)} 
              variant="default" 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              <Mail className="w-5 h-5 mr-2" />
              Invite Manager
            </Button>
            <Button 
              onClick={() => setInviteEditorOpen(true)} 
              variant="outline" 
              size="lg"
              className="border-primary text-primary hover:bg-primary/10 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              <Mail className="w-5 h-5 mr-2" />
              Invite Editor
            </Button>
          </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Writer Hiring (Recruiting)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Show writer application option on registration page
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.writer_hiring_enabled as boolean}
                    onChange={(e) =>
                      handleChange('writer_hiring_enabled', e.target.checked)
                    }
                    className="w-5 h-5 rounded"
                  />
                </div>
              </div>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="rounded-xl flex-wrap">
          <TabsTrigger value="profile" className="rounded-xl">Profile</TabsTrigger>
          <TabsTrigger value="general" className="rounded-xl">General</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl">Pricing</TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl">Features</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-xl">Payment</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl" onClick={fetchHistory}>
            <History className="w-4 h-4 mr-1" />
            History
          </TabsTrigger>
          <TabsTrigger value="backup" className="rounded-xl">
            <Download className="w-4 h-4 mr-1" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <AdminProfileSettings user={user} />
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name || 'TaskLynk'}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                    placeholder="TaskLynk"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="platform_email">Support Email</Label>
                  <Input
                    id="platform_email"
                    type="email"
                    value={settings.platform_email || ''}
                    onChange={(e) => handleChange('platform_email', e.target.value)}
                    placeholder="support@tasklynk.com"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description || ''}
                  onChange={(e) => handleChange('platform_description', e.target.value)}
                  placeholder="Brief description of the platform"
                  rows={4}
                  className="rounded-xl"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="min_order_amount">Minimum Order Amount (KES)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={settings.min_order_amount || 1000}
                    onChange={(e) =>
                      handleChange('min_order_amount', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="max_order_amount">Maximum Order Amount (KES)</Label>
                  <Input
                    id="max_order_amount"
                    type="number"
                    value={settings.max_order_amount || 1000000}
                    onChange={(e) =>
                      handleChange('max_order_amount', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="order_timeout_days">Order Timeout (days)</Label>
                  <Input
                    id="order_timeout_days"
                    type="number"
                    value={settings.order_timeout_days || 30}
                    onChange={(e) =>
                      handleChange('order_timeout_days', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing" className="space-y-6">
          <Card className="p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Pricing & Fees</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_fee_percent">Platform Fee (%)</Label>
                  <Input
                    id="platform_fee_percent"
                    type="number"
                    step="0.1"
                    value={settings.platform_fee_percent || 10}
                    onChange={(e) =>
                      handleChange('platform_fee_percent', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentage charged on each completed order
                  </p>
                </div>
                <div>
                  <Label htmlFor="transaction_fee_percent">Transaction Fee (%)</Label>
                  <Input
                    id="transaction_fee_percent"
                    type="number"
                    step="0.1"
                    value={settings.transaction_fee_percent || 2}
                    onChange={(e) =>
                      handleChange('transaction_fee_percent', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Fee charged for payment processing
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="minimum_payout">Minimum Payout (KES)</Label>
                  <Input
                    id="minimum_payout"
                    type="number"
                    value={settings.minimum_payout || 500}
                    onChange={(e) =>
                      handleChange('minimum_payout', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum balance before freelancer can request payout
                  </p>
                </div>
                <div>
                  <Label htmlFor="maximum_payout">Maximum Payout (KES)</Label>
                  <Input
                    id="maximum_payout"
                    type="number"
                    value={settings.maximum_payout || 500000}
                    onChange={(e) =>
                      handleChange('maximum_payout', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Off-Platform &amp; Monthly Order Volume</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Public Order Volume on the homepage automatically combines live platform orders from the database with this off-platform baseline (default KSh 900,000).
            </p>
            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div>
                <Label htmlFor="off_platform_order_volume">Off-Platform Baseline (KSh)</Label>
                <Input
                  id="off_platform_order_volume"
                  type="number"
                  min={0}
                  value={settings.off_platform_order_volume ?? 900000}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleChange('off_platform_order_volume', Number.isFinite(val) && val >= 0 ? val : 0);
                  }}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Added directly on top of live database order volume
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthly_volume_addition">Add Monthly Off-Platform Orders (+ KSh)</Label>
                <div className="flex gap-2">
                  <Input
                    id="monthly_volume_addition"
                    type="number"
                    min={1}
                    placeholder="e.g. 85000"
                    value={monthlyVolumeAddition}
                    onChange={(e) => setMonthlyVolumeAddition(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    disabled={addingMonthlyVolume || !monthlyVolumeAddition || Number(monthlyVolumeAddition) <= 0}
                    onClick={async () => {
                      const addVal = Number(monthlyVolumeAddition);
                      if (!Number.isFinite(addVal) || addVal <= 0) return;
                      const currentBase = Number(settings.off_platform_order_volume ?? 900000);
                      const nextTotal = Math.round(currentBase + addVal);
                      try {
                        setAddingMonthlyVolume(true);
                        const response = await safeApiFetch('/api/admin/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ off_platform_order_volume: nextTotal }),
                        });
                        if (response.ok) {
                          setSettings((prev: any) => ({ ...prev, off_platform_order_volume: nextTotal }));
                          setMonthlyVolumeAddition('');
                          toast.success(`Added KSh ${addVal.toLocaleString('en-KE')} — Off-platform baseline is now KSh ${nextTotal.toLocaleString('en-KE')}`);
                        } else {
                          toast.error('Failed to add monthly off-platform volume');
                        }
                      } catch {
                        toast.error('Error updating off-platform order volume');
                      } finally {
                        setAddingMonthlyVolume(false);
                      }
                    }}
                    className="rounded-xl shrink-0"
                  >
                    {addingMonthlyVolume ? 'Adding...' : 'Add & Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quickly add new monthly off-platform orders onto the existing KSh {Number(settings.off_platform_order_volume ?? 900000).toLocaleString('en-KE')}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-6">
          <Card className="p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Feature Toggles</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable User Registration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow new users to create accounts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.registration_enabled as boolean}
                  onChange={(e) =>
                    handleChange('registration_enabled', e.target.checked)
                  }
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Revisions</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow clients to request order revisions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.revisions_enabled as boolean}
                  onChange={(e) => handleChange('revisions_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Messaging</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow users to communicate through the platform
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.messaging_enabled as boolean}
                  onChange={(e) => handleChange('messaging_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Ratings</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow clients to rate completed orders
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ratings_enabled as boolean}
                  onChange={(e) => handleChange('ratings_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Require users to verify email before account activation
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_email_verification as boolean}
                  onChange={(e) =>
                    handleChange('require_email_verification', e.target.checked)
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Payment Settings</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="default_payment_method">Default Payment Method</Label>
                <Select
                  value={settings.default_payment_method as string}
                  onValueChange={(value) =>
                    handleChange('default_payment_method', value)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="wallet">Platform Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="mpesa_enabled">Enable M-Pesa</Label>
                  <input
                    id="mpesa_enabled"
                    type="checkbox"
                    checked={settings.mpesa_enabled as boolean}
                    onChange={(e) => handleChange('mpesa_enabled', e.target.checked)}
                    className="w-5 h-5 mt-2 rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="paystack_enabled">Enable Paystack</Label>
                  <input
                    id="paystack_enabled"
                    type="checkbox"
                    checked={settings.paystack_enabled as boolean}
                    onChange={(e) =>
                      handleChange('paystack_enabled', e.target.checked)
                    }
                    className="w-5 h-5 mt-2 rounded"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="payout_processing_days">Payout Processing Time (days)</Label>
                  <Input
                    id="payout_processing_days"
                    type="number"
                    value={settings.payout_processing_days || 1}
                    onChange={(e) =>
                      handleChange('payout_processing_days', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_hold_period">Payment Hold Period (days)</Label>
                  <Input
                    id="payment_hold_period"
                    type="number"
                    value={settings.payment_hold_period || 7}
                    onChange={(e) =>
                      handleChange('payment_hold_period', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Settings Change History</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Audit trail of all configuration changes ({historyTotal} total changes)
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="rounded-xl"
              >
                {loadingHistory ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No settings changes recorded yet</p>
                <p className="text-sm mt-2">Changes will appear here after you modify settings</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="border rounded-xl p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.settingKey}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.newType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground line-through">
                              {item.previousValue || '(not set)'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-green-600">
                              {item.newValue}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            by {item.changedByName || 'System'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        {/* Backup Tab - Export/Import */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Export Card */}
            <Card className="p-6 rounded-xl">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-500" />
                  Export Settings
                </CardTitle>
                <CardDescription>
                  Download all current settings as a JSON file for backup
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      This will export all {settings ? Object.keys(settings).length : 0} settings including:
                    </p>
                    <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                      <li> General platform settings</li>
                      <li> Pricing configuration</li>
                      <li> Feature toggles</li>
                      <li> Payment settings</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={handleExport} 
                    className="w-full rounded-xl"
                    disabled={!settings}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Card */}
            <Card className="p-6 rounded-xl">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-green-500" />
                  Import Settings
                </CardTitle>
                <CardDescription>
                  Restore settings from a previously exported JSON file
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 font-medium">?? Warning</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Importing will overwrite all current settings. Make sure to export a backup first.
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                    className="w-full rounded-xl"
                    disabled={importing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? 'Importing...' : 'Select File to Import'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Settings Overview */}
          <Card className="p-6 rounded-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Current Settings Overview</CardTitle>
              <CardDescription>
                All {settings ? Object.keys(settings).length : 0} settings currently configured
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settings && Object.entries(settings).map(([key, value]) => (
                    <div key={key} className="p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground font-mono">{key}</div>
                      <div className="font-medium text-sm mt-1 truncate">
                        {typeof value === 'boolean' ? (
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Enabled' : 'Disabled'}
                          </Badge>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => {
            setChanges({});
            fetchSettings();
          }}
          disabled={!hasChanges || saving}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Invite Manager Dialog */}
      <InviteManagerDialog
        open={inviteManagerOpen}
        onOpenChange={setInviteManagerOpen}
        onInviteSuccess={() => {
          toast.success('Manager invitation sent successfully!');
        }}
      />

      {/* Invite Editor Dialog */}
      <InviteEditorDialog
        open={inviteEditorOpen}
        onOpenChange={setInviteEditorOpen}
        onInviteSuccess={() => {
          toast.success('Editor invitation sent successfully!');
        }}
      />
    </div>
  );
}

// Admin Profile Settings Component
function AdminProfileSettings({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    const validation = validateOptionalKenyanPhone(value);
    if (!validation.valid) {
      setPhoneError(validation.error || 'Invalid phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleSave = async () => {
    if (phoneError) {
      toast.error('Please fix phone number errors');
      return;
    }

    const validation = validateOptionalKenyanPhone(formData.phone);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid phone number');
      return;
    }

    try {
      setSaving(true);
      const response = await safeApiFetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: validation.normalized,
          // Email is NOT included - cannot be changed
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <User className="w-5 h-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="admin_name">Full Name</Label>
            <Input
              id="admin_name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="admin_email">Email Address</Label>
            <Input
              id="admin_email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted rounded-xl"
              placeholder="Email cannot be changed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="admin_phone">Phone Number</Label>
            <Input
              id="admin_phone"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="0712345678 or +254712345678"
              className={`rounded-xl ${phoneError ? 'border-red-500' : ''}`}
            />
            {phoneError && (
              <p className="text-xs text-red-500 mt-1">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Kenyan format: 07XXXXXXXX or +2547XXXXXXXX (any Kenyan mobile number)
            </p>
          </div>

          <div>
            <Label>Display ID</Label>
            <Input
              value={user?.displayId || 'Not assigned'}
              disabled
              className="bg-muted rounded-xl"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !!phoneError}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
