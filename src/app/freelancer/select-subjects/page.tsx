"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { SubjectSelectionDialogEnhanced } from '@/components/subject-selection-dialog-enhanced';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface Domain {
  id: number;
  name: string;
  description?: string | null;
}

// Component that uses useSearchParams - must be wrapped in Suspense
function FreelancerSubjectSelectionContent() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Fetch both in parallel, but don't fail if one fails
        await Promise.allSettled([fetchDomains(), fetchExistingSelections()]);
      } catch (error) {
        console.error('[Subject Selection] Initialization error:', error);
        // Still set initializing to false so page can render
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, []);

  // Disabled auto-open popup - user can click "Edit Subjects" button to open dialog
  // useEffect(() => {
  //   // Auto-open dialog if no subjects selected (less than 7)
  //   // Only auto-open if domains are loaded (to prevent dialog from opening before data is ready)
  //   // Don't auto-open if user just saved (autoPrompted will be true)
  //   if (!initializing && !autoPrompted && domains.length > 0 && selectedSubjectIds.length < 7) {
  //     // Small delay to ensure page is fully rendered
  //     const timer = setTimeout(() => {
  //       setSubjectDialogOpen(true);
  //       setAutoPrompted(true);
  //     }, 800);
  //     return () => clearTimeout(timer);
  //   }
  // }, [initializing, autoPrompted, selectedSubjectIds.length, domains.length]);

  useEffect(() => {
    if (!domains.length) {
      setSelectedSubjectNames([]);
      return;
    }

    const mappedNames = domains
      .filter((domain) => selectedSubjectIds.includes(domain.id))
      .map((domain) => domain.name);
    setSelectedSubjectNames(mappedNames);
  }, [domains, selectedSubjectIds]);

  const requirementMet = useMemo(() => {
    return selectedSubjectIds.length >= 7 && selectedSubjectIds.length <= 15;
  }, [selectedSubjectIds.length]);

  const fetchDomains = async () => {
    try {
      // Use the same endpoint as the dialog for consistency
      const response = await safeApiFetch('/api/freelancer/skills/options', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle the skills/options response structure
        if (data.success && data.data && Array.isArray(data.data.subjects)) {
          const formatted = data.data.subjects.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || null,
          }));
          setDomains(formatted);
          if (formatted.length === 0) {
            console.warn('[Subject Selection] No subjects found');
            toast.error('No subjects available. Please contact support.');
          }
        } else {
          console.error('[Subject Selection] Unexpected response structure:', data);
          toast.error('Failed to load subjects. Please refresh the page.');
        }
      } else {
        console.error('[Subject Selection] Failed to fetch subjects:', response.status);
        toast.error('Failed to load subjects. Please refresh the page.');
      }
    } catch (error) {
      console.error('[Subject Selection] Error fetching subjects:', error);
      toast.error('Failed to load subjects. Please check your connection and refresh.');
    }
  };

  const fetchExistingSelections = async () => {
    try {
      const response = await safeApiFetch('/api/freelancer/subjects', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both possible response structures
        const subjectIds = data.domainIds || data.subjects?.map((s: any) => s.id) || [];
        setSelectedSubjectIds(Array.isArray(subjectIds) ? subjectIds : []);
      } else if (response.status === 401) {
        console.error('[Subject Selection] Unauthorized - user may not be logged in');
        toast.error('Please log in to continue');
        router.push('/login');
      } else {
        console.error('[Subject Selection] Failed to fetch existing selections:', response.status);
        // Continue with empty selection - don't block page
        setSelectedSubjectIds([]);
      }
    } catch (error) {
      console.error('[Subject Selection] Error fetching selected subjects:', error);
      // Continue with empty selection - don't block page
      setSelectedSubjectIds([]);
    }
  };

  const handleDialogSave = async (data: { subjectIds: number[]; subjectNames: string[] }) => {
    try {
      setSaving(true);
      
      // Validate before sending
      if (data.subjectIds.length < 7) {
        toast.error('Please select at least 7 subjects');
        return;
      }
      if (data.subjectIds.length > 15) {
        toast.error('Maximum 15 subjects allowed');
        return;
      }
      
      // For existing users, use the regular API
      const response = await safeApiFetch('/api/freelancer/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          domainIds: data.subjectIds, // API expects domainIds but they're actually subject IDs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Subject Selection] Failed to save subjects:', errorData);
        
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        
        const errorMessage = errorData.error || `Failed to save (${response.status})`;
        toast.error(errorMessage);
        // Don't re-open dialog on error - let user try again manually
        return;
      }

      // Update state with saved data
      setSelectedSubjectIds(data.subjectIds);
      setSelectedSubjectNames(data.subjectNames);
      setSubjectDialogOpen(false); // Close dialog on success
      setAutoPrompted(true); // Prevent auto-opening again
      toast.success('Subject preferences updated successfully!');
    } catch (error) {
      console.error('[Subject Selection] Error saving subjects:', error);
      toast.error((error as Error).message || 'Failed to save subject preferences. Please try again.');
      // Don't re-open dialog - let user click "Edit Subjects" if they want to try again
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!requirementMet) {
      toast.error('Please select 7-15 subjects before continuing');
      return;
    }
    
    // For existing users, just redirect back to dashboard
    // (New registrations should use /register/freelancer/subjects instead)
    toast.success('Subject preferences saved! Redirecting to dashboard...');
    router.push('/freelancer/dashboard');
  };

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (initializing) {
        console.warn('[Subject Selection] Initialization taking too long, forcing render');
        setInitializing(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [initializing]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
          <p className="text-gray-600">Loading your subject preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-lg">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Update Your Subject Areas
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Select 7-15 subjects you're confident delivering to receive matching job assignments.
          </p>
        </div>

        <Card className="shadow-xl border-orange-100">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
              <BookOpen className="w-5 h-5 text-orange-600" />
              Subject Preferences
            </CardTitle>
            <CardDescription>
              {requirementMet
                ? 'Perfect! Click "Continue to Dashboard" below when ready.'
                : 'Select at least 7 subjects (max 15) to start receiving job assignments.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl border
                ${requirementMet
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-6 h-6 ${requirementMet ? 'text-emerald-600' : 'text-amber-600'}`}
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {requirementMet ? 'Requirement Met' : 'Action Needed'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Selected {selectedSubjectIds.length} / 15 subjects
                  </p>
                </div>
              </div>
              {!requirementMet && (
                <p className="text-sm text-gray-700">
                  Add {Math.max(0, 7 - selectedSubjectIds.length)} more subject{Math.max(0, 7 - selectedSubjectIds.length) === 1 ? '' : 's'} to reach the minimum of 7.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-medium text-gray-700">Current selections ({selectedSubjectNames.length})</p>
              </div>
              {selectedSubjectNames.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedSubjectNames.map((name) => (
                    <Badge key={name} variant="secondary" className="bg-white border border-orange-200 text-gray-800">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-500">
                  No subjects selected yet. Click "Select Subjects" to get started.
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-dashed border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Tips for better matches
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p> Choose subjects you can confidently deliver under tight deadlines.</p>
                  <p> Technical subjects attract higher CPP bonuses.</p>
                  <p> Update selections anytime as your expertise grows.</p>
                </CardContent>
              </Card>
              <Card className="border-dashed border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Matching rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p> Assignments only appear if they match your subjects.</p>
                  <p> Selecting fewer than 7 subjects limits potential invites.</p>
                  <p> We'll notify you once relevant jobs are available.</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setSubjectDialogOpen(true)}
                className="order-2 sm:order-1"
              >
                Edit Subjects
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!requirementMet || saving}
                className="order-1 sm:order-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Continue to Dashboard
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          Need help choosing subjects? Email <a href="mailto:admn@tasklynk.co.ke" className="text-orange-600 hover:underline">admn@tasklynk.co.ke</a>
        </div>
      </div>

      <SubjectSelectionDialogEnhanced
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        selectedSubjectIds={selectedSubjectIds}
        onSave={async (data) => {
          await handleDialogSave({
            subjectIds: data.subjectIds,
            subjectNames: data.subjectNames,
          });
        }}
        mode="subjects-only"
      />
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main page component - no longer needs Suspense since we removed useSearchParams
export default function FreelancerSubjectSelectionPage() {
  return <FreelancerSubjectSelectionContent />;
}
