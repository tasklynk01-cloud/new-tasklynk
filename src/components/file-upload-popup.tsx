"use client";

import { useId, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FileText, Loader2, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export type FileClassification =
  | 'completed_paper'
  | 'completed_smart_paper'
  | 'revision_file'
  | 'draft'
  | 'plagiarism_report'
  | 'ai_report'
  | 'abstract'
  | 'detailed_outline'
  | 'graphics_tables'
  | 'printable_source'
  | 'other';

export interface ClassifiedUploadFile {
  file: File;
  classification: FileClassification;
  id: string;
}

interface FileUploadPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (uploadedFiles: { url: string; name: string; size: number; mimeType: string; classification: FileClassification }[]) => void;
  jobId: number;
  title?: string;
  userRole?: 'freelancer' | 'admin' | 'manager';
  allowedClassifications?: FileClassification[];
}

const classificationLabels: Record<FileClassification, string> = {
  completed_paper: 'Completed Paper / Document',
  completed_smart_paper: 'Completed Smart Paper',
  revision_file: 'Revision File',
  draft: 'Draft Submission',
  plagiarism_report: 'Turnitin / Plagiarism Report',
  ai_report: 'AI Detection Report',
  abstract: '1-Page Abstract',
  detailed_outline: 'Detailed Outline',
  graphics_tables: 'Graphics & Tables / SPSS Output',
  printable_source: 'Printable Source',
  other: 'Supporting Attachment',
};

function autoDetectClassification(filename: string): FileClassification {
  const lower = filename.toLowerCase();
  if (lower.includes('plag') || lower.includes('turnitin') || lower.includes('similarity')) {
    return 'plagiarism_report';
  }
  if (lower.includes('ai_') || lower.includes('ai-') || lower.includes('detector') || lower.includes('zeroai')) {
    return 'ai_report';
  }
  if (lower.includes('revision') || lower.includes('corrected') || lower.includes('v2')) {
    return 'revision_file';
  }
  if (lower.includes('outline')) {
    return 'detailed_outline';
  }
  if (lower.includes('abstract')) {
    return 'abstract';
  }
  if (lower.endsWith('.spv') || lower.endsWith('.sav') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return 'graphics_tables';
  }
  return 'completed_paper';
}

export function FileUploadPopup({
  open,
  onOpenChange,
  onUploadComplete,
  jobId,
  title = 'Upload Files',
  userRole = 'freelancer',
  allowedClassifications,
}: FileUploadPopupProps) {
  const [files, setFiles] = useState<ClassifiedUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classificationOptions = useMemo(() => {
    if (allowedClassifications && allowedClassifications.length > 0) {
      return allowedClassifications;
    }
    return Object.keys(classificationLabels) as FileClassification[];
  }, [allowedClassifications]);

  const resetState = () => {
    setFiles([]);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (uploading) {
      toast.warning('Please wait for the file upload to complete');
      return;
    }
    resetState();
    onOpenChange(false);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const newClassifiedFiles: ClassifiedUploadFile[] = selectedFiles.map((file) => ({
      file,
      classification: autoDetectClassification(file.name),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setFiles((prev) => [...prev, ...newClassifiedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClassificationChange = (id: string, classification: FileClassification) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, classification } : f))
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const uploadedResults: {
        url: string;
        name: string;
        size: number;
        mimeType: string;
        classification: FileClassification;
      }[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('jobId', String(jobId));
        formData.append('folder', 'tasklynk/job-files');

        // Upload binary only; the parent (onUploadComplete) persists metadata
        // via the v2 order upload endpoints to avoid duplicate DB records.
        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errData.error || `Failed to upload ${item.file.name}`);
        }

        const data = await response.json();
        if (!data?.url) {
          throw new Error(`Upload of ${item.file.name} returned no file URL`);
        }
        uploadedResults.push({
          url: data.url,
          name: item.file.name,
          size: item.file.size,
          mimeType: item.file.type || 'application/octet-stream',
          classification: item.classification,
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 90));
      }

      setUploadProgress(100);
      toast.success(`${uploadedResults.length} file(s) attached successfully`);
      onUploadComplete(uploadedResults);
      handleClose();
    } catch (err: any) {
      console.error('[FileUploadPopup] Upload error:', err);
      toast.error(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drag & Drop Area */}
          <label
            htmlFor={fileInputId}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all duration-200 group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">
              Click to select files or drag &amp; drop
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              DOCX, PDF, PPTX, XLSX, ZIP, or SPSS files (Max 50MB)
            </p>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelection}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {/* Staged Files Preview */}
          {files.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Attached Files ({files.length})
              </span>
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{item.file.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {/* Classification Dropdown with Smart Auto-Detection */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.classification}
                      onValueChange={(val) => handleClassificationChange(item.id, val as FileClassification)}
                      disabled={uploading}
                    >
                      <SelectTrigger className="h-8 text-xs w-44 rounded-lg bg-background border-border">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationOptions.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {classificationLabels[opt] || opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      disabled={uploading}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Quick Quality Verification Tools */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Need to audit your draft?</span>
            <div className="flex items-center gap-2">
              <a
                href="https://humaragpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>HumaraGPT AI Humanizer ↗</span>
              </a>
              <span>•</span>
              <a
                href="https://plagcheck.kingpin.co.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>PlagCheck Turnitin ↗</span>
              </a>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
            className="rounded-xl h-10 text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-10 px-5 text-xs shadow-md shadow-primary/25"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Upload &amp; Attach {files.length > 0 ? `(${files.length})` : ''}</span>
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
