"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, CheckCircle, Upload, X, FileText, 
  AlertTriangle, Send, RefreshCw, FileUp
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES & CONSTANTS
// ============================================

export type FileClassificationType = 
  | 'final_paper'
  | 'plagiarism_report'
  | 'ai_report'
  | 'printable_sources'
  | 'graphics'
  | 'tables'
  | 'abstract'
  | 'outline'
  | 'draft'
  | 'revision'
  | 'other';

export type SubmissionMode = 'draft' | 'final' | 'revision';

interface UploadFile {
  id: string;
  file: File;
  classification: FileClassificationType | null;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  uploadedUrl?: string;
  error?: string;
}

interface FreelancerUploadPanelProps {
  orderId: number;
  orderStatus: string;
  assignedFreelancerId: number | null;
  currentUserId: number;
  requiresReports?: boolean;
  revisionRequested?: boolean;
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'txt', 'rtf', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'
];

const CLASSIFICATION_OPTIONS: { value: FileClassificationType; label: string; icon: string; description: string }[] = [
  { value: 'final_paper', label: 'Final Paper', icon: '📄', description: 'The completed assignment' },
  { value: 'plagiarism_report', label: 'Plagiarism Report', icon: '🔍', description: 'Turnitin or similar report' },
  { value: 'ai_report', label: 'AI Detection Report', icon: '🤖', description: 'GPTZero or similar report' },
  { value: 'printable_sources', label: 'Printable Sources', icon: '📚', description: 'Reference materials' },
  { value: 'graphics', label: 'Graphics/Images', icon: '🎨', description: 'Charts, diagrams, images' },
  { value: 'tables', label: 'Tables/Data', icon: '📊', description: 'Data tables or spreadsheets' },
  { value: 'abstract', label: 'Abstract', icon: '📝', description: 'Paper abstract' },
  { value: 'outline', label: 'Outline', icon: '📋', description: 'Paper outline' },
  { value: 'draft', label: 'Draft', icon: '✏️', description: 'Work in progress' },
  { value: 'revision', label: 'Revision', icon: '🔄', description: 'Revised version' },
  { value: 'other', label: 'Other', icon: '📎', description: 'Other document types' },
];

