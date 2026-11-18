"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Save, Mail, Phone, Calendar, CheckCircle, Camera, Upload, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { validateOptionalKenyanPhone } from '@/lib/phone-validation';
import { dispatchProfilePictureUpdated } from '@/lib/profile-events';

type UserSummary = {
  user: {
    id: number;
    displayId?: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    approved: boolean;
    status: string;
    balance: number;
    rating: number | null;
    totalSpent: number;
    completedJobs: number;
    createdAt: string;
  };
  stats: {
    totalJobsPosted?: number;
    totalJobsCompleted?: number;
    totalAmountSpent?: number;
  } | null;
};

export default function ClientSettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
        setPhoneError('');
        fetchSummary();
        fetchProfilePicture();
      }
    }
  }, [user, loading, router]);

  const authHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSummary = async () => {
    if (!user) return;
    try {
      const response = await safeApiFetch(`/api/users/${user.id}/summary`, {
        headers: authHeader() as HeadersInit,
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchProfilePicture = async () => {
    if (!user) return;
    try {
      const response = await safeApiFetch(`/api/v2/users/${user.id}/profile`, {
        headers: authHeader() as HeadersInit,
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const url = data.profilePictureUrl as string | undefined;
        if (url && (url.startsWith('http') || url.startsWith('data:'))) {
          setProfilePicture(url);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        console.log('[Profile Upload] Starting upload, size:', base64String.length);
        
        const response = await safeApiFetch(`/api/v2/users/${user.id}/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ profilePictureUrl: base64String }),
        });

        console.log('[Profile Upload] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Profile Upload] Success:', data);
          setProfilePicture(base64String);
          toast.success('Profile picture updated successfully');

          // Update global session/user state so nav/header reflects change immediately.
          await refreshUser();
          if (user) {
            dispatchProfilePictureUpdated({ userId: user.id, profilePictureUrl: base64String });
          }
        } else {
          const error = await response.json();
          console.error('[Profile Upload] Error:', error);
          toast.error(extractErrorMessage(error, 'Failed to upload profile picture'));
        }
      } catch (error) {
        console.error('[Profile Upload] Exception:', error);
        toast.error('Failed to upload profile picture');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error('Failed to read profile picture');
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        setEditMode(false);
        fetchSummary();
        await refreshUser();
      } else {
        const errorData = await response.json();
        toast.error(extractErrorMessage(errorData, 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await safeApiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to change password'));
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings & Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      {loadingSummary ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture (Max 5MB, JPG/PNG)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px] aspect-square rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-[#DDD3E9] dark:border-[#3A2F5B]">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full max-w-full max-h-full object-cover rounded-full block pointer-events-none"
                        style={{
                          width: '100%',
                          height: '100%',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover',
                          aspectRatio: '1 / 1',
                        }}
                      />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-[#FF7A3D] text-white rounded-full p-2 border-2 border-white dark:border-[#140E24] shadow-md hover:bg-[#E9662F] transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload New Picture'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal details and account status</CardDescription>
              </div>
              {!editMode && (
                <Button onClick={() => setEditMode(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email} 
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, phone: value });
                          const validation = validateOptionalKenyanPhone(value);
                          setPhoneError(validation.valid ? '' : validation.error || 'Invalid phone number');
                        }} 
                        placeholder="0712345678 or +254712345678"
                        className={phoneError ? 'border-destructive' : ''}
                      />
                      {phoneError && (
                        <p className="text-xs text-destructive mt-1">{phoneError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Kenyan format: 07XXXXXXXX or +2547XXXXXXXX (any Kenyan mobile number)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleProfileUpdate} disabled={saving || !!phoneError} className="bg-[#ff8c42] hover:bg-[#ff8c42]/90">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={() => {
                      setEditMode(false);
                      setFormData(prev => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                      }));
                      setPhoneError('');
                    }} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : summary && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">{summary.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email Address</p>
                      <p className="text-sm text-muted-foreground">{summary.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone Number</p>
                      <p className="text-sm text-muted-foreground">{summary.user.phone || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">User ID</p>
                      <Badge variant="outline" className="font-mono mt-1">
                        {summary.user.displayId || user?.displayId || 'Not assigned'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <Badge variant="outline" className="capitalize mt-1">{summary.user.role}</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <Badge 
                        variant={
                          (summary.user.role === 'client' || summary.user.role === 'account_owner') ? 'default' :
                          summary.user.approved && summary.user.status === 'active' ? 'default' : 
                          summary.user.status === 'suspended' ? 'destructive' :
                          summary.user.status === 'rejected' || summary.user.status === 'blacklisted' ? 'destructive' :
                          'secondary'
                        } 
                        className="capitalize mt-1"
                      >
                        {(summary.user.role === 'client' || summary.user.role === 'account_owner') ? 'Active' :
                         summary.user.approved && summary.user.status === 'active' ? 'Active' : 
                         summary.user.status === 'suspended' ? 'Suspended' :
                         summary.user.status === 'rejected' ? 'Rejected' :
                         summary.user.status === 'blacklisted' ? 'Blacklisted' :
                         'Pending Approval'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {mounted ? new Date(summary.user.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {summary && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    KSh {(summary.stats?.totalAmountSpent ?? summary.user.totalSpent ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Jobs Posted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.stats?.totalJobsPosted ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={saving} className="bg-[#ff8c42] hover:bg-[#ff8c42]/90">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
