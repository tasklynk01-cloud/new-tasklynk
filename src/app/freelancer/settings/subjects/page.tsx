"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Loader2, CheckCircle2, BookOpen, ArrowLeft, Search, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Subject {
  id: number;
  name: string;
  description?: string | null;
}

export default function FreelancerSubjectSelectionSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'freelancer')) {
      router.push('/freelancer/settings');
      return;
    }
    if (user) {
      fetchData();
      fetchExistingSelections();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch('/api/freelancer/skills/options', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data.subjects)) {
          setSubjects(data.data.subjects);
        } else {
          toast.error('Failed to load subjects');
        }
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingSelections = async () => {
    try {
      const response = await safeApiFetch('/api/freelancer/subjects', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const subjectIds = data.domainIds || data.subjects?.map((s: any) => s.id) || [];
        setSelectedSubjectIds(Array.isArray(subjectIds) ? subjectIds : []);
      }
    } catch (error) {
      console.error('Failed to fetch existing selections:', error);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    return subjects.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  const groupedSubjects = useMemo(() => {
    return filteredSubjects.reduce((acc, subject) => {
      const letter = subject.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(subject);
      return acc;
    }, {} as Record<string, Subject[]>);
  }, [filteredSubjects]);

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
  };

  const handleSave = async () => {
    if (selectedSubjectIds.length < 7) {
      toast.error('Please select at least 7 subjects');
      return;
    }
    if (selectedSubjectIds.length > 15) {
      toast.error('Maximum 15 subjects allowed');
      return;
    }

    try {
      setSaving(true);
      const response = await safeApiFetch('/api/freelancer/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domainIds: selectedSubjectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(extractErrorMessage(errorData, 'Failed to save subjects'));
        return;
      }

      toast.success('Subject preferences updated successfully!');
      router.push('/freelancer/settings');
    } catch (error) {
      console.error('Error saving subjects:', error);
      toast.error('Failed to save subject preferences');
    } finally {
      setSaving(false);
    }
  };

  const requirementMet = selectedSubjectIds.length >= 7 && selectedSubjectIds.length <= 15;
  const selectedSubjectNames = subjects
    .filter(s => selectedSubjectIds.includes(s.id))
    .map(s => s.name);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/freelancer/settings')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Select Your Subjects</h1>
            <p className="text-muted-foreground mt-1">
              Choose 7-15 subjects you're confident delivering
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              Selection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border-2 ${
              requirementMet
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-6 h-6 ${
                  requirementMet ? 'text-green-600' : 'text-amber-600'
                }`} />
                <div>
                  <p className="font-semibold">
                    {selectedSubjectIds.length} / 15 subjects selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {requirementMet
                      ? 'Requirement met! You can save your selections.'
                      : `Select ${Math.max(0, 7 - selectedSubjectIds.length)} more to meet the minimum requirement.`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Subjects */}
        {selectedSubjectNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Subjects ({selectedSubjectNames.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {selectedSubjectNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-sm py-1 px-3">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Subject List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Subjects</CardTitle>
            <CardDescription>
              Search and select subjects from the list below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Subject List */}
            <div className="h-[550px] w-full border rounded-xl p-4 overflow-y-auto overscroll-contain">
              <div className="space-y-6">
                {Object.entries(groupedSubjects)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, letterSubjects]) => (
                    <div key={letter} className="space-y-2">
                      <h3 className="text-lg font-semibold text-primary sticky top-0 bg-background py-2 z-10">
                        {letter}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {letterSubjects.map((subject) => {
                          const isSelected = selectedSubjectIds.includes(subject.id);
                          return (
                            <div
                              key={subject.id}
                              className={`flex items-center space-x-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 border-primary'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => toggleSubject(subject.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSubject(subject.id)}
                              />
                              <label className="flex-1 cursor-pointer text-sm font-medium">
                                {subject.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                {Object.keys(groupedSubjects).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No subjects found matching your search.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/freelancer/settings')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!requirementMet || saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

