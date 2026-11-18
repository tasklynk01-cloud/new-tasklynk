"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

type Memo = {
  id: number;
  title: string;
  content: string;
  targetRole: string;
  priority: string;
  requiresAcknowledgement: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export function MemoPopup() {
  const { user } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [currentMemoIndex, setCurrentMemoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  // Fetch unread memos - only if user is authenticated
  useEffect(() => {
    // Don't fetch if no user is logged in
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchMemos = async () => {
      try {
        const response = await fetch('/api/v2/memos/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setMemos(data.memos || []);
        }
      } catch (error) {
        console.error('Failed to fetch memos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();

    // Poll every 30 seconds for new memos
    const interval = setInterval(fetchMemos, 30000);
    return () => clearInterval(interval);
  }, [user?.id]); // Only re-run if user ID changes, not the entire user object

  const currentMemo = memos[currentMemoIndex];

  const handleAcknowledge = async () => {
    if (!currentMemo) return;

    setAcknowledging(true);
    try {
      const response = await fetch('/api/v2/memos/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memoId: currentMemo.id }),
      });

      if (response.ok) {
        // Move to next memo or close if no more
        if (currentMemoIndex < memos.length - 1) {
          setCurrentMemoIndex(currentMemoIndex + 1);
        } else {
          // No more memos, clear the list
          setMemos([]);
        }
      } else {
        toast.error('Failed to acknowledge memo. Please try again.');
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setAcknowledging(false);
    }
  };

  // Don't show dialog if no memos
  if (!loading && memos.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentMemo) return null;

  const getPriorityIcon = () => {
    switch (currentMemo.priority) {
      case 'urgent':
        return <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <Megaphone className="h-6 w-6 text-blue-500" />;
    }
  };

  const getPriorityBadge = () => {
    switch (currentMemo.priority) {
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {getPriorityIcon()}
              Important Announcement
            </DialogTitle>
            <div className="flex items-center gap-3">
              {getPriorityBadge()}
              {memos.length > 1 && (
                <Badge variant="secondary">
                  {currentMemoIndex + 1} of {memos.length}
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-base">
            Please read the following message carefully and acknowledge before continuing.
          </DialogDescription>
        </DialogHeader>

        {currentMemo.priority === 'urgent' && (
          <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm">
              <strong>Urgent Message:</strong> This is a critical announcement that requires your immediate attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Memo Content */}
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-foreground">{currentMemo.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Posted: {new Date(currentMemo.createdAt).toLocaleString()}</span>
              {currentMemo.expiresAt && (
                <span className="ml-2">
                  • Expires: {new Date(currentMemo.expiresAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Message Body */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {currentMemo.content}
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              Click "I Understand" below to acknowledge that you have read and understood this message.
              {memos.length > 1 && ` You have ${memos.length - currentMemoIndex} message(s) to review.`}
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-primary-foreground"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {acknowledging ? 'Processing...' : 'I Understand & Acknowledge'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You must acknowledge this message to continue using the platform.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
