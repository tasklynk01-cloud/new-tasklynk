"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';

// Force dynamic rendering for this page (uses search params)
export const dynamic = 'force-dynamic';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

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
function RegisterFreelancerAvailabilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilitySaved, setAvailabilitySaved] = useState(false);

  const email = searchParams.get('email');

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    if (!email) {
      toast.error('Invalid registration flow. Please start registration again.');
      router.push('/register/freelancer');
      return;
    }

    // Load previously saved availability from sessionStorage if available
    try {
      const savedAvailability = sessionStorage.getItem('pending_availability');
      if (savedAvailability) {
        const parsed = JSON.parse(savedAvailability);
        if (parsed.days && Array.isArray(parsed.days)) {
          setSelectedDays(parsed.days);
          setAvailabilitySaved(true);
        }
      }
    } catch (error) {
      console.warn('[Registration Availability] Error loading saved availability:', error);
    }

    setInitializing(false);
  }, [email, router]);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
    setAvailabilitySaved(false); // Reset saved status when changed
  };

  const handleSave = () => {
    if (typeof window === 'undefined') return;

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day of availability');
      return;
    }

    // Save to sessionStorage
    const availabilityData = {
      days: selectedDays,
      savedAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem('pending_availability', JSON.stringify(availabilityData));
      setAvailabilitySaved(true);
      toast.success(`Availability saved! ${selectedDays.length} day(s) selected.`);
    } catch (error) {
      console.error('[Registration Availability] Error saving availability:', error);
      toast.error('Failed to save availability. Please try again.');
    }
  };

  const handleContinue = () => {
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day of availability to continue');
      return;
    }

    // Ensure availability is saved
    if (!availabilitySaved) {
      handleSave();
    }

    // Ensure data is in sessionStorage
    const availabilityData = {
      days: selectedDays,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem('pending_availability', JSON.stringify(availabilityData));

    // Redirect to subject selection
    toast.success('Redirecting to subject selection...');
    router.push(`/register/freelancer/subjects?email=${encodeURIComponent(email!)}`);
  };

  const handleBack = () => {
    router.push(`/register/freelancer`);
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Select your availability"
      subtitle="Choose the days you'll be available to work. You can update this anytime."
      width="lg"
      backHref="/register/freelancer"
      backLabel="Back"
    >
      <StepIndicator current={1} />

      <div className="mt-4 space-y-6">
        <div
          className={
            'flex items-start gap-3 rounded-2xl border p-4 ' +
            (selectedDays.length > 0
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-[#FF7A3D]/30 bg-[#FF7A3D]/10')
          }
        >
          <CheckCircle2
            className={'mt-0.5 size-5 shrink-0 ' + (selectedDays.length > 0 ? 'text-emerald-500 font-bold' : 'text-[#FF7A3D] font-bold')}
          />
          <div className="text-sm">
            <p className="font-black text-[#22183D] dark:text-white">
              {selectedDays.length > 0 ? 'Days selected' : 'No days selected'}
            </p>
            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mt-0.5">
              {selectedDays.length === 0
                ? 'Select at least one day to continue'
                : `${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'} selected${
                    availabilitySaved ? ' · Saved' : ''
                  }`}
            </p>
          </div>
        </div>

        <div>
          <Label className="mb-3 block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] uppercase tracking-wide">
            Available days
          </Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <div
                  key={day.id}
                  className={
                    'flex cursor-pointer items-center gap-2.5 rounded-2xl border p-3.5 transition-all ' +
                    (isSelected
                      ? 'border-[#5B3594] bg-[#5B3594]/10 dark:bg-[#5B3594]/20 shadow-sm'
                      : 'border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] hover:border-[#5B3594]')
                  }
                  onClick={() => handleDayToggle(day.id)}
                >
                  <Checkbox
                    id={day.id}
                    checked={isSelected}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={day.id} className="flex-1 cursor-pointer">
                    <div className="text-sm font-bold text-[#22183D] dark:text-white leading-tight">{day.label}</div>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDays.length > 0 && (
          <div className="rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#FAF8FD] dark:bg-[#1D1533] p-4">
            <p className="mb-2.5 text-xs font-bold text-[#6B627A] dark:text-[#DDD3E9]/80 uppercase tracking-wide">
              Selected ({selectedDays.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedDays.map((dayId) => {
                const day = DAYS_OF_WEEK.find((d) => d.id === dayId);
                return (
                  <Badge key={dayId} variant="secondary" className="text-xs font-bold bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] border border-[#DDD3E9] dark:border-[#3A2F5B] px-3 py-1 rounded-full">
                    {day?.label || dayId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={handleBack} className="order-2 sm:order-1 rounded-xl h-11 border-[#DDD3E9] dark:border-[#3A2F5B] font-bold">
            <ArrowLeft className="size-3.5 mr-1" />
            Back
          </Button>
          <div className="order-1 flex gap-2.5 sm:order-2">
            {selectedDays.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || availabilitySaved}
                className="rounded-xl h-11 border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Saving...
                  </>
                ) : availabilitySaved ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-500 mr-1" />
                    Saved
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={selectedDays.length === 0 || saving}
              size="lg"
              className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-[#FF7A3D]/25"
            >
              Next: Subjects
              <ArrowRight className="size-3.5 ml-1" />
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
export default function RegisterFreelancerAvailabilityPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterFreelancerAvailabilityContent />
    </Suspense>
  );
}
