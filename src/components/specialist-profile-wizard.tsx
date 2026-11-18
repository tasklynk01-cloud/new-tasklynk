"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GraduationCap,
  Briefcase,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  Save,
  Send,
  Loader2,
  Sparkles,
  Tag,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeApiFetch } from '@/lib/client-api-helpers';

interface EducationItem {
  institution: string;
  course: string;
  qualification: string;
  status: string;
  completionYear?: string;
}

interface ExperienceItem {
  title: string;
  organization: string;
  period: string;
  description: string;
}

interface PortfolioItem {
  title: string;
  description: string;
  role: string;
  imageUrl?: string;
  date?: string;
}

const AVAILABILITY_OPTIONS = [
  'Available Now (24/7 Managed)',
  'Available Full-Time',
  'Available Part-Time',
  'Available Weekends & Evenings',
  'Limited Availability',
];

const SUGGESTED_SKILLS = [
  'Financial Modeling',
  'Power BI',
  'Advanced Excel',
  'SPSS',
  'STATA',
  'R Programming',
  'Python Data Science',
  'Next.js',
  'React',
  'Node.js',
  'TypeScript',
  'Brand Identity',
  'Logo Design',
  'Pitch Deck Design',
  'Business Plans',
  'Econometrics',
  'APA / Harvard Style',
  'Turnitin QA',
];

