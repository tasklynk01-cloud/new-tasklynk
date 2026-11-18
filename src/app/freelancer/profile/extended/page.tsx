"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { 
  Loader2, Save, User, Briefcase, Clock, Globe, 
  Award, Languages, Calendar, CheckCircle, AlertCircle,
  Plus, X 
} from 'lucide-react';

interface FreelancerProfile {
  id: number;
  userId: number;
  bio: string | null;
  skills: string | null;
  certifications: string | null;
  portfolio: string | null;
  hourlyRate: number | null;
  languages: string | null;
  timezone: string | null;
  availability: string | null;
  availableDays: string | null;
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  responseTime: number | null;
  totalClients: number;
  repeatClientRate: number;
  jobsCompleted: number;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  subjectId: number;
  subjectName: string;
  categoryId: number | null;
}

const timezones = [
  { value: 'Africa/Nairobi', label: 'East Africa Time (EAT) - Nairobi' },
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT) - Lagos' },
  { value: 'Africa/Johannesburg', label: 'South Africa Time (SAST)' },
  { value: 'Africa/Cairo', label: 'Egypt Time (EET) - Cairo' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT) - London' },
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST) - Dubai' },
];

const availabilityOptions = [
  { value: 'full-time', label: 'Full Time (40+ hrs/week)' },
  { value: 'part-time', label: 'Part Time (20-40 hrs/week)' },
  { value: 'occasional', label: 'Occasional (< 20 hrs/week)' },
  { value: 'weekends', label: 'Weekends Only' },
];

const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const commonLanguages = ['English', 'Swahili', 'French', 'Arabic', 'Spanish', 'German'];

