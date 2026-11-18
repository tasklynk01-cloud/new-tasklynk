"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type FileClassification = 
  // New classification names (from file-upload-popup.tsx)
  | 'completed_paper'
  | 'completed_smart_paper'
  | 'revision_file'
  | 'plagiarism_report'
  | 'ai_report'
  | 'detailed_outline'
  | 'graphics_tables'
  | 'printable_source'
  // Legacy classification names (for backward compatibility)
  | 'final_paper'
  | 'plag_report'
  | 'printable_sources'
  | 'graphics'
  | 'tables'
  | 'abstract'
  | 'outline'
  | 'revision'
  | 'draft'
  | 'other';

export interface ClassifiedFile {
  file: File;
  classification: FileClassification | null;
}

interface FileUploadWithClassificationProps {
  onFilesSelected?: (files: ClassifiedFile[]) => void;
  files?: ClassifiedFile[];
  onChange?: (files: ClassifiedFile[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  existingFiles?: ClassifiedFile[];
}

const FILE_TYPE_LABELS: Record<FileClassification, string> = {
  // New classifications (from file-upload-popup.tsx)
  completed_paper: 'Completed Paper',
  completed_smart_paper: 'Completed Smart Paper',
  revision_file: 'Revision File',
  plagiarism_report: 'Plagiarism Report',
  ai_report: 'AI Detection Report',
  detailed_outline: 'Detailed Outline',
  graphics_tables: 'Graphics & Tables',
  printable_source: 'Printable Source',
  // Legacy classifications
  final_paper: 'Final Paper/Document',
  plag_report: 'Plagiarism Report',
  printable_sources: 'Printable Sources',
  graphics: 'Graphics/Images',
  tables: 'Tables/Charts',
  abstract: 'Abstract',
  outline: 'Outline',
  revision: 'Revision',
  draft: 'Draft',
  other: 'Other',
};

const FILE_TYPE_COLORS: Record<FileClassification, string> = {
  // New classifications
  completed_paper: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  completed_smart_paper: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  revision_file: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
  plagiarism_report: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  detailed_outline: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300',
  graphics_tables: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  printable_source: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
  // Legacy classifications
  final_paper: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  plag_report: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  ai_report: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  printable_sources: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
  graphics: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  tables: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  abstract: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
  outline: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300',
  revision: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
  draft: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300',
  other: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300',
};

export function FileUploadWithClassification({
  onFilesSelected,
  files: controlledFiles,
  onChange,
  maxFiles = 10,
  accept = '*',
  disabled = false,
  existingFiles = [],
}: FileUploadWithClassificationProps) {
  // Support both controlled (files/onChange) and uncontrolled (onFilesSelected) patterns
  const [internalFiles, setInternalFiles] = useState<ClassifiedFile[]>(existingFiles);
  
  // Use controlled files if provided, otherwise use internal state
  const classifiedFiles = controlledFiles ?? internalFiles;
  
  const updateFiles = (newFiles: ClassifiedFile[]) => {
    // Update internal state for uncontrolled mode
    setInternalFiles(newFiles);
    // Call the appropriate callback
    if (onChange) {
      onChange(newFiles);
    }
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (classifiedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: ClassifiedFile[] = files.map(file => ({
      file,
      classification: null,
    }));

    const updated = [...classifiedFiles, ...newFiles];
    updateFiles(updated);
    
    // Clear input
    e.target.value = '';
  };

  const handleClassificationChange = (index: number, classification: FileClassification) => {
    const updated = [...classifiedFiles];
    updated[index] = { ...updated[index], classification };
    updateFiles(updated);
  };

  const handleRemoveFile = (index: number) => {
    const updated = classifiedFiles.filter((_, i) => i !== index);
    updateFiles(updated);
  };

  const allFilesClassified = classifiedFiles.every(f => f.classification !== null);
  const hasFiles = classifiedFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="flex items-center gap-3">
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || classifiedFiles.length >= maxFiles}
          className="hidden"
          id="file-upload-classified"
        />
        <label htmlFor="file-upload-classified">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || classifiedFiles.length >= maxFiles}
            className="cursor-pointer"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </span>
          </Button>
        </label>
        {hasFiles && (
          <span className="text-sm text-muted-foreground">
            {classifiedFiles.length} / {maxFiles} files selected
          </span>
        )}
      </div>

      {/* File List with Classification */}
      {hasFiles && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Classify each file:</Label>
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
            {classifiedFiles.map((classifiedFile, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  classifiedFile.classification
                    ? 'bg-background border-primary/20'
                    : 'bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800'
                }`}
              >
                {/* File Icon & Name */}
                <div className="flex-shrink-0 pt-1">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Filename */}
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium truncate">
                      {classifiedFile.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({(classifiedFile.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  {/* Classification Dropdown */}
                  <div className="flex items-center gap-3">
                    <Select
                      value={classifiedFile.classification || ''}
                      onValueChange={(value) => handleClassificationChange(index, value as FileClassification)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full max-w-xs">
                        <SelectValue placeholder="Select file type *" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="final_paper">📄 Final Paper/Document</SelectItem>
                        <SelectItem value="plag_report">🔍 Plagiarism Report</SelectItem>
                        <SelectItem value="ai_report">🤖 AI Detection Report</SelectItem>
                        <SelectItem value="printable_sources">📚 Printable Sources</SelectItem>
                        <SelectItem value="graphics">🎨 Graphics/Images</SelectItem>
                        <SelectItem value="tables">📊 Tables/Charts</SelectItem>
                        <SelectItem value="abstract">📝 Abstract</SelectItem>
                        <SelectItem value="outline">📋 Outline</SelectItem>
                        <SelectItem value="revision">🔄 Revision</SelectItem>
                        <SelectItem value="draft">✏️ Draft</SelectItem>
                        <SelectItem value="other">📎 Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Badge Preview */}
                    {classifiedFile.classification && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${FILE_TYPE_COLORS[classifiedFile.classification]}`}
                      >
                        {FILE_TYPE_LABELS[classifiedFile.classification]}
                      </Badge>
                    )}
                  </div>

                  {/* Warning if not classified */}
                  {!classifiedFile.classification && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Please select a file type
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Validation Message */}
          {!allFilesClassified && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-lg">
              <Loader2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please classify all files before uploading. All fields marked with * are required.
              </p>
            </div>
          )}

          {allFilesClassified && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 rounded-lg">
              <span className="text-green-600 text-sm">✓</span>
              <p className="text-sm text-green-800 dark:text-green-200">
                All files classified! Ready to upload.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export helper function for getting badge color
export function getFileTypeBadgeColor(fileType: FileClassification | string): string {
  return FILE_TYPE_COLORS[fileType as FileClassification] || FILE_TYPE_COLORS.other;
}

// Export helper function for getting label
export function getFileTypeLabel(fileType: FileClassification | string): string {
  // Handle known types
  if (fileType in FILE_TYPE_LABELS) {
    return FILE_TYPE_LABELS[fileType as FileClassification];
  }
  // Convert unknown types to readable format (e.g., "some_type" -> "Some Type")
  return fileType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Badge component for displaying file types
interface FileTypeBadgeProps {
  fileType: FileClassification | string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function FileTypeBadge({ fileType, size = 'sm', showTooltip = true }: FileTypeBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const colorClass = getFileTypeBadgeColor(fileType);
  const label = getFileTypeLabel(fileType);

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClasses[size]}`}
      title={showTooltip ? label : undefined}
    >
      {label}
    </Badge>
  );
}
