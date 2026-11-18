"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Sparkles, ArrowLeft, ArrowRight, Search, Code, Briefcase, Star, Check, BookOpen } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';

// Force dynamic rendering for this page (uses search params)
export const dynamic = 'force-dynamic';

interface Subject {
  id: number;
  name: string;
}

interface Software {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
}

interface Skill {
  id: string;
  name: string;
}

const STEPS = ['Registration', 'Availability', 'Subjects', 'Verification'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      {STEPS.map((step, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={
                'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ' +
                (isDone
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground')
              }
            >
              {isDone ? <Check className="size-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

// Component that uses useSearchParams - must be wrapped in Suspense
function RegisterFreelancerSubjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedSoftwareIds, setSelectedSoftwareIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjectsSaved, setSubjectsSaved] = useState(false);

  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      toast.error('Invalid registration flow. Please start registration again.');
      router.push('/register/freelancer');
      return;
    }

    // Load saved selections from sessionStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedSubjectIds = sessionStorage.getItem('pending_subject_ids');
        if (savedSubjectIds) {
          const parsed = JSON.parse(savedSubjectIds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedSubjectIds(parsed);
            setSubjectsSaved(true);
          }
        }
      } catch (error) {
        console.warn('[Registration Subjects] Error loading saved subjects:', error);
      }
    }

    const initialize = async () => {
      try {
        await fetchAllOptions();
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [email, router]);

  const requirementMet = useMemo(() => {
    return selectedSubjectIds.length >= 7 && selectedSubjectIds.length <= 15;
  }, [selectedSubjectIds.length]);

  const fetchAllOptions = async () => {
    try {
      const response = await safeApiFetch('/api/freelancer/skills/options', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSubjects(Array.isArray(data.data.subjects) ? data.data.subjects : []);
          setSoftware(Array.isArray(data.data.software) ? data.data.software : []);
          setServices(Array.isArray(data.data.services) ? data.data.services : []);

          // Convert skills array to objects
          const skillsList = data.data.skills || [];
          if (Array.isArray(skillsList)) {
            setSkills(
              skillsList
                .filter((s: any) => s && typeof s === 'string')
                .map((s: string) => ({ id: s, name: s }))
            );
          } else {
            setSkills([]);
          }
        } else {
          toast.error('Failed to load options. Please refresh the page.');
        }
      } else {
        toast.error('Failed to load options. Please refresh the page.');
      }
    } catch (error) {
      console.error('[Registration Subjects] Error fetching options:', error);
      toast.error('Failed to load options. Please check your connection and refresh.');
    }
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 15) {
        toast.error('Maximum 15 subjects allowed');
        return prev;
      }
      return [...prev, id];
    });
    setSubjectsSaved(false);
  };

  const toggleSoftware = (id: number) => {
    setSelectedSoftwareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      return [...prev, skill];
    });
  };

  const handleSave = () => {
    if (selectedSubjectIds.length < 7) {
      toast.error('Please select at least 7 subjects');
      return;
    }
    if (selectedSubjectIds.length > 15) {
      toast.error('Maximum 15 subjects allowed');
      return;
    }

    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('pending_subject_ids', JSON.stringify(selectedSubjectIds));
        setSubjectsSaved(true);
        toast.success(`${selectedSubjectIds.length} subjects saved!`);
      } catch (error) {
        console.error('[Registration Subjects] Error saving to sessionStorage:', error);
        toast.error('Failed to save subjects. Please try again.');
      }
    }
  };

  const handleContinue = () => {
    if (!requirementMet) {
      toast.error('Please select between 7-15 subjects to continue');
      return;
    }

    // Ensure subjects are saved
    if (!subjectsSaved) {
      handleSave();
    }

    // Ensure data is in sessionStorage
    if (typeof window !== 'undefined' && selectedSubjectIds.length > 0) {
      try {
        sessionStorage.setItem('pending_subject_ids', JSON.stringify(selectedSubjectIds));
      } catch (error) {
        console.error('[Registration Subjects] Error saving to sessionStorage:', error);
        toast.error('Failed to save subjects. Please try again.');
        return;
      }
    }

    // Redirect to email verification - this triggers email verification
    toast.success('Redirecting to email verification...');
    router.push(`/verify-email?email=${encodeURIComponent(email!)}`);
  };

  const handleBack = () => {
    router.push(`/register/freelancer/availability?email=${encodeURIComponent(email!)}`);
  };

  // Filter based on search
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSoftware = software.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items by first letter
  const groupByLetter = <T extends { id: any; name: string }>(items: T[]) => {
    return items.reduce((acc, item) => {
      const letter = item.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const groupedSubjects = groupByLetter(filteredSubjects);
  const groupedSoftware = groupByLetter(filteredSoftware);
  const groupedServices = groupByLetter(filteredServices);

  const selectedSubjectNames = useMemo(() => {
    return subjects
      .filter((s) => selectedSubjectIds.includes(s.id))
      .map((s) => s.name);
  }, [subjects, selectedSubjectIds]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const renderGroupedItems = <T extends { id: any; name: string }>(
    grouped: Record<string, T[]>,
    selected: any[],
    onToggle: (id: any) => void,
    type: 'subjects' | 'software' | 'services' | 'skills'
  ) => {
    const sortedLetters = Object.keys(grouped).sort();

    return (
      <div className="space-y-3">
        {sortedLetters.map((letter) => {
          const items = grouped[letter];
          if (!items || !Array.isArray(items) || items.length === 0) return null;

          return (
            <div key={letter} className="space-y-1.5">
              <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur-sm">
                <Badge variant="outline" className="text-xs font-semibold">
                  {letter}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {items.map((item) => {
                  if (!item || !item.id || !item.name) return null;

                  const isSelected = type === 'skills'
                    ? selected.includes(item.name)
                    : selected.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={
                        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ' +
                        (isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40')
                      }
                      onClick={() => onToggle(type === 'skills' ? item.name : item.id)}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => onToggle(type === 'skills' ? item.name : item.id)} className="pointer-events-none shrink-0" />
                      <span className="flex-1 text-sm">{item.name}</span>
                      {isSelected && <CheckCircle2 className="size-3.5 shrink-0 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AuthShell
      title="Choose your subjects & skills"
      subtitle="Select 7-15 subjects you're confident delivering, plus any software, services, and skills."
      width="xl"
      backHref={`/register/freelancer/availability?email=${encodeURIComponent(email || '')}`}
      backLabel="Back"
    >
      <StepIndicator current={2} />

      <div className="mt-4 space-y-6">
        <div
          className={
            'flex items-start gap-3 rounded-2xl border p-4 ' +
            (requirementMet ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[#FF7A3D]/30 bg-[#FF7A3D]/10')
          }
        >
          <CheckCircle2 className={'mt-0.5 size-5 shrink-0 ' + (requirementMet ? 'text-emerald-500 font-bold' : 'text-[#FF7A3D] font-bold')} />
          <div className="text-sm">
            <p className="font-black text-[#22183D] dark:text-white">
              {requirementMet ? 'Requirement met' : 'Selection in progress'}
            </p>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mt-0.5 font-medium">
              {selectedSubjectIds.length} of 7-15 subjects selected
              {subjectsSaved && requirementMet ? ' · Saved' : ''}
            </p>
          </div>
        </div>

        {selectedSubjectNames.length > 0 && (
          <div className="rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] p-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#FF7A3D]" />
              <p className="text-xs font-bold text-[#6B627A] dark:text-[#DDD3E9]/80 uppercase tracking-wide">
                Selected subjects ({selectedSubjectNames.length})
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedSubjectNames.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs font-bold bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] border border-[#DDD3E9] dark:border-[#3A2F5B] px-3 py-1 rounded-full">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6B627A] dark:text-[#DDD3E9]/70" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl pl-10 pr-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] h-12"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#FAF8FD] dark:bg-[#1D1533] p-1.5 rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] h-13">
            <TabsTrigger value="subjects" className="gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#5B3594] data-[state=active]:text-white transition-all">
              <BookOpen className="size-3.5" />
              Subjects
              {selectedSubjectIds.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-[#FF7A3D] text-white">
                  {selectedSubjectIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="software" className="gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#5B3594] data-[state=active]:text-white transition-all">
              <Code className="size-3.5" />
              Software
              {selectedSoftwareIds.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-[#FF7A3D] text-white">
                  {selectedSoftwareIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#5B3594] data-[state=active]:text-white transition-all">
              <Briefcase className="size-3.5" />
              Services
              {selectedServiceIds.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-[#FF7A3D] text-white">
                  {selectedServiceIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#5B3594] data-[state=active]:text-white transition-all">
              <Star className="size-3.5" />
              Skills
              {selectedSkills.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-[#FF7A3D] text-white">
                  {selectedSkills.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="mt-3">
            <div className="mb-3 rounded-xl border border-[#5B3594]/20 bg-[#EFE8F8] dark:bg-[#271E42] px-3.5 py-2">
              <p className="text-xs font-bold text-[#5B3594] dark:text-[#EFE8F8]">
                Select 7-15 subjects (currently: {selectedSubjectIds.length})
              </p>
            </div>
            <ScrollArea className="h-[360px] w-full rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] p-4 bg-[#FAF8FD] dark:bg-[#1D1533]">
              {filteredSubjects.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80">No subjects found</p>
                </div>
              ) : (
                renderGroupedItems(groupedSubjects, selectedSubjectIds, toggleSubject, 'subjects')
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="software" className="mt-3">
            <ScrollArea className="h-[360px] w-full rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] p-4 bg-[#FAF8FD] dark:bg-[#1D1533]">
              {filteredSoftware.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80">No software found</p>
                </div>
              ) : (
                renderGroupedItems(groupedSoftware, selectedSoftwareIds, toggleSoftware, 'software')
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="services" className="mt-3">
            <ScrollArea className="h-[360px] w-full rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] p-4 bg-[#FAF8FD] dark:bg-[#1D1533]">
              {filteredServices.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80">No services found</p>
                </div>
              ) : (
                renderGroupedItems(groupedServices, selectedServiceIds, toggleService, 'services')
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="skills" className="mt-3">
            <ScrollArea className="h-[360px] w-full rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] p-4 bg-[#FAF8FD] dark:bg-[#1D1533]">
              {filteredSkills.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80">No skills found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {filteredSkills.map((skill) => {
                    if (!skill || !skill.id || !skill.name) return null;

                    const isSelected = selectedSkills.includes(skill.name);
                    return (
                      <div
                        key={skill.id}
                        className={
                          'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all ' +
                          (isSelected ? 'border-[#5B3594] bg-[#5B3594]/15 shadow-sm' : 'border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#140E24] hover:border-[#5B3594]')
                        }
                        onClick={() => toggleSkill(skill.name)}
                      >
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSkill(skill.name)} className="pointer-events-none shrink-0" />
                        <span className="flex-1 text-sm font-semibold text-[#22183D] dark:text-white">{skill.name}</span>
                        {isSelected && <CheckCircle2 className="size-4 shrink-0 text-[#5B3594]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={handleBack} className="order-2 sm:order-1 rounded-xl h-11 border-[#DDD3E9] dark:border-[#3A2F5B] font-bold">
            <ArrowLeft className="size-3.5 mr-1" />
            Back
          </Button>
          <div className="order-1 flex gap-2.5 sm:order-2">
            {selectedSubjectIds.length > 0 && !subjectsSaved && (
              <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-xl h-11 border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] font-bold">
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  'Save selection'
                )}
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={!requirementMet || saving}
              size="lg"
              className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-[#FF7A3D]/25"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                <>
                  Next: Verify Email
                  <ArrowRight className="size-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
        Need help? Email{' '}
        <a href="mailto:admn@tasklynk.co.ke" className="font-bold text-[#5B3594] dark:text-[#FF7A3D] hover:underline">
          admn@tasklynk.co.ke
        </a>
      </p>
    </AuthShell>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

// Main page component with Suspense boundary
export default function RegisterFreelancerSubjectsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterFreelancerSubjectsContent />
    </Suspense>
  );
}