export default function FreelancerExtendedProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [formData, setFormData] = useState({
    bio: '',
    skills: [] as string[],
    certifications: [] as string[],
    languages: [] as string[],
    timezone: 'Africa/Nairobi',
    availability: 'part-time',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    availableTimeStart: '09:00',
    availableTimeEnd: '17:00',
    responseTime: 24,
    newSkill: '',
    newCertification: '',
    newLanguage: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/login');
        return;
      }
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/freelancer-profiles?userId=${user?.id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
          
          // Parse JSON fields
          let skills: string[] = [];
          let certifications: string[] = [];
          let languages: string[] = [];
          let availableDays: string[] = [];
          
          try {
            if (data.profile.skills) {
              skills = typeof data.profile.skills === 'string' 
                ? JSON.parse(data.profile.skills) 
                : data.profile.skills;
            }
            if (data.profile.certifications) {
              certifications = typeof data.profile.certifications === 'string'
                ? JSON.parse(data.profile.certifications)
                : data.profile.certifications;
            }
            if (data.profile.languages) {
              languages = typeof data.profile.languages === 'string'
                ? JSON.parse(data.profile.languages)
                : data.profile.languages;
            }
            if (data.profile.availableDays) {
              availableDays = typeof data.profile.availableDays === 'string'
                ? JSON.parse(data.profile.availableDays)
                : data.profile.availableDays;
            }
          } catch (e) {
            console.error('Error parsing profile fields:', e);
          }
          
          setFormData(prev => ({
            ...prev,
            bio: data.profile.bio || '',
            skills: skills,
            certifications: certifications,
            languages: languages,
            timezone: data.profile.timezone || 'Africa/Nairobi',
            availability: data.profile.availability || 'part-time',
            availableDays: availableDays.length > 0 ? availableDays : prev.availableDays,
            availableTimeStart: data.profile.availableTimeStart || '09:00',
            availableTimeEnd: data.profile.availableTimeEnd || '17:00',
            responseTime: data.profile.responseTime || 24,
          }));
        }
        
        if (data.subjects) {
          setSubjects(data.subjects);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        bio: formData.bio,
        skills: formData.skills,
        certifications: formData.certifications,
        languages: formData.languages,
        timezone: formData.timezone,
        availability: formData.availability,
        availableDays: formData.availableDays,
        availableTimeStart: formData.availableTimeStart,
        availableTimeEnd: formData.availableTimeEnd,
        responseTime: formData.responseTime,
      };

      const response = await safeApiFetch('/api/v2/freelancer-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

if (response.ok) {
        toast.success('Profile saved successfully!');
        fetchProfile();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to save profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: '',
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const addCertification = () => {
    if (formData.newCertification.trim() && !formData.certifications.includes(formData.newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, prev.newCertification.trim()],
        newCertification: '',
      }));
    }
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert),
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  const profileCompletion = () => {
    let score = 0;
    if (formData.bio) score += 25;
    if (formData.skills.length > 0) score += 25;
    if (formData.availability) score += 25;
    if (formData.languages.length > 0) score += 25;
    return score;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Professional Profile</h1>
        <p className="text-gray-600 mt-2">Showcase your skills and availability to potential clients</p>
      </div>

      {/* Profile Completion Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profileCompletion() === 100 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-500" />
              )}
              <div>
                <p className="font-medium">Profile Completion</p>
                <p className="text-sm text-gray-500">
                  {profileCompletion() === 100 
                    ? 'Your profile is complete!' 
                    : 'Complete your profile to get more orders'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#ff8c42] h-2 rounded-full transition-all"
                  style={{ width: `${profileCompletion()}%` }}
                />
              </div>
              <span className="font-medium text-sm">{profileCompletion()}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.jobsCompleted}</p>
                  <p className="text-sm text-gray-500">Jobs Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.totalClients}</p>
                  <p className="text-sm text-gray-500">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{(profile.repeatClientRate || 0).toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Repeat Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subjects Card */}
      {subjects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Subjects</CardTitle>
            <CardDescription>Subjects you can write about (set during registration)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {subjects.map((sub) => (
                <Badge key={sub.subjectId} variant="secondary">
                  {sub.subjectName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Bio Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-5 w-5" />
              About You
            </CardTitle>
            <CardDescription>
              Tell clients about your experience and expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write about your experience, education, and what makes you a great writer..."
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Briefcase className="h-5 w-5" />
              Skills & Expertise
            </CardTitle>
            <CardDescription>
              Add your writing skills and specializations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={formData.newSkill}
                onChange={(e) => setFormData({ ...formData, newSkill: e.target.value })}
                placeholder="Add a skill (e.g., Academic Writing, Research)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
            <CardDescription>
              Add relevant certifications and qualifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={formData.newCertification}
                onChange={(e) => setFormData({ ...formData, newCertification: e.target.value })}
                placeholder="Add a certification (e.g., Bachelor's in English)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              />
              <Button type="button" onClick={addCertification} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {formData.certifications.map((cert) => (
                <Badge key={cert} variant="outline" className="flex items-center gap-1">
                  {cert}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeCertification(cert)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Languages className="h-5 w-5" />
              Languages
            </CardTitle>
            <CardDescription>
              Select languages you can write in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {commonLanguages.map((lang) => (
                <Badge
                  key={lang}
                  variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              Availability
            </CardTitle>
            <CardDescription>
              Set your working hours and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Availability Type *</Label>
              <Select
                value={formData.availability}
                onValueChange={(value) => setFormData({ ...formData, availability: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Available Days</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {daysOfWeek.map((day) => (
                  <Badge
                    key={day.value}
                    variant={formData.availableDays.includes(day.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeStart">Work Start Time</Label>
                <Input
                  id="timeStart"
                  type="time"
                  value={formData.availableTimeStart}
                  onChange={(e) => setFormData({ ...formData, availableTimeStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="timeEnd">Work End Time</Label>
                <Input
                  id="timeEnd"
                  type="time"
                  value={formData.availableTimeEnd}
                  onChange={(e) => setFormData({ ...formData, availableTimeEnd: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responseTime">Typical Response Time (hours)</Label>
              <Input
                id="responseTime"
                type="number"
                min={1}
                max={72}
                value={formData.responseTime}
                onChange={(e) => setFormData({ ...formData, responseTime: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                How quickly you usually respond to new assignments
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Professional Profile
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