export function SpecialistProfileWizard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [profileStatus, setProfileStatus] = useState<string>('draft');
  const [publicSlug, setPublicSlug] = useState<string>('');
  const [isApproved, setIsApproved] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('Available Now (24/7 Managed)');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await safeApiFetch('/api/freelancer/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setHeadline(d.headline || '');
          setBio(d.bio || '');
          setProfileStatus(d.profileStatus || 'draft');
          setPublicSlug(d.publicSlug || '');
          setIsApproved(d.approved === true);
          setReviewNotes(d.reviewNotes || null);
          setAvailability(d.availability || 'Available Now (24/7 Managed)');
          setSkills(Array.isArray(d.skills) ? d.skills : []);
          setEducation(Array.isArray(d.education) ? d.education : []);
          setExperience(Array.isArray(d.experience) ? d.experience : []);
          setPortfolio(Array.isArray(d.portfolio) ? d.portfolio.slice(0, 3) : []);
        }
      }
    } catch (err) {
      console.error('Failed to load specialist profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Profile Completeness calculation
  const calculateCompleteness = () => {
    let score = 0;
    if (headline.trim().length > 5) score += 20;
    if (bio.trim().length > 30) score += 25;
    if (skills.length >= 3) score += 15;
    if (education.length > 0) score += 15;
    if (experience.length > 0) score += 15;
    if (portfolio.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleSave = async (publishNow = true) => {
    try {
      setSaving(true);
      const res = await safeApiFetch('/api/freelancer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          bio,
          skills,
          availability,
          education,
          experience,
          portfolio: portfolio.slice(0, 3),
          publishNow,
          submitForReview: !isApproved,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Profile saved and updated live!');
        if (data.data?.profileStatus) {
          setProfileStatus(data.data.profileStatus);
        }
        if (data.data?.publicSlug) {
          setPublicSlug(data.data.publicSlug);
        }
      } else {
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Skill tag helpers
  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.info(`"${trimmed}" is already added.`);
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Education helpers
  const addEducation = () => {
    setEducation([
      ...education,
      {
        institution: '',
        course: '',
        qualification: "Bachelor's Degree",
        status: 'Completed',
        completionYear: new Date().getFullYear().toString(),
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  // Experience helpers
  const addExperience = () => {
    setExperience([
      ...experience,
      {
        title: '',
        organization: '',
        period: `${new Date().getFullYear() - 2} - Present`,
        description: '',
      },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  // Portfolio helpers (max 3)
  const addPortfolio = () => {
    if (portfolio.length >= 3) {
      toast.error('Maximum of 3 portfolio deliverables permitted.');
      return;
    }
    setPortfolio([
      ...portfolio,
      { title: '', role: '', description: '', imageUrl: '', date: '2025 - 2026' },
    ]);
  };

  const removePortfolio = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const updatePortfolio = (index: number, field: keyof PortfolioItem, value: string) => {
    const updated = [...portfolio];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolio(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'tasklynk/portfolio');

      const res = await safeApiFetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      if (res.ok && (json.url || json.secure_url)) {
        const url = json.url || json.secure_url;
        updatePortfolio(index, 'imageUrl', url);
        toast.success('Screenshot uploaded successfully!');
      } else {
        toast.error('Failed to upload image. Please ensure image is under 5MB.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Upload error');
    } finally {
      setUploadingIndex(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center border rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7A3D] mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Loading specialist profile studio...</p>
      </Card>
    );
  }

  const livePublicUrl = publicSlug ? `/professionals/${publicSlug}` : null;

  return (
    <Card className="border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl overflow-hidden shadow-xs bg-white dark:bg-[#161026]">
      {/* Top Studio Control Bar */}
      <CardHeader className="bg-[#FAF8FD] dark:bg-[#1C152E] pb-6 border-b border-[#EDE5F5] dark:border-[#271E3C]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#FF7A3D]" />
              <CardTitle className="text-xl font-black text-[#22183D] dark:text-white tracking-tight">
                Specialist Profile &amp; Directory Listing Studio
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">
              Update your biography, credentials, skills, and portfolio samples. Every detail is rendered directly on your public profile page.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {profileStatus === 'published' ? (
              <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-3 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Live &amp; Published
              </Badge>
            ) : profileStatus === 'pending_review' ? (
              <Badge className="bg-amber-500 text-white font-bold text-xs py-1 px-3 shadow-xs">
                <Clock className="w-3.5 h-3.5 mr-1" /> Pending Admin Review
              </Badge>
            ) : (
              <Badge variant="outline" className="font-bold text-xs py-1 px-3 border-dashed">
                Draft Profile
              </Badge>
            )}

            {livePublicUrl && (
              <a
                href={livePublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5B3594] hover:bg-[#48267A] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#FF7A3D]" />
                <span>View Public Profile ↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mt-4 pt-4 border-t border-[#EDE5F5] dark:border-[#271E3C] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4A4060] dark:text-[#DDD3E9]">
              Profile Completeness Score
            </span>
            <span className="font-extrabold text-[#5B3594] dark:text-[#FFA06E]">
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-[#EDE5F5] dark:bg-[#271E3C] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#5B3594] to-[#FF7A3D] h-full transition-all duration-500 rounded-full"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Review Feedback Alert */}
        {reviewNotes && (profileStatus === 'changes_requested' || profileStatus === 'rejected') && (
          <Alert className="mt-4 border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <AlertDescription className="text-xs">
              <strong>Admin Feedback:</strong> {reviewNotes}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-8 pt-6">

        {/* Section 1: Headline, Bio & Availability */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDE5F5] dark:border-[#271E3C] pb-2">
            <Briefcase className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#22183D] dark:text-white">
              1. Title, Biography &amp; Availability
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="headline" className="text-xs font-bold text-[#22183D] dark:text-white">
                Professional Title / Headline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="headline"
                placeholder="e.g., Financial Analyst & Business Intelligence Specialist"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={saving}
                className="font-semibold text-sm border-[#DDD3E9] dark:border-[#2E2448] rounded-lg"
              />
              <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">
                A sharp, executive title summarizing your domain expertise.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="availability" className="text-xs font-bold text-[#22183D] dark:text-white">
                Current Availability
              </Label>
              <select
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                disabled={saving}
                className="w-full h-10 px-3 bg-white dark:bg-[#1E1634] border border-[#DDD3E9] dark:border-[#2E2448] rounded-lg text-xs font-semibold text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">
                Shown as your live working status in the directory.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs font-bold text-[#22183D] dark:text-white">
              Professional Biography &amp; Practice Overview <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Detail your background, years of experience, specific modeling/coding/design methodologies, and the tangible deliverables you produce for TaskLynk clients..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              className="text-sm border-[#DDD3E9] dark:border-[#2E2448] rounded-lg leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Core Skills Matrix */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDE5F5] dark:border-[#271E3C] pb-2">
            <Tag className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#22183D] dark:text-white">
              2. Core Skills &amp; Proficiencies
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type a skill (e.g. Power BI, SPSS, Next.js, Financial Modeling) and press Add..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(newSkillInput);
                  }
                }}
                disabled={saving}
                className="text-xs h-10 border-[#DDD3E9] dark:border-[#2E2448] rounded-lg"
              />
              <Button
                type="button"
                onClick={() => addSkill(newSkillInput)}
                className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold text-xs rounded-lg px-5 h-10 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
              </Button>
            </div>

            {/* Selected Skills Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-lg border border-[#EDE5F5] dark:border-[#271E3C] bg-[#FAF8FD] dark:bg-[#1A1230]">
              {skills.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  No skills added yet. Add at least 3 skills to highlight your competencies.
                </span>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white dark:bg-[#251A3E] text-[#5B3594] dark:text-[#EFE8F8] border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-[#6B627A] hover:text-red-500 transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-[#6B627A] dark:text-[#DDD3E9]/70 mr-2">
                Quick Add:
              </span>
              <div className="inline-flex flex-wrap gap-1 mt-1">
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="text-[11px] font-semibold text-[#5B3594] dark:text-[#FFA06E] hover:underline bg-[#EDE5F5]/60 dark:bg-[#271E42] px-2 py-0.5 rounded border border-[#DDD3E9]/50"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Education & Academic Credentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5F5] dark:border-[#271E3C] pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#22183D] dark:text-white">
                3. Education &amp; Academic Credentials
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEducation}
              className="text-xs rounded-lg border-[#DDD3E9] dark:border-[#2E2448] font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Degree
            </Button>
          </div>

          {education.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No education credentials listed yet. Click &quot;Add Degree&quot; to list your university degrees, diplomas, or CPA qualifications.
            </p>
          ) : (
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-[#EDE5F5] dark:border-[#2E2448] bg-[#FAF8FD] dark:bg-[#1A1230] space-y-3 relative group">
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete education record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <Label className="text-xs font-bold">Course / Specialization</Label>
                      <Input
                        placeholder="e.g., BSc. Financial Economics"
                        value={edu.course}
                        onChange={(e) => updateEducation(idx, 'course', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">University / Awarding Body</Label>
                      <Input
                        placeholder="e.g., Strathmore University"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Qualification Level</Label>
                      <Input
                        placeholder="e.g., Bachelor's, Master's, CPA(K)"
                        value={edu.qualification}
                        onChange={(e) => updateEducation(idx, 'qualification', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Status</Label>
                      <Input
                        placeholder="e.g., Completed, Ongoing"
                        value={edu.status}
                        onChange={(e) => updateEducation(idx, 'status', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Completion Year</Label>
                      <Input
                        placeholder="e.g., 2022"
                        value={edu.completionYear || ''}
                        onChange={(e) => updateEducation(idx, 'completionYear', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Professional Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5F5] dark:border-[#271E3C] pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#22183D] dark:text-white">
                4. Professional Work Experience &amp; Projects
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExperience}
              className="text-xs rounded-lg border-[#DDD3E9] dark:border-[#2E2448] font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Position
            </Button>
          </div>

          {experience.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No experience records added. Click &quot;Add Position&quot; to showcase your past consulting engagements or corporate positions.
            </p>
          ) : (
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-[#EDE5F5] dark:border-[#2E2448] bg-[#FAF8FD] dark:bg-[#1A1230] space-y-3 relative group">
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete experience record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid sm:grid-cols-3 gap-3 pr-8">
                    <div>
                      <Label className="text-xs font-bold">Job Title / Role</Label>
                      <Input
                        placeholder="e.g., Lead Financial Analyst"
                        value={exp.title}
                        onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Organization / Sector</Label>
                      <Input
                        placeholder="e.g., SME Advisory Group"
                        value={exp.organization}
                        onChange={(e) => updateExperience(idx, 'organization', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Time Period</Label>
                      <Input
                        placeholder="e.g., 2023 - Present"
                        value={exp.period}
                        onChange={(e) => updateExperience(idx, 'period', e.target.value)}
                        className="text-xs h-9 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Scope of Work &amp; Achievements</Label>
                    <Textarea
                      rows={2}
                      placeholder="Summary of models built, analyses executed, or systems delivered..."
                      value={exp.description}
                      onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                      className="text-xs bg-white dark:bg-[#150F24] rounded-lg mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Portfolio Deliverables (Strictly Capped at 3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5F5] dark:border-[#271E3C] pb-2">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#22183D] dark:text-white">
                  5. Portfolio Deliverables (Max 3 Samples)
                </h3>
              </div>
              <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70 mt-0.5">
                Visual proofs or sample screenshots of deliverables (dashboards, code architectures, designs, statistical outputs).
              </p>
            </div>
            {portfolio.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPortfolio}
                className="text-xs rounded-lg border-[#DDD3E9] dark:border-[#2E2448] font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Deliverable ({portfolio.length}/3)
              </Button>
            )}
          </div>

          {portfolio.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No portfolio deliverables uploaded yet. Adding project screenshots directly increases client inquiries.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {portfolio.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-[#EDE5F5] dark:border-[#2E2448] bg-[#FAF8FD] dark:bg-[#1A1230] space-y-3 relative flex flex-col justify-between">
                  <button
                    type="button"
                    onClick={() => removePortfolio(idx)}
                    className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Remove portfolio item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-bold">Deliverable Title *</Label>
                      <Input
                        placeholder="e.g., 5-Year Cash Flow Projections"
                        value={item.title}
                        onChange={(e) => updatePortfolio(idx, 'title', e.target.value)}
                        className="text-xs h-8 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Your Role</Label>
                      <Input
                        placeholder="e.g., Lead Financial Modeler"
                        value={item.role}
                        onChange={(e) => updatePortfolio(idx, 'role', e.target.value)}
                        className="text-xs h-8 bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Short Description</Label>
                      <Textarea
                        rows={2}
                        placeholder="Key methodologies, tools used, and outcomes achieved..."
                        value={item.description}
                        onChange={(e) => updatePortfolio(idx, 'description', e.target.value)}
                        className="text-xs bg-white dark:bg-[#150F24] rounded-lg mt-1"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EDE5F5] dark:border-[#271E3C]">
                    {item.imageUrl ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title || 'Portfolio sample'}
                          className="w-full h-24 object-cover rounded-lg border border-[#DDD3E9] dark:border-[#2E2448]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePortfolio(idx, 'imageUrl', '')}
                          className="w-full text-[10px] text-muted-foreground hover:text-red-500 h-6"
                        >
                          Change Screenshot
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`portfolio-upload-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(idx, e.target.files[0]);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingIndex === idx}
                          onClick={() => {
                            document.getElementById(`portfolio-upload-${idx}`)?.click();
                          }}
                          className="w-full text-xs h-9 rounded-lg border-[#DDD3E9] dark:border-[#2E2448] font-bold"
                        >
                          {uploadingIndex === idx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Upload Screenshot
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master Save & Publish Live Bar */}
        <div className="pt-6 border-t border-[#EDE5F5] dark:border-[#271E3C] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Changes publish immediately to your public specialist URL.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {livePublicUrl && (
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-lg text-xs font-bold border-[#DDD3E9] dark:border-[#2E2448]">
                <a href={livePublicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Preview Live Profile</span>
                </a>
              </Button>
            )}

            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !headline.trim() || !bio.trim()}
              size="lg"
              className="w-full sm:w-auto bg-[#FF7A3D] hover:bg-[#E5682C] text-white font-extrabold rounded-lg px-8 text-sm shadow-md shadow-[#FF7A3D]/25"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving &amp; Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save &amp; Publish Profile Live
                </>
              )}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
