"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Save, DollarSign, BookOpen, Edit, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import CPPApprovalNotification from '@/components/CPPApprovalNotification';
import { getAllCPPLevels } from '@/lib/cpp-calculation';
import { SubjectSelectionDialogEnhanced } from '@/components/subject-selection-dialog-enhanced';
import { validateOptionalKenyanPhone } from '@/lib/phone-validation';
import { ProfilePictureCard } from '@/components/profile-picture-card';
import { SpecialistProfileWizard } from '@/components/specialist-profile-wizard';

export default function FreelancerSettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const [specializationDialogOpen, setSpecializationDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [phoneError, setPhoneError] = useState('');

  // Specialization state
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedSoftwareIds, setSelectedSoftwareIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [softwareNames, setSoftwareNames] = useState<string[]>([]);
  const [serviceNames, setServiceNames] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
        setPhoneError('');
        fetchSpecializations();
      }
    }
  }, [user, loading, router]);

  const fetchSpecializations = async () => {
    if (!user) return;
    
    try {
      setLoadingSpecializations(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      // Fetch specialization IDs
      const response = await safeApiFetch(`/api/freelancer/specializations?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      let specializationData: any = { subjectIds: [], softwareIds: [], serviceIds: [] };
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          specializationData = data.data;
          setSelectedSubjectIds(data.data.subjectIds || []);
          setSelectedSoftwareIds(data.data.softwareIds || []);
          setSelectedServiceIds(data.data.serviceIds || []);
        }
      }

      // Fetch all options to get names
      const optionsResponse = await safeApiFetch('/api/freelancer/skills/options');
      if (optionsResponse.ok) {
        const optionsData = await optionsResponse.json();
        if (optionsData.success) {
          const subjects = optionsData.data.subjects || [];
          const software = optionsData.data.software || [];
          const services = optionsData.data.services || [];
          
          // Get names for selected IDs
          const selectedSubjects = subjects.filter((s: any) => 
            (specializationData.subjectIds || []).includes(s.id)
          ).map((s: any) => s.name);
          
          const selectedSoftware = software.filter((s: any) => 
            (specializationData.softwareIds || []).includes(s.id)
          ).map((s: any) => s.name);
          
          const selectedServices = services.filter((s: any) => 
            (specializationData.serviceIds || []).includes(s.id)
          ).map((s: any) => s.name);
          
          setSubjectNames(selectedSubjects);
          setSoftwareNames(selectedSoftware);
          setServiceNames(selectedServices);
        }
      }
    } catch (error) {
      console.error('Failed to fetch specializations:', error);
    } finally {
      setLoadingSpecializations(false);
    }
  };

  const handleSaveSpecializations = async (data: {
    subjectIds: number[];
    subjectNames: string[];
    softwareIds?: number[];
    softwareNames?: string[];
    serviceIds?: number[];
    serviceNames?: string[];
    skills?: string[];
  }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await safeApiFetch('/api/freelancer/specializations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id,
          subjectIds: data.subjectIds,
          softwareIds: data.softwareIds || [],
          serviceIds: data.serviceIds || [],
          skills: data.skills || [],
        }),
      });

      if (response.ok) {
        setSelectedSubjectIds(data.subjectIds);
        setSelectedSoftwareIds(data.softwareIds || []);
        setSelectedServiceIds(data.serviceIds || []);
        setSelectedSkills(data.skills || []);
        setSubjectNames(data.subjectNames);
        setSoftwareNames(data.softwareNames || []);
        setServiceNames(data.serviceNames || []);
toast.success('Specializations updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(extractErrorMessage(errorData, 'Failed to update specializations'));
      }
    } catch (error) {
      console.error('Failed to save specializations:', error);
      toast.error('Failed to update specializations');
    }
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const payload: Record<string, string> = {
        name: formData.name,
      };

      if (phoneValidation.normalized) {
        payload.phone = phoneValidation.normalized;
      }
      
      const response = await safeApiFetch(`/api/v2/users/${user.id}/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const numericRating = Number(user.rating);
  const ratingDisplay =
    user.rating !== null && user.rating !== undefined && Number.isFinite(numericRating) && numericRating > 0
      ? `${numericRating.toFixed(1)} / 5.0`
      : 'No ratings yet';

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences, public directory profile, and specializations
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="account" className="gap-1.5 text-xs sm:text-sm">
            <User className="w-3.5 h-3.5" />
            Account &amp; Security
          </TabsTrigger>
          <TabsTrigger value="directory" className="gap-1.5 text-xs sm:text-sm">
            <Briefcase className="w-3.5 h-3.5" />
            Directory Profile
          </TabsTrigger>
          <TabsTrigger value="specializations" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="w-3.5 h-3.5" />
            Specializations &amp; Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-4 space-y-5">
              <ProfilePictureCard userId={user.id} initialProfilePicture={user.profilePicture || null} />

              <Card className="shadow-sm border rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className="rounded-xl h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="rounded-xl h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="rounded-xl h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={saving || !formData.currentPassword || !formData.newPassword}
                    size="sm"
                    className="w-full rounded-xl"
                  >
                    <Lock className="w-3.5 h-3.5 mr-2" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <Card className="shadow-sm border rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your personal details and view your account summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                        className="rounded-xl h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted rounded-xl h-9 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">Email address cannot be changed</p>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, phone: value }));
                          const validation = validateOptionalKenyanPhone(value);
                          setPhoneError(validation.valid ? '' : validation.error || 'Invalid phone number');
                        }}
                        placeholder="0712345678 or +254712345678"
                        className={`rounded-xl h-9 text-sm ${phoneError ? 'border-red-500' : ''}`}
                      />
                      {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                      <p className="text-[11px] text-muted-foreground">Kenyan format: 07XXXXXXXX or +2547XXXXXXXX</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Display ID</Label>
                      <Input value={user.displayId || 'Not assigned'} disabled className="bg-muted rounded-xl h-9 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Role</Label>
                      <Input value={user.role} disabled className="bg-muted capitalize rounded-xl h-9 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Balance</Label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={`KSh ${(Number(user.balance) || 0).toFixed(2)}`}
                          disabled
                          className="bg-muted font-semibold text-emerald-600 rounded-xl h-9 text-sm pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Rating</Label>
                      <Input value={ratingDisplay} disabled className="bg-muted rounded-xl h-9 text-sm" />
                    </div>
                  </div>

                  <Button
                    onClick={handleProfileUpdate}
                    disabled={saving || !!phoneError}
                    size="sm"
                    className="rounded-xl"
                  >
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="directory">
          <SpecialistProfileWizard />
        </TabsContent>

        <TabsContent value="specializations" className="space-y-5">
          {user.approved && (
            <CPPApprovalNotification
              cppLevels={getAllCPPLevels()}
              isApproved={true}
            />
          )}

          <Card className="shadow-sm border rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Your Specializations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your subjects, software, services, and skills (7-15 subjects required)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSpecializations ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs text-muted-foreground mt-2">Loading specializations...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Subjects ({selectedSubjectIds.length}/15)</Label>
                        {selectedSubjectIds.length < 7 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Min 7</Badge>
                        )}
                      </div>
                      {subjectNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {subjectNames.map((name, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[11px]">{name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No subjects selected</p>
                      )}
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border">
                      <Label className="text-xs font-semibold">Software &amp; Tools ({selectedSoftwareIds.length})</Label>
                      {softwareNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {softwareNames.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="text-[11px]">{name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No software selected</p>
                      )}
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border">
                      <Label className="text-xs font-semibold">Services ({selectedServiceIds.length})</Label>
                      {serviceNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {serviceNames.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No services selected</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      onClick={() => setSpecializationDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edit Specializations
                    </Button>
                    <Button
                      onClick={() => router.push('/freelancer/settings/subjects')}
                      variant="default"
                      size="sm"
                      className="rounded-xl"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Manage Subjects
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Specialization Selection Dialog */}
      <SubjectSelectionDialogEnhanced
        open={specializationDialogOpen}
        onOpenChange={setSpecializationDialogOpen}
        selectedSubjectIds={selectedSubjectIds}
        selectedSoftwareIds={selectedSoftwareIds}
        selectedServiceIds={selectedServiceIds}
        selectedSkills={selectedSkills}
        onSave={handleSaveSpecializations}
        mode="full"
      />
    </div>
  );
}
