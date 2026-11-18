"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Mail, 
  Phone,
  Globe,
  Award,
  BookOpen,
  Star,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface EditorProfile {
  id: number;
  userId: number;
  specialization: string | null;
  yearsExperience: number | null;
  languages: string | null;
  qualifications: string | null;
  areasOfExpertise: string | null;
  averageEditsPerOrder: number;
  ordersTouched: number;
  clientSatisfactionRate: number;
  isProfileComplete: boolean;
}

const specializationOptions = [
  'grammar',
  'plagiarism',
  'structure',
  'formatting',
  'content_quality',
  'technical_accuracy',
  'general',
];

const languageOptions = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Arabic',
  'Portuguese',
];

export default function EditorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<EditorProfile | null>(null);
  
  // Form fields
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState('');
  const [areasOfExpertise, setAreasOfExpertise] = useState('');

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/editor/profile?editorId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Populate form
        if (data.profile) {
          setSpecialization(data.profile.specialization || '');
          setYearsExperience(data.profile.yearsExperience?.toString() || '');
          setLanguages(data.profile.languages ? JSON.parse(data.profile.languages) : []);
          setQualifications(data.profile.qualifications || '');
          setAreasOfExpertise(data.profile.areasOfExpertise || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const response = await safeApiFetch('/api/editor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editorId: user.id,
          specialization,
          yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
          languages: JSON.stringify(languages),
          qualifications,
          areasOfExpertise,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your editor profile and credentials
        </p>
      </div>

      {/* Profile Completion Banner */}
      {profile && !profile.isProfileComplete && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Complete your profile to receive more assignments. Fill in all required fields below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your editing expertise and qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select value={specialization} onValueChange={setSpecialization}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializationOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>
                          {opt.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-3">
                  {languageOptions.map(lang => (
                    <Badge
                      key={lang}
                      variant={languages.includes(lang) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                      {languages.includes(lang) && <CheckCircle className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  placeholder="List your relevant qualifications, certifications, degrees..."
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise</Label>
                <Textarea
                  id="expertise"
                  placeholder="e.g., Academic writing, Technical documentation, Research papers..."
                  value={areasOfExpertise}
                  onChange={(e) => setAreasOfExpertise(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Orders Reviewed</span>
                </div>
                <span className="font-bold">{profile?.ordersTouched || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Edits/Order</span>
                </div>
                <span className="font-bold">{profile?.averageEditsPerOrder || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Satisfaction Rate</span>
                </div>
                <span className="font-bold">
                  {profile?.clientSatisfactionRate ? `${(profile.clientSatisfactionRate * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={profile?.isProfileComplete ? 'default' : 'outline'}
                className={`w-full justify-center py-2 ${profile?.isProfileComplete ? 'bg-green-500' : ''}`}
              >
                {profile?.isProfileComplete ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Incomplete
                  </>
                )}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
