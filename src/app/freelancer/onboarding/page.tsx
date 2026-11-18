"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, BookOpen, Code2, Briefcase, Loader2 } from 'lucide-react';

interface SkillOption {
  id: number;
  name: string;
}

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<SkillOption[]>([]);
  const [software, setSoftware] = useState<SkillOption[]>([]);
  const [services, setServices] = useState<SkillOption[]>([]);

  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedSoftware, setSelectedSoftware] = useState<number[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  
  const [otherSoftware, setOtherSoftware] = useState('');
  const [otherService, setOtherService] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!['freelancer', 'writer', 'editor'].includes(user.role)) {
      router.push('/');
      return;
    }

    fetchOptions();
  }, [user, authLoading, router]);

  const fetchOptions = async () => {
    try {
      const response = await safeApiFetch('/api/freelancer/skills/options');
      const data = await response.json();

      if (data.success) {
        setSubjects(data.data.subjects);
        setSoftware(data.data.software);
        setServices(data.data.services);
      } else {
        setError('Failed to load skill options');
      }
    } catch (err) {
      console.error('Error fetching options:', err);
      setError('Failed to load skill options');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjects(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 15) {
        toast.error('Maximum 15 subjects allowed');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleSoftware = (id: number) => {
    setSelectedSoftware(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleService = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedSubjects.length < 7) {
      setError('Please select at least 7 subjects');
      return;
    }

    if (selectedSubjects.length > 15) {
      setError('You can select a maximum of 15 subjects');
      return;
    }

    if (selectedServices.length < 1 && !otherService.trim()) {
      setError('Please select at least 1 service type');
      return;
    }

    setSubmitting(true);

    try {
      const response = await safeApiFetch('/api/freelancer/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subjectIds: selectedSubjects,
          softwareIds: selectedSoftware,
          serviceIds: selectedServices,
          otherSoftware: otherSoftware.trim() || null,
          otherService: otherService.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Skills saved successfully!');
        router.push('/email-verification?userId=' + user?.id);
      } else {
        setError(data.error || 'Failed to save skills');
      }
    } catch (err) {
      console.error('Error saving skills:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#ff8c42] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const subjectValidation = selectedSubjects.length >= 7 && selectedSubjects.length <= 15;
  const serviceValidation = selectedServices.length >= 1 || otherService.trim().length > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Skills & Competencies</h1>
          <p className="text-muted-foreground">
            Help us match you with the right jobs by telling us about your expertise
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>
                    Select your areas of expertise (minimum 7, maximum 15)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={subjectValidation ? "default" : "destructive"} className="text-sm">
                  {selectedSubjects.length}/15 selected
                </Badge>
                {subjectValidation ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-xs text-red-500">
                    {selectedSubjects.length < 7 ? `Select ${7 - selectedSubjects.length} more` : 'Too many selected'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSubjects.includes(subject.id)
                        ? 'bg-[#ff8c42]/10 border-[#ff8c42] text-[#ff8c42]'
                        : 'bg-card border-border hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">{subject.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-4 bg-green-100 rounded-lg">
                  <Code2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Software & Tools</CardTitle>
                  <CardDescription>
                    Select the software and tools you're proficient with (optional)
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="mt-3">
                {selectedSoftware.length} selected
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {software.map((sw) => (
                  <div
                    key={sw.id}
                    onClick={() => toggleSoftware(sw.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSoftware.includes(sw.id)
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-card border-border hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSoftware.includes(sw.id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">{sw.name}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="otherSoftware">Other Software (specify)</Label>
                <Input
                  id="otherSoftware"
                  placeholder="Enter any other software you use..."
                  value={otherSoftware}
                  onChange={(e) => setOtherSoftware(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-4 bg-purple-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Services / Type of Work</CardTitle>
                  <CardDescription>
                    Select the types of work you can deliver (at least 1 required)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={serviceValidation ? "default" : "destructive"}>
                  {selectedServices.length} selected
                </Badge>
                {serviceValidation ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-xs text-red-500">Select at least 1</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-card border-border hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="otherService">Other Service (specify)</Label>
                <Input
                  id="otherService"
                  placeholder="Enter any other services you offer..."
                  value={otherService}
                  onChange={(e) => setOtherService(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {subjectValidation && serviceValidation ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to submit
                </span>
              ) : (
                <span className="text-red-500">
                  Please complete all required sections
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={submitting || !subjectValidation || !serviceValidation}
              className="bg-[#ff8c42] hover:bg-[#e67d3a] text-white px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
