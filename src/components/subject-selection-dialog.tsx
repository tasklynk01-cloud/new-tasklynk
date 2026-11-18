"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Search, 
  CheckCircle, 
  Loader2, 
  X,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: number;
  name: string;
}

interface SubjectSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubjectIds: number[];
  onSave: (subjectIds: number[], subjectNames: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
}

export function SubjectSelectionDialog({
  open,
  onOpenChange,
  selectedSubjectIds,
  onSave,
  maxSelections = 10,
  minSelections = 1,
}: SubjectSelectionDialogProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedSubjectIds);
  const [saving, setSaving] = useState(false);

  // Fetch subjects from API
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      // Try the freelancer skills options endpoint first (has subjects, software, services)
      const response = await fetch('/api/freelancer/skills/options');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.subjects) {
          setSubjects(data.data.subjects);
          return;
        }
      }

      // Fallback to domains API
      const domainsResponse = await fetch('/api/domains?status=active');
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        // The API returns an array directly or { domains: [...] }
        const domainsList = Array.isArray(domainsData) ? domainsData : domainsData.domains || [];
        setSubjects(domainsList.map((d: any) => ({ id: d.id, name: d.name })));
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSubjects();
      setLocalSelectedIds(selectedSubjectIds);
    }
  }, [open, fetchSubjects, selectedSubjectIds]);

  // Filter subjects based on search
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group subjects by first letter
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const firstLetter = subject.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const sortedLetters = Object.keys(groupedSubjects).sort();

  const toggleSubject = (subjectId: number) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      }
      if (prev.length >= maxSelections) {
        toast.error(`Maximum ${maxSelections} subjects allowed`);
        return prev;
      }
      return [...prev, subjectId];
    });
  };

  const selectAll = () => {
    const allIds = filteredSubjects.slice(0, maxSelections).map((s) => s.id);
    setLocalSelectedIds(allIds);
  };

  const clearAll = () => {
    setLocalSelectedIds([]);
  };

  const handleSave = () => {
    if (localSelectedIds.length < minSelections) {
      toast.error(`Please select at least ${minSelections} subject${minSelections > 1 ? 's' : ''}`);
      return;
    }

    setSaving(true);
    
    // Get the names of selected subjects
    const selectedNames = subjects
      .filter((s) => localSelectedIds.includes(s.id))
      .map((s) => s.name);

    // Small delay for visual feedback
    setTimeout(() => {
      onSave(localSelectedIds, selectedNames);
      setSaving(false);
      onOpenChange(false);
      toast.success(`${localSelectedIds.length} subject${localSelectedIds.length > 1 ? 's' : ''} selected`);
    }, 300);
  };

  const getSelectedSubjectNames = () => {
    return subjects
      .filter((s) => localSelectedIds.includes(s.id))
      .map((s) => s.name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[88vh] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            Select Your Subjects
          </DialogTitle>
          <DialogDescription>
            Choose the subjects you specialize in. You can select up to {maxSelections} subjects.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Stats Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={localSelectedIds.length >= minSelections ? "default" : "secondary"}>
              {localSelectedIds.length} / {maxSelections} selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={localSelectedIds.length === 0}>
              Clear
            </Button>
          </div>
        </div>

        {/* Selected Subjects Preview */}
        {localSelectedIds.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Selected:</p>
            <div className="flex flex-wrap gap-1.5">
              {getSelectedSubjectNames().map((name, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => {
                    const subject = subjects.find(s => s.name === name);
                    if (subject) toggleSubject(subject.id);
                  }}
                >
                  {name}
                  <X className="w-4 h-4 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subjects List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 focus:outline-none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading subjects...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No subjects available.</p>
              <p className="text-sm text-muted-foreground">Please contact support.</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No subjects match "{searchQuery}"</p>
              <Button variant="link" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-1 mb-2">
                    <Badge variant="outline" className="font-semibold">
                      {letter}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedSubjects[letter].map((subject) => {
                      const isSelected = localSelectedIds.includes(subject.id);
                      return (
                        <div
                          key={subject.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => toggleSubject(subject.id)}
                        >
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleSubject(subject.id)}
                            className="pointer-events-none"
                          />
                          <Label
                            htmlFor={`subject-${subject.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {subject.name}
                          </Label>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-0 shrink-0 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || localSelectedIds.length < minSelections}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Selection ({localSelectedIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
