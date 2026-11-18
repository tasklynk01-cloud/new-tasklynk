"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

type Memo = {
  id: number;
  title: string;
  content: string;
  priority: string;
  requiresAcknowledgement: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export function MemoAcknowledgementModal() {
  const { user } = useAuth();
  const [pendingMemo, setPendingMemo] = useState<Memo | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Only check for memos if user is logged in and is a role-based user (not public/landing pages)
    if (user && user.id && user.role) {
      checkForPendingMemos();
    } else {
      setChecking(false);
    }
  }, [user?.id, user?.role]); // Only re-run if user ID or role changes

  const checkForPendingMemos = async () => {
    if (!user?.id) {
      setChecking(false);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch(`/api/v2/memos/pending?userId=${user.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.memo) {
          setPendingMemo(data.memo);
        }
      }
    } catch (error) {
      console.error('Failed to check for pending memos:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!pendingMemo || !user) return;

    setAcknowledging(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/v2/memos/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          memoId: pendingMemo.id,
          userId: user.id,
        }),
      });

      if (response.ok) {
        toast.success('Memo acknowledged successfully!');
        setPendingMemo(null);
        // Wait a moment before checking for next memo (ensure DB is updated)
        setTimeout(() => {
          checkForPendingMemos();
        }, 500);
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to acknowledge memo'));
      }
    } catch (error) {
      console.error('Error acknowledging memo:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setAcknowledging(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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

  // Don't render anything while checking or if no pending memo
  if (checking || !pendingMemo) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {pendingMemo.priority === 'urgent' || pendingMemo.priority === 'high' ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <Megaphone className="w-6 h-6 text-blue-600" />
            )}
            {pendingMemo.title}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            {getPriorityBadge(pendingMemo.priority)}
            <span className="text-xs text-muted-foreground">
              Posted on {new Date(pendingMemo.createdAt).toLocaleDateString()}
            </span>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm text-foreground">
                {pendingMemo.content}
              </div>
            </div>
          </div>
        </DialogDescription>

        {pendingMemo.expiresAt && (
          <div className="text-xs text-muted-foreground bg-muted p-4 rounded">
            ⏱️ This memo expires on {new Date(pendingMemo.expiresAt).toLocaleString()}
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4" />
            <strong>Action Required:</strong> You must acknowledge this memo to continue using the platform.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full"
            size="lg"
          >
            {acknowledging ? 'Acknowledging...' : 'I Understand & Acknowledge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
