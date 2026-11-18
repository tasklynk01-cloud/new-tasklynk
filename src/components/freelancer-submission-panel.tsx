"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadWithClassification, type ClassifiedFile } from '@/components/FileUploadWithClassification';
import { Loader2, CheckCircle, UploadCloud, RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { allowsFileUpload, type OrderStatus } from '@/lib/status-transitions';

const ALLOWED_FORMATS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'xls', 'xlsx', 'txt', 'rtf',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp3', 'mp4', 'wav', 'avi', 'mov',
  'csv', 'json', 'xml'
];

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB

interface FreelancerSubmissionPanelProps {
  jobId: number;
  jobStatus: string;
  assignedFreelancerId: number | null;
  currentUserId: number;
  requiresReports?: boolean | null;
  revisionRequested?: boolean;
  onUploadComplete?: () => void;
}

interface UploadedFilePayload {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  fileType?: string;
  fileClassification?: string | null;
}

const mapClassificationToFileType = (classification: ClassifiedFile['classification']): string => {
  switch (classification) {
    case 'final_paper':
      return 'final_document';
    case 'plag_report':
      return 'plagiarism_report';
    case 'ai_report':
      return 'ai_report';
    case 'printable_sources':
      return 'printable_sources';
    case 'graphics':
    case 'tables':
      return 'graphics_tables';
    case 'abstract':
      return 'abstract';
    case 'outline':
      return 'outline';
    case 'revision':
      return 'revision';
    case 'draft':
      return 'draft';
    default:
      return 'additional';
  }
};

const validateFile = (file: File): string | null => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext) return 'File must have an extension.';
  if (!ALLOWED_FORMATS.includes(ext)) {
    return `Unsupported file format .${ext}.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" is larger than 40MB.`;
  }
  return null;
};