const CLASSIFICATION_COLORS: Record<FileClassificationType, string> = {
  final_paper: 'bg-green-100 text-green-800 border-green-300',
  plagiarism_report: 'bg-blue-100 text-blue-800 border-blue-300',
  ai_report: 'bg-purple-100 text-purple-800 border-purple-300',
  printable_sources: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  graphics: 'bg-orange-100 text-orange-800 border-orange-300',
  tables: 'bg-amber-100 text-amber-800 border-amber-300',
  abstract: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  outline: 'bg-teal-100 text-teal-800 border-teal-300',
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  revision: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  other: 'bg-slate-100 text-slate-800 border-slate-300',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateFileId = () => Math.random().toString(36).substring(2, 11);

const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

const validateFile = (file: File): string | null => {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported format: .${ext}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (max 40MB)`;
  }
  return null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Map classification to API file type
const mapClassificationToApiType = (classification: FileClassificationType): string => {
  const mapping: Record<FileClassificationType, string> = {
    final_paper: 'final_document',
    plagiarism_report: 'plagiarism_report',
    ai_report: 'ai_report',
    printable_sources: 'printable_sources',
    graphics: 'graphics_tables',
    tables: 'graphics_tables',
    abstract: 'abstract',
    outline: 'outline',
    draft: 'draft',
    revision: 'revision',
    other: 'additional',
  };
  return mapping[classification] || 'additional';
};

// ============================================
// MAIN COMPONENT
// ============================================

export function FreelancerUploadPanel({
  orderId,
  orderStatus,
  assignedFreelancerId,
  currentUserId,
  requiresReports = false,
  revisionRequested = false,
  onUploadComplete,
}: FreelancerUploadPanelProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine access and mode
  const isAssignedToUser = assignedFreelancerId === currentUserId;
  const normalizedStatus = orderStatus.replace('-', '_').toLowerCase();
  const isRevisionMode = normalizedStatus === 'revision' || revisionRequested;
  
  // Determine allowed submission modes based on status
  const canSubmitDraft = ['in_progress', 'editing'].includes(normalizedStatus);
  const canSubmitFinal = ['in_progress', 'editing'].includes(normalizedStatus);
  const canSubmitRevision = isRevisionMode || normalizedStatus === 'revision';
  const canUpload = isAssignedToUser && (canSubmitDraft || canSubmitFinal || canSubmitRevision);

  // Check if all files are classified
  const allFilesClassified = files.length > 0 && files.every(f => f.classification !== null);
  const hasRequiredDocs = !requiresReports || (
    files.some(f => f.classification === 'plagiarism_report') &&
    files.some(f => f.classification === 'ai_report')
  );

  // File handling
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: UploadFile[] = selectedFiles.map(file => {
      const validation = validateFile(file);
      return {
        id: generateFileId(),
        file,
        classification: null,
        status: validation ? 'error' : 'pending',
        error: validation || undefined,
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleClassificationChange = useCallback((id: string, classification: FileClassificationType) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, classification } : f
    ));
  }, []);

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobId', orderId.toString());
    formData.append('folder', 'tasklynk/uploads');

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  // Submit handler
  const handleSubmit = async (mode: SubmissionMode) => {
    if (!canUpload) {
      toast.error('You cannot upload files for this order');
      return;
    }

    if (files.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    if (!allFilesClassified) {
      toast.error('Please classify all files before submitting');
      return;
    }

    if (mode === 'final' && requiresReports && !hasRequiredDocs) {
      toast.error('Final submission requires plagiarism and AI detection reports');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all files to Cloudinary first
      const uploadPromises = files.map(async (f) => {
        if (f.status === 'error') {
          throw new Error(`Invalid file: ${f.file.name}`);
        }

        setFiles(prev => prev.map(file => 
          file.id === f.id ? { ...file, status: 'uploading' } : file
        ));

        try {
          const url = await uploadToCloudinary(f.file);
          setFiles(prev => prev.map(file => 
            file.id === f.id ? { ...file, status: 'uploaded', uploadedUrl: url } : file
          ));
          return {
            url,
            name: f.file.name,
            size: f.file.size,
            mimeType: f.file.type || 'application/octet-stream',
            fileType: mapClassificationToApiType(f.classification!),
            fileClassification: f.classification,
          };
        } catch (err) {
          setFiles(prev => prev.map(file => 
            file.id === f.id ? { ...file, status: 'error', error: 'Upload failed' } : file
          ));
          throw err;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Determine API endpoint
      let endpoint: string;
      switch (mode) {
        case 'draft':
          endpoint = `/api/v2/orders/${orderId}/upload/draft`;
          break;
        case 'revision':
          endpoint = `/api/v2/orders/${orderId}/upload/revision`;
          break;
        case 'final':
        default:
          endpoint = `/api/v2/orders/${orderId}/upload/final`;
          break;
      }

      // Submit to API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: currentUserId,
          notes: notes || `${mode.charAt(0).toUpperCase() + mode.slice(1)} submission`,
          files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }

      // Success
      const modeLabels = { draft: 'Draft', final: 'Final work', revision: 'Revision' };
      toast.success(`${modeLabels[mode]} submitted successfully!`);
      setFiles([]);
      setNotes('');
      onUploadComplete?.();

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user can't upload
  if (!canUpload) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardTitle className="flex items-center gap-3">
          <FileUp className="w-5 h-5 text-blue-600" />
          {isRevisionMode ? 'Submit Revision' : 'Submit Your Work'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {/* Requirements Alert */}
        {requiresReports && !isRevisionMode && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Required for Final Submission:
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 mt-1 list-disc list-inside">
                <li>Plagiarism Report (Turnitin or similar)</li>
                <li>AI Detection Report (GPTZero or similar)</li>
              </ul>
            </div>
          </div>
        )}

        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            multiple
            accept={`.${ALLOWED_EXTENSIONS.join(',.')}`}
            onChange={handleFileSelect}
            disabled={isSubmitting}
            className="hidden"
            id="freelancer-file-upload"
          />
          <label htmlFor="freelancer-file-upload" className="cursor-pointer">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click to select files or drag & drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max 40MB per file • PDF, DOCX, PPTX, Images, ZIP
            </p>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              {!allFilesClassified && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Classify all files
                </Badge>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    f.status === 'error' 
                      ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700'
                      : f.classification 
                        ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        : 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'
                  }`}
                >
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium truncate">{f.file.name}</p>
                      <span className="text-xs text-gray-500">{formatFileSize(f.file.size)}</span>
                      {f.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {f.status === 'uploaded' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    {f.error && (
                      <p className="text-xs text-red-600">{f.error}</p>
                    )}

                    {f.status !== 'error' && (
                      <div className="flex items-center gap-3">
                        <Select
                          value={f.classification || ''}
                          onValueChange={(value) => handleClassificationChange(f.id, value as FileClassificationType)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Select file type *" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASSIFICATION_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-3">
                                  <span>{opt.icon}</span>
                                  <span>{opt.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {f.classification && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${CLASSIFICATION_COLORS[f.classification]}`}
                          >
                            {CLASSIFICATION_OPTIONS.find(o => o.value === f.classification)?.label}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(f.id)}
                    disabled={isSubmitting}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {files.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this submission..."
              disabled={isSubmitting}
              rows={2}
            />
          </div>
        )}

        {/* Validation Status */}
        {files.length > 0 && (
          <div className={`p-4 rounded-lg ${
            allFilesClassified 
              ? 'bg-green-50 border border-green-300 dark:bg-green-950/30 dark:border-green-700'
              : 'bg-amber-50 border border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'
          }`}>
            <p className={`text-sm ${
              allFilesClassified ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'
            }`}>
              {allFilesClassified 
                ? '✓ All files classified. Ready to submit!'
                : '⚠ Please classify all files before submitting'
              }
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && allFilesClassified && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canSubmitDraft && !isRevisionMode && (
              <Button
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                variant="outline"
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Submit as Draft
              </Button>
            )}
            
            {isRevisionMode ? (
              <Button
                onClick={() => handleSubmit('revision')}
                disabled={isSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Submit Revision
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit('final')}
                disabled={isSubmitting || (requiresReports && !hasRequiredDocs)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Final
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
