"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Paperclip, X, Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export type FileClassification = 
  | 'final_document'
  | 'completed_paper'
  | 'plagiarism_report'
  | 'ai_report'
  | 'turnitin_report'
  | 'grammarly_report'
  | 'abstract'
  | 'graphics_tables'
  | 'printable_sources'
  | 'references'
  | 'appendix'
  | 'draft'
  | 'revision'
  | 'additional'
  | 'brief'
  | 'instructions';

interface FileWithClassification {
  file: File;
  classification: FileClassification | '';
}

interface EnhancedFileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  uploaderId: number;
  userRole: 'client' | 'freelancer' | 'manager' | 'admin';
  onUploadComplete: () => void;
  maxFiles?: number;
}

// Classification options based on user role
const getClassificationOptions = (role: 'client' | 'freelancer' | 'manager' | 'admin'): { value: FileClassification; label: string }[] => {
  const clientOptions = [
    { value: 'brief' as FileClassification, label: 'Brief/Instructions' },
    { value: 'additional' as FileClassification, label: 'Additional Materials' },
    { value: 'references' as FileClassification, label: 'References' },
    { value: 'printable_sources' as FileClassification, label: 'Printable Sources' },
  ];

  const freelancerOptions = [
    { value: 'final_document' as FileClassification, label: 'Final Document' },
    { value: 'completed_paper' as FileClassification, label: 'Completed Paper' },
    { value: 'plagiarism_report' as FileClassification, label: 'Plagiarism Report' },
    { value: 'ai_report' as FileClassification, label: 'AI Report' },
    { value: 'turnitin_report' as FileClassification, label: 'Turnitin Report' },
    { value: 'grammarly_report' as FileClassification, label: 'Grammarly Report' },
    { value: 'draft' as FileClassification, label: 'Draft Version' },
    { value: 'revision' as FileClassification, label: 'Revision' },
    { value: 'abstract' as FileClassification, label: 'Abstract' },
    { value: 'graphics_tables' as FileClassification, label: 'Graphics/Tables' },
    { value: 'printable_sources' as FileClassification, label: 'Printable Sources' },
    { value: 'references' as FileClassification, label: 'References' },
    { value: 'appendix' as FileClassification, label: 'Appendix' },
    { value: 'additional' as FileClassification, label: 'Additional Files' },
  ];

  const managerAdminOptions = [
    { value: 'final_document' as FileClassification, label: 'Final Document' },
    { value: 'completed_paper' as FileClassification, label: 'Completed Paper' },
    { value: 'plagiarism_report' as FileClassification, label: 'Plagiarism Report' },
    { value: 'ai_report' as FileClassification, label: 'AI Report' },
    { value: 'turnitin_report' as FileClassification, label: 'Turnitin Report' },
    { value: 'grammarly_report' as FileClassification, label: 'Grammarly Report' },
    { value: 'draft' as FileClassification, label: 'Draft Version' },
    { value: 'revision' as FileClassification, label: 'Revision' },
    { value: 'abstract' as FileClassification, label: 'Abstract' },
    { value: 'graphics_tables' as FileClassification, label: 'Graphics/Tables' },
    { value: 'printable_sources' as FileClassification, label: 'Printable Sources' },
    { value: 'references' as FileClassification, label: 'References' },
    { value: 'appendix' as FileClassification, label: 'Appendix' },
    { value: 'additional' as FileClassification, label: 'Additional Files' },
    { value: 'brief' as FileClassification, label: 'Brief/Instructions' },
  ];

  switch (role) {
    case 'client':
      return clientOptions;
    case 'freelancer':
      return freelancerOptions;
    case 'manager':
    case 'admin':
      return managerAdminOptions;
    default:
      return [];
  }
};

export function EnhancedFileUpload({
  open,
  onOpenChange,
  orderId,
  uploaderId,
  userRole,
  onUploadComplete,
  maxFiles = 10,
}: EnhancedFileUploadProps) {
  const [filesWithClassification, setFilesWithClassification] = useState<FileWithClassification[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classificationOptions = getClassificationOptions(userRole);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check max files limit
    if (filesWithClassification.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check file sizes (40MB limit per file)
    const oversizedFiles = files.filter(f => f.size > 40 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 40MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const newFiles: FileWithClassification[] = files.map(file => ({
      file,
      classification: '',
    }));

    setFilesWithClassification(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) added. Please select classification for each file.`);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFilesWithClassification(prev => prev.filter((_, i) => i !== index));
  };

  const handleClassificationChange = (index: number, classification: FileClassification) => {
    setFilesWithClassification(prev =>
      prev.map((item, i) => (i === index ? { ...item, classification } : item))
    );
  };

  const handleUpload = async () => {
    // Validate all files have classifications
    const unclassified = filesWithClassification.filter(f => !f.classification);
    if (unclassified.length > 0) {
      toast.error('Please select classification for all files');
      return;
    }

    if (filesWithClassification.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles: Array<{
        url: string;
        name: string;
        size: number;
        mimeType: string;
        fileType: string;
      }> = [];

      // Upload each file to Cloudinary
      for (const { file, classification } of filesWithClassification) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include', // 🔴 CRITICAL: Include auth cookies
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadData = await uploadResponse.json();

        uploadedFiles.push({
          url: uploadData.url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          fileType: classification!,
        });
      }

      // Determine the appropriate endpoint based on file types
      const hasFinalDocs = uploadedFiles.some(f => 
        ['final_document', 'completed_paper', 'plagiarism_report', 'ai_report', 'turnitin_report', 'grammarly_report'].includes(f.fileType)
      );
      const hasDrafts = uploadedFiles.some(f => f.fileType === 'draft');
      const hasRevisions = uploadedFiles.some(f => f.fileType === 'revision');

      // Use appropriate endpoint
      let endpoint = `/api/v2/orders/${orderId}/upload/additional`;
      if (hasFinalDocs) {
        endpoint = `/api/v2/orders/${orderId}/upload/final`;
      } else if (hasDrafts) {
        endpoint = `/api/v2/orders/${orderId}/upload/draft`;
      } else if (hasRevisions) {
        endpoint = `/api/v2/orders/${orderId}/upload/revision`;
      }

      // Save all files with their classifications
      const saveResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId,
          files: uploadedFiles,
        }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || 'Failed to save file metadata');
      }

      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
      setFilesWithClassification([]);
      onOpenChange(false);
      onUploadComplete();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const allClassified = filesWithClassification.every(f => f.classification);
  const canUpload = filesWithClassification.length > 0 && allClassified && !uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Select files and classify each one before uploading (Max {maxFiles} files, 40MB each)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={filesWithClassification.length >= maxFiles || uploading}
            className="w-full"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Select Files ({filesWithClassification.length}/{maxFiles})
          </Button>

          {/* Files List with Classifications */}
          {filesWithClassification.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-semibold">
                Selected Files - Classify Each File:
              </Label>
              {filesWithClassification.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-sm"
                >
                  <FileText className="w-5 h-5 mt-1 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium truncate">
                        {item.file.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFile(index)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Select
                      value={item.classification}
                      onValueChange={(value) =>
                        handleClassificationChange(index, value as FileClassification)
                      }
                    >
                      <SelectTrigger className={!item.classification ? 'border-orange-500' : ''}>
                        <SelectValue placeholder="Select file type *" />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filesWithClassification.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files selected</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFilesWithClassification([]);
              onOpenChange(false);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {filesWithClassification.length} File{filesWithClassification.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
