"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  CheckCircle, 
  Loader2, 
  X,
  AlertCircle,
  Code,
  Briefcase,
  Wrench,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

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

interface SubjectSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubjectIds: number[];
  selectedSoftwareIds?: number[];
  selectedServiceIds?: number[];
  selectedSkills?: string[];
  onSave: (data: {
    subjectIds: number[];
    subjectNames: string[];
    softwareIds?: number[];
    softwareNames?: string[];
    serviceIds?: number[];
    serviceNames?: string[];
    skills?: string[];
  }) => void | Promise<void>;
  mode?: 'subjects-only' | 'full'; // 'subjects-only' for registration, 'full' for settings
}

export function SubjectSelectionDialogEnhanced({
  open,
  onOpenChange,
  selectedSubjectIds,
  selectedSoftwareIds = [],
  selectedServiceIds = [],
  selectedSkills = [],
  onSave,
  mode = 'full',
}: SubjectSelectionDialogProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('subjects');

  // Local state for selections
  const [localSubjectIds, setLocalSubjectIds] = useState<number[]>(selectedSubjectIds);
  const [localSoftwareIds, setLocalSoftwareIds] = useState<number[]>(selectedSoftwareIds);
  const [localServiceIds, setLocalServiceIds] = useState<number[]>(selectedServiceIds);
  const [localSkills, setLocalSkills] = useState<string[]>(selectedSkills);

  // Fetch data from API
  useEffect(() => {
    if (open) {
      fetchData();
      setLocalSubjectIds(selectedSubjectIds);
      setLocalSoftwareIds(selectedSoftwareIds);
      setLocalServiceIds(selectedServiceIds);
      setLocalSkills(selectedSkills);
      setSearchQuery('');
      setSelectedLetter(null);
    }
  }, [open, selectedSubjectIds, selectedSoftwareIds, selectedServiceIds, selectedSkills]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/freelancer/skills/options');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSubjects(Array.isArray(data.data.subjects) ? data.data.subjects : []);
          setSoftware(Array.isArray(data.data.software) ? data.data.software : []);
          setServices(Array.isArray(data.data.services) ? data.data.services : []);
          
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
          setSubjects([]);
          setSoftware([]);
          setServices([]);
          setSkills([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load options');
      setSubjects([]);
      setSoftware([]);
      setServices([]);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on search & selected letter
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = selectedLetter ? s.name.toUpperCase().startsWith(selectedLetter) : true;
      return matchesSearch && matchesLetter;
    });
  }, [subjects, searchQuery, selectedLetter]);

  const filteredSoftware = useMemo(() => {
    return software.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = selectedLetter ? s.name.toUpperCase().startsWith(selectedLetter) : true;
      return matchesSearch && matchesLetter;
    });
  }, [software, searchQuery, selectedLetter]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = selectedLetter ? s.name.toUpperCase().startsWith(selectedLetter) : true;
      return matchesSearch && matchesLetter;
    });
  }, [services, searchQuery, selectedLetter]);

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = selectedLetter ? s.name.toUpperCase().startsWith(selectedLetter) : true;
      return matchesSearch && matchesLetter;
    });
  }, [skills, searchQuery, selectedLetter]);

  // Group items by first letter
  const groupByLetter = <T extends { id: any; name: string }>(items: T[]) => {
    return items.reduce((acc, item) => {
      const letter = item.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const groupedSubjects = useMemo(() => groupByLetter(filteredSubjects), [filteredSubjects]);
  const groupedSoftware = useMemo(() => groupByLetter(filteredSoftware), [filteredSoftware]);
  const groupedServices = useMemo(() => groupByLetter(filteredServices), [filteredServices]);

  // Available unique letters for quick alphabet jumps in current tab
  const availableLetters = useMemo(() => {
    let source: { name: string }[] = [];
    if (activeTab === 'subjects') source = subjects;
    else if (activeTab === 'software') source = software;
    else if (activeTab === 'services') source = services;
    else if (activeTab === 'skills') source = skills;

    const letters = new Set<string>();
    source.forEach(item => {
      if (item.name && item.name.length > 0) {
        letters.add(item.name.charAt(0).toUpperCase());
      }
    });
    return Array.from(letters).sort();
  }, [activeTab, subjects, software, services, skills]);

  const toggleSubject = (id: number) => {
    setLocalSubjectIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 15) {
        toast.error('Maximum 15 subjects allowed');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleSoftware = (id: number) => {
    setLocalSoftwareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const toggleService = (id: number) => {
    setLocalServiceIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const toggleSkill = (skill: string) => {
    setLocalSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      return [...prev, skill];
    });
  };

  const clearAll = () => {
    if (activeTab === 'subjects') setLocalSubjectIds([]);
    if (activeTab === 'software') setLocalSoftwareIds([]);
    if (activeTab === 'services') setLocalServiceIds([]);
    if (activeTab === 'skills') setLocalSkills([]);
  };

  const handleSave = async () => {
    if (localSubjectIds.length < 7) {
      toast.error('Please select at least 7 subjects');
      return;
    }
    if (localSubjectIds.length > 15) {
      toast.error('Maximum 15 subjects allowed');
      return;
    }

    setSaving(true);

    const selectedSubjectNames = subjects.filter(s => localSubjectIds.includes(s.id)).map(s => s.name);
    const selectedSoftwareNames = software.filter(s => localSoftwareIds.includes(s.id)).map(s => s.name);
    const selectedServiceNames = services.filter(s => localServiceIds.includes(s.id)).map(s => s.name);

    try {
      await Promise.resolve(
        onSave({
          subjectIds: localSubjectIds,
          subjectNames: selectedSubjectNames,
          softwareIds: mode === 'full' ? localSoftwareIds : undefined,
          softwareNames: mode === 'full' ? selectedSoftwareNames : undefined,
          serviceIds: mode === 'full' ? localServiceIds : undefined,
          serviceNames: mode === 'full' ? selectedServiceNames : undefined,
          skills: mode === 'full' ? localSkills : undefined,
        })
      );

      toast.success(`Selections saved successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save selections:', error);
      toast.error('Failed to save selections');
    } finally {
      setSaving(false);
    }
  };

  const renderGroupedItems = <T extends { id: any; name: string }>(
    grouped: Record<string, T[]>,
    selected: any[],
    onToggle: (id: any) => void,
    type: 'subjects' | 'software' | 'services' | 'skills'
  ) => {
    const sortedLetters = Object.keys(grouped).sort();
    
    return (
      <div className="space-y-4 pb-4">
        {sortedLetters.map((letter) => {
          const items = grouped[letter];
          if (!items || !Array.isArray(items) || items.length === 0) return null;
          
          return (
            <div key={letter} id={`letter-group-${letter}`} className="space-y-2">
              <div className="sticky top-0 bg-background/95 dark:bg-[#1E1633]/95 backdrop-blur-md py-1.5 mb-2 z-10 -mx-1 px-2 border-b border-border/40 flex items-center justify-between">
                <Badge variant="outline" className="font-bold text-xs bg-muted/70 px-2 py-0.5">
                  {letter}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {items.length} {type}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item) => {
                  if (!item || !item.id || !item.name) return null;
                  
                  const isSelected = type === 'skills' 
                    ? selected.includes(item.name)
                    : selected.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all min-h-[46px] select-none ${
                        isSelected
                          ? 'border-[#5B3594] bg-[#5B3594]/10 dark:bg-[#5B3594]/20 shadow-xs ring-1 ring-[#5B3594]/50'
                          : 'border-border/70 hover:border-[#5B3594]/50 hover:bg-muted/50'
                      }`}
                      onClick={() => onToggle(type === 'skills' ? item.name : item.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle(type === 'skills' ? item.name : item.id)}
                        className="pointer-events-none shrink-0"
                      />
                      <span className="flex-1 text-xs sm:text-sm font-medium leading-snug break-words">
                        {item.name}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#5B3594] dark:text-[#FFA06E] shrink-0" />}
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[92vh] sm:h-[88vh] flex flex-col p-4 sm:p-6 overflow-hidden w-[calc(100vw-1rem)] sm:w-full rounded-2xl bg-card border border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 pb-2 sm:pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-foreground">
              <BookOpen className="w-5 h-5 text-[#FF7A3D] shrink-0" />
              <span>{mode === 'subjects-only' ? 'Select Your Subjects' : 'Select Your Expertise & Capabilities'}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {mode === 'subjects-only'
              ? 'Choose 7-15 subjects you specialize in. You can modify this later in your settings.'
              : 'Configure your primary academic subjects (7-15 required), software tools, services, and skills.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs & Controls */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedLetter(null); }} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 shrink-0 h-auto py-1 sm:py-1.5 mt-2 bg-muted/60 rounded-xl">
            <TabsTrigger value="subjects" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Subjects</span>
              {localSubjectIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 text-[10px] px-1.5 font-bold">
                  {localSubjectIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="software" disabled={mode === 'subjects-only'} className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Code className="w-3.5 h-3.5 shrink-0" />
              <span>Software</span>
              {localSoftwareIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 text-[10px] px-1.5 font-bold">
                  {localSoftwareIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" disabled={mode === 'subjects-only'} className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>Services</span>
              {localServiceIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 text-[10px] px-1.5 font-bold">
                  {localServiceIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="skills" disabled={mode === 'subjects-only'} className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Star className="w-3.5 h-3.5 shrink-0" />
              <span>Skills</span>
              {localSkills.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 text-[10px] px-1.5 font-bold">
                  {localSkills.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search, Status & Alphabet Navigation */}
          <div className="shrink-0 space-y-2 mt-2.5">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search all ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 sm:h-10 text-xs sm:text-sm rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clearAll} className="h-9 sm:h-10 text-xs rounded-xl">
                  Clear {activeTab}
                </Button>
              </div>
            </div>

            {/* Quick Alphabet Filter Pills */}
            {availableLetters.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedLetter(null)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                    selectedLetter === null
                      ? 'bg-[#5B3594] text-white shadow-xs'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  All ({activeTab === 'subjects' ? subjects.length : activeTab === 'software' ? software.length : activeTab === 'services' ? services.length : skills.length})
                </button>
                {availableLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                    className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-all shrink-0 ${
                      selectedLetter === letter
                        ? 'bg-[#5B3594] text-white shadow-xs'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}

            {/* Progress Requirement Indicator for Subjects */}
            {activeTab === 'subjects' && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                localSubjectIds.length >= 7 && localSubjectIds.length <= 15
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  {localSubjectIds.length >= 7 && localSubjectIds.length <= 15 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {localSubjectIds.length >= 7 && localSubjectIds.length <= 15
                      ? `Requirement met: ${localSubjectIds.length} of 7-15 subjects selected`
                      : `Select 7-15 subjects (${localSubjectIds.length} currently selected • ${Math.max(0, 7 - localSubjectIds.length)} more required)`}
                  </span>
                </div>
                <span className="text-[11px] font-bold">
                  Showing {filteredSubjects.length} of {subjects.length} subjects
                </span>
              </div>
            )}
          </div>

          {/* Scrollable Tab Content: NATIVE SMOOTH SCROLLING */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 mt-3 focus:outline-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#5B3594]" />
                <span className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading options...</span>
              </div>
            ) : (
              <>
                <TabsContent value="subjects" className="mt-0 focus-visible:outline-none">
                  {filteredSubjects.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No subjects found matching your criteria.</p>
                      {(searchQuery || selectedLetter) && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => { setSearchQuery(''); setSelectedLetter(null); }}
                          className="mt-1 text-xs text-[#5B3594]"
                        >
                          Clear filters &amp; view all {subjects.length} subjects
                        </Button>
                      )}
                    </div>
                  ) : (
                    renderGroupedItems(groupedSubjects, localSubjectIds, toggleSubject, 'subjects')
                  )}
                </TabsContent>

                <TabsContent value="software" className="mt-0 focus-visible:outline-none">
                  {filteredSoftware.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No software tools found.</p>
                    </div>
                  ) : (
                    renderGroupedItems(groupedSoftware, localSoftwareIds, toggleSoftware, 'software')
                  )}
                </TabsContent>

                <TabsContent value="services" className="mt-0 focus-visible:outline-none">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No services found.</p>
                    </div>
                  ) : (
                    renderGroupedItems(groupedServices, localServiceIds, toggleService, 'services')
                  )}
                </TabsContent>

                <TabsContent value="skills" className="mt-0 focus-visible:outline-none">
                  {filteredSkills.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No skills found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-4">
                      {filteredSkills.map((skill) => {
                        if (!skill || !skill.id || !skill.name) return null;
                        
                        const isSelected = localSkills.includes(skill.name);
                        return (
                          <div
                            key={skill.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all min-h-[46px] select-none ${
                              isSelected
                                ? 'border-[#5B3594] bg-[#5B3594]/10 dark:bg-[#5B3594]/20 shadow-xs ring-1 ring-[#5B3594]/50'
                                : 'border-border/70 hover:border-[#5B3594]/50 hover:bg-muted/50'
                            }`}
                            onClick={() => toggleSkill(skill.name)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSkill(skill.name)}
                              className="pointer-events-none shrink-0"
                            />
                            <span className="flex-1 text-xs sm:text-sm font-medium truncate">{skill.name}</span>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#5B3594] dark:text-[#FFA06E] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 pt-3 border-t border-border/50 mt-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {localSubjectIds.length < 7
              ? `Select at least ${7 - localSubjectIds.length} more subject${7 - localSubjectIds.length === 1 ? '' : 's'}`
              : localSubjectIds.length > 15
              ? `Too many: remove ${localSubjectIds.length - 15}`
              : `✓ Requirements satisfied (${localSubjectIds.length} subjects)`}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-xs sm:text-sm h-9 sm:h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || localSubjectIds.length < 7 || localSubjectIds.length > 15}
              className="bg-[#5B3594] hover:bg-[#482878] text-white font-bold text-xs sm:text-sm h-9 sm:h-10 rounded-xl shadow-md min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  <span>Save Selections</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
