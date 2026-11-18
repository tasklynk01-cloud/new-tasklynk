"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, File, Loader2, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// File type options for categorization
export const FILE_TYPE_OPTIONS = {
  // Final submission files
  final_paper: { label: 'Final Paper', category: 'final', description: 'The completed final document' },
  completed_paper: { label: 'Completed Paper', category: 'final', description: 'Alternative label for final paper' },
  
  // Quality assurance reports
  ai_report: { label: 'AI Report', category: 'report', description: 'AI detection report (e.g., Turnitin AI)' },
  plag_report: { label: 'Plagiarism Report', category: 'report', description: 'Plagiarism detection report' },
  turnitin_report: { label: 'Turnitin Report', category: 'report', description: 'Combined Turnitin report' },
  grammar_report: { label: 'Grammar Report', category: 'report', description: 'Grammar check report (Grammarly, etc.)' },
  
  // Work-in-progress files
  draft: { label: 'Draft', category: 'wip', description: 'Work in progress draft' },
  revision: { label: 'Revision', category: 'wip', description: 'Revised version of document' },
  
  // Supporting documents
  abstract: { label: 'Abstract', category: 'support', description: 'Document abstract/summary' },
  outline: { label: 'Outline', category: 'support', description: 'Document outline/structure' },
  reference_list: { label: 'Reference List', category: 'support', description: 'Bibliography/references' },
  printable_sources: { label: 'Printable Sources', category: 'support', description: 'Source materials' },
  
  // Visual elements
  graphics: { label: 'Graphics/Charts', category: 'visual', description: 'Charts, graphs, illustrations' },
  tables: { label: 'Tables', category: 'visual', description: 'Data tables' },
  graphics_tables: { label: 'Graphics & Tables', category: 'visual', description: 'Combined visual elements' },
  
  // Additional files
  appendix: { label: 'Appendix', category: 'additional', description: 'Appendix materials' },
  additional: { label: 'Additional File', category: 'additional', description: 'Other supporting files' },
  brief: { label: 'Brief/Instructions', category: 'additional', description: 'Project brief or instructions' },
  other: { label: 'Other', category: 'additional', description: 'Uncategorized file' },
};

type FileWithType = {
  file: File;
  fileType: string;
  classification: string;
};

type MultiFileUploadProps = {
  jobId: number;
  uploadedBy: number;
  uploaderRole: 'admin' | 'manager' | 'freelancer' | 'client';
  onUploadComplete?: () => void;
  allowedFileTypes?: string[]; // Restrict which file types can be selected
  uploadEndpoint?: string; // Custom endpoint (default: /api/v2/orders/[id]/upload/multi)
  title?: string;
  description?: string;
};

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function MultiFileUploadWithTypes({
  jobId,
  uploadedBy,
  uploaderRole,
  onUploadComplete,
  allowedFileTypes,
  uploadEndpoint,
  title = 'Upload Files',
  description = 'Select files and choose the type for each file',
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Filter file type options if restrictions are provided
  const availableFileTypes = allowedFileTypes
    ? Object.entries(FILE_TYPE_OPTIONS).filter(([key]) => allowedFileTypes.includes(key))
    : Object.entries(FILE_TYPE_OPTIONS);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate file sizes
      const validFiles: FileWithType[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File "${file.name}" is too large (${formatFileSize(file.size)}). Max: 40MB`, {
            duration: 5000,
          });
          continue;
        }
        
        // Add file with default type 'other'
        validFiles.push({
          file,
          fileType: 'additional', // Default upload type
          classification: 'other', // Default classification - user must select
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} file(s) added. Please select file type for each.`);
      }
    }
  };

  const handleFileTypeChange = (index: number, newType: string) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        classification: newType,
        // Update fileType based on classification category
        fileType: FILE_TYPE_OPTIONS[newType as keyof typeof FILE_TYPE_OPTIONS]?.category === 'final' 
          ? 'final' 
          : FILE_TYPE_OPTIONS[newType as keyof typeof FILE_TYPE_OPTIONS]?.category === 'report'
          ? 'report'
          : FILE_TYPE_OPTIONS[newType as keyof typeof FILE_TYPE_OPTIONS]?.category === 'wip'
          ? 'draft'
          : 'additional',
      };
      return updated;
    });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info('File removed');
  };

  const handleUpload = async () => {
    // Validate all files have types selected
    const unclassifiedFiles = selectedFiles.filter(f => f.classification === 'other');
    if (unclassifiedFiles.length > 0) {
      toast.error('Please select a file type for all files before uploading');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    const progressMap: { [key: string]: number } = {};

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const { file, classification, fileType } = selectedFiles[i];
        const fileKey = `${i}-${file.name}`;
        
        try {
          // Step 1: Upload to Cloudinary
          progressMap[fileKey] = 25;
          setUploadProgress({ ...progressMap });

          const formData = new FormData();
          formData.append('file', file);
          formData.append('jobId', jobId.toString());
          formData.append('folder', 'tasklynk/uploads');

          const uploadResponse = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include', // 🔴 CRITICAL: Include auth cookies
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.error || 'Failed to upload to storage');
          }

          const uploadData = await uploadResponse.json();

          // Step 2: Save to database
          progressMap[fileKey] = 75;
          setUploadProgress({ ...progressMap });

          const endpoint = uploadEndpoint || `/api/v2/orders/${jobId}/upload/multi`;
          const dbResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              uploaderId: uploadedBy,
              files: [{
                url: uploadData.url,
                name: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
                fileType,
                classification,
              }],
            }),
          });

          if (!dbResponse.ok) {
            const errorData = await dbResponse.json().catch(() => ({ error: 'Failed to save' }));
            throw new Error(errorData.error || 'Failed to save file metadata');
          }

          progressMap[fileKey] = 100;
          setUploadProgress({ ...progressMap });
          successCount++;

        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failCount++;
        }
      }

      // Show final result
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
        setSelectedFiles([]);
        setUploadProgress({});
        onUploadComplete?.();
      } else {
        toast.error('All uploads failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload process failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File selection */}
        <div>
          <Label htmlFor="file-input" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-accent/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select files</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum 40MB per file</p>
            </div>
          </Label>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Selected files with type dropdowns */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Selected Files ({selectedFiles.length})</Label>
              <Badge variant="outline">{selectedFiles.length} file(s)</Badge>
            </div>

            {selectedFiles.map((fileWithType, index) => (
              <div 
                key={`${index}-${fileWithType.file.name}`}
                className="border rounded-lg p-4 space-y-2 bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileWithType.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithType.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File type dropdown */}
                <div className="space-y-1">
                  <Label className="text-xs">File Type*</Label>
                  <Select
                    value={fileWithType.classification}
                    onValueChange={(value) => handleFileTypeChange(index, value)}
                    disabled={uploading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select file type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFileTypes.map(([key, { label, category, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload progress */}
                {uploading && uploadProgress[`${index}-${fileWithType.file.name}`] && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress[`${index}-${fileWithType.file.name}`]}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {uploadProgress[`${index}-${fileWithType.file.name}`]}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Important:</strong> Select the appropriate file type for each file before uploading.
            This helps organize and identify files for clients and reviewers.
          </AlertDescription>
        </Alert>

        {/* Upload button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedFiles([])}
            disabled={uploading || selectedFiles.length === 0}
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="min-w-[120px]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