const uploadToCloudinary = async (file: File, jobId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('jobId', jobId.toString());
  formData.append('folder', 'tasklynk/uploads');

  const response = await fetch('/api/cloudinary/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to upload file.';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  return {
    url: payload.url,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  } satisfies UploadedFilePayload;
};

export function FreelancerSubmissionPanel({
  jobId,
  jobStatus,
  assignedFreelancerId,
  currentUserId,
  requiresReports,
  revisionRequested,
  onUploadComplete,
}: FreelancerSubmissionPanelProps) {
  const [submissionFiles, setSubmissionFiles] = useState<ClassifiedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const isAssignedToUser = assignedFreelancerId === currentUserId;
  const status = jobStatus as OrderStatus;

  // Determine submission type based on order status
  // Note: Handle both 'in_progress' and 'in-progress' status formats
  const normalizedStatus = status.replace('-', '_');
  const isRevisionMode = normalizedStatus === 'revision' || revisionRequested;
  const isDraftMode = normalizedStatus === 'in_progress';
  const isFinalMode = normalizedStatus === 'in_progress' || normalizedStatus === 'editing';
  const canSubmit = isAssignedToUser && (['in_progress', 'in-progress', 'editing', 'revision'].includes(status) || allowsFileUpload(status));
  const showPanel = canSubmit;

  const prepareClassifiedFiles = async (items: ClassifiedFile[]): Promise<UploadedFilePayload[]> => {
    const uploads = await Promise.all(items.map(async ({ file, classification }) => {
      if (!classification) {
        throw new Error('Please classify every file.');
      }
      const validation = validateFile(file);
      if (validation) {
        throw new Error(validation);
      }
      const uploaded = await uploadToCloudinary(file, jobId);
      return {
        ...uploaded,
        fileType: mapClassificationToFileType(classification),
        fileClassification: classification,
      } satisfies UploadedFilePayload;
    }));
    return uploads;
  };

  const handleSubmitDraft = async () => {
    if (!canSubmit) {
      toast.error('Submission is not allowed at this time.');
      return;
    }
    if (submissionFiles.length === 0) {
      toast.error('Please add files to submit.');
      return;
    }

    setUploading(true);
    try {
      const uploads = await prepareClassifiedFiles(submissionFiles);
      
      const response = await fetch(`/api/v2/orders/${jobId}/upload/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: currentUserId,
          notes: 'Draft submission',
          files: uploads.map(u => ({
            ...u,
            fileType: 'draft',
            fileClassification: u.fileClassification || 'draft',
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit draft.');
      }

      toast.success('Draft submitted successfully!');
      setSubmissionFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Draft submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit draft.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!canSubmit) {
      toast.error('Submission is not allowed at this time.');
      return;
    }
    if (submissionFiles.length === 0) {
      toast.error('Please add files to submit.');
      return;
    }

    setUploading(true);
    try {
      const uploads = await prepareClassifiedFiles(submissionFiles);
      
      // Determine endpoint based on mode
      const endpoint = isRevisionMode 
        ? `/api/v2/orders/${jobId}/upload/revision`
        : `/api/v2/orders/${jobId}/upload/final`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: currentUserId,
          notes: isRevisionMode ? 'Revision submission' : 'Final submission',
          files: uploads,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit files.');
      }

      const successMessage = isRevisionMode 
        ? 'Revision submitted successfully!' 
        : 'Final work submitted successfully for editing!';
      
      toast.success(successMessage);
      setSubmissionFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit files.');
    } finally {
      setUploading(false);
    }
  };

  if (!showPanel) {
    return null;
  }

  const submissionIcon = isRevisionMode ? RefreshCcw : UploadCloud;
  const IconComponent = submissionIcon;
  
  const getTitle = () => {
    if (isRevisionMode) return 'Submit Revision';
    if (isDraftMode) return 'Submit Your Work';
    if (isFinalMode) return 'Submit Final Work';
    return 'Submit Your Work';
  };
  
  const getDescription = () => {
    if (isRevisionMode) return 'Upload revised files addressing the feedback';
    if (isDraftMode) return 'Upload draft for review or final work for submission';
    if (isFinalMode) return 'Upload final work with all reports';
    return 'Upload your completed work';
  };

  return (
    <div className="space-y-4">
      {/* Requirements Alert */}
      {requiresReports && !isDraftMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-4 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Required Documents</h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                For final submission, include <strong>plagiarism report</strong> and <strong>AI detection report</strong> along with your work.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Progress */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <IconComponent className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-primary-foreground">{getTitle()}</h3>
            <p className="text-sm text-muted-foreground">{getDescription()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <FileUploadWithClassification
              onFilesSelected={setSubmissionFiles}
              maxFiles={10}
              accept={`.${ALLOWED_FORMATS.join(',.')}`}
              disabled={uploading}
            />
            <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                📋 <strong>Step-by-step:</strong> Select files → Classify each document → Click submit
              </p>
            </div>
          </div>

          {/* File Count Display */}
          {submissionFiles.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                {submissionFiles.length} file{submissionFiles.length !== 1 ? 's' : ''} ready to submit
              </span>
            </div>
          )}

          {/* Action Buttons */}
          {(normalizedStatus === 'in_progress' || normalizedStatus === 'editing') ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSubmitDraft}
                disabled={uploading || submissionFiles.length === 0}
                variant="outline"
                size="lg"
                className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 mr-2" />
                    Submit Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmitFinal}
                disabled={uploading || submissionFiles.length === 0}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit Final
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={isRevisionMode ? handleSubmitFinal : (isDraftMode ? handleSubmitDraft : handleSubmitFinal)}
              disabled={uploading || submissionFiles.length === 0}
              size="lg"
              className={`w-full shadow-lg ${
                isRevisionMode 
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading {submissionFiles.length} file{submissionFiles.length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 mr-2" />
                  {isRevisionMode ? 'Submit Revision' : 'Submit Work'}
                  {submissionFiles.length > 0 && ` (${submissionFiles.length})`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
