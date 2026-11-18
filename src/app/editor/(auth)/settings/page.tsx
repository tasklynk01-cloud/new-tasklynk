"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Bell, 
  Mail, 
  Shield,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context-v2";
import { validateOptionalKenyanPhone } from '@/lib/phone-validation';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { ProfilePictureCard } from '@/components/profile-picture-card';

export default function EditorSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newAssignmentAlerts, setNewAssignmentAlerts] = useState(true);
  const [revisionAlerts, setRevisionAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setPhoneError('');
  }, [user]);

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await safeApiFetch('/api/v2/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) {
      return;
    }

    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    const phoneValidation = validateOptionalKenyanPhone(formData.phone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error || 'Invalid phone number');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, string> = {
        name: formData.name,
      };

      if (phoneValidation.normalized) {
        payload.phone = phoneValidation.normalized;
      }

      const response = await safeApiFetch(`/api/v2/users/${user.id}/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to update profile'));
        return;
      }

      toast.success('Profile updated successfully');
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and notification preferences
        </p>
      </div>

      {user && <ProfilePictureCard userId={user.id} initialProfilePicture={user.profilePicture || null} />}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, phone: value }));
                  const validation = validateOptionalKenyanPhone(value);
                  setPhoneError(validation.valid ? '' : validation.error || 'Invalid phone number');
                }}
                placeholder="0712345678 or +254712345678"
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              <p className="text-xs text-muted-foreground">Kenyan format: 07XXXXXXXX or +2547XXXXXXXX</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value="Editor" disabled />
            </div>
            <div className="space-y-2">
              <Label>Display ID</Label>
              <Input value={user?.displayId || 'N/A'} disabled />
            </div>
          </div>
          <Button onClick={handleProfileUpdate} disabled={saving || !!phoneError || !user}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch 
              checked={emailNotifications} 
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Assignment Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're assigned a new order
              </p>
            </div>
            <Switch 
              checked={newAssignmentAlerts} 
              onCheckedChange={setNewAssignmentAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Revision Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about revision requests
              </p>
            </div>
            <Switch 
              checked={revisionAlerts} 
              onCheckedChange={setRevisionAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of your assignments
              </p>
            </div>
            <Switch 
              checked={dailyDigest} 
              onCheckedChange={setDailyDigest}
            />
          </div>

          <Button onClick={handleSaveNotifications} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Mail className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
