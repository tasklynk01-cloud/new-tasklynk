"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Job = {
  id: number;
  title: string;
  displayId: string;
  status: string;
};

function SubmitWorkContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<Job | null>(null);
  const [submissionType, setSubmissionType] = useState<'draft' | 'final'>('final');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else if (!jobId) {
        router.push('/freelancer/orders');
      } else {
        fetchJobDetails();
      }
    }
  }, [user, loading, router, jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await safeApiFetch(`/api/jobs/${jobId}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoadingJob(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error('Please provide content or upload files');
      return;
    }

    setUploading(true);
    try {
      // Upload files first if any
      let uploadedFiles = [];
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await safeApiFetch('/api/files/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadedData = await uploadResponse.json();
            uploadedFiles.push({
              fileName: file.name,
              fileUrl: uploadedData.url,
              fileSize: file.size,
              fileType: file.type,
            });
          }
        }
      }

      // Create submission
      const response = await safeApiFetch('/api/freelancer/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: parseInt(jobId as string),
          writerId: user?.id,
          submissionType,
          content,
          wordCount,
          files: uploadedFiles,
        }),
      });

      if (response.ok) {
        toast.success('Work submitted successfully!');
        router.push(`/freelancer/orders/${jobId}`);
      } else {
        toast.error('Failed to submit work');
      }
    } catch (error) {
      console.error('Failed to submit work:', error);
      toast.error('Error submitting work');
    } finally {
      setUploading(false);
    }
  };

  if (loading || loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <Alert>
        <AlertDescription>Job not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Deliver Project Files</h1>
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {job.displayId || `#${job.id}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {job.title}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border text-xs font-semibold self-start sm:self-auto">
          <Link href={`/freelancer/orders/${jobId}`} className="flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Order Workspace</span>
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Card className="rounded-xl border border-border/70 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground">Submission Payload</CardTitle>
          <CardDescription className="text-xs">
            Upload your completed work deliverables or paste drafted content for QA review
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {/* Submission Type */}
          <div className="space-y-3">
            <Label>Submission Type</Label>
            <div className="flex gap-4">
              {(['draft', 'final'] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="submissionType"
                    value={type}
                    checked={submissionType === type}
                    onChange={(e) =>
                      setSubmissionType(e.target.value as 'draft' | 'final')
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize">{type} Submission</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your written content here..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setWordCount(
                  e.target.value
                    .trim()
                    .split(/\s+/)
                    .filter((w) => w).length
                );
              }}
              className="min-h-[300px]"
            />
            <p className="text-sm text-muted-foreground">
              Word count: {wordCount}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file-upload">Upload Files (Max 5 files)</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".doc,.docx,.pdf,.txt,.xlsx"
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                if (selectedFiles.length > 5) {
                  toast.error('Maximum 5 files allowed');
                  return;
                }
                setFiles(selectedFiles);
              }}
              className="cursor-pointer"
            />
            {files.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="gap-3"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 rounded-full border-b-2 border-current" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit Work
                </>
              )}
            </Button>
            <Link href={`/freelancer/orders/${jobId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmitWorkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <SubmitWorkContent />
    </Suspense>
  );
}
