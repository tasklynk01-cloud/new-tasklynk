"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Mail, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context-v2';

type InviteEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
};

type InvitationStatus = 
  | 'no_invitation' 
  | 'active' 
  | 'expired' 
  | 'used' 
  | 'user_exists' 
  | 'checking' 
  | 'error';

export function InviteEditorDialog({ open, onOpenChange, onInviteSuccess }: InviteEditorDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    setInvitationLink('');
    setEmailSent(false);
  };

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = (user?.id ? String(user.id) : null) || storedToken;
      if (!authToken) {
        toast.error('You are not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/invite-editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setInvitationLink(data.invitationLink);
        setEmailSent(data.emailSent);
        
        if (data.emailSent) {
          toast.success(`Invitation email sent successfully to ${email}!`);
        } else {
          toast.warning('Invitation created but email failed to send. Please share the link manually.');
        }
        
        if (onInviteSuccess) {
          onInviteSuccess();
        }
      } else {
        toast.error(extractErrorMessage(data, 'Failed to create invitation'));
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('An error occurred while creating the invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setInvitationLink('');
    setEmailSent(false);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            Invite Editor
          </DialogTitle>
          <DialogDescription>
            Send a secure, one-time registration link to invite a new editor to the platform.
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Editor Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="editor@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading}
                autoFocus
              />
              
              <p className="text-xs text-muted-foreground">
                ⏰ Each invitation link is unique and valid for <strong>7 days</strong>. Can only be used <strong>once</strong>.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>✅ A unique secure registration link will be generated</li>
                <li>📧 An email invitation will be sent to the editor</li>
                <li>🔐 The editor can register using the link within 7 days</li>
                <li>👤 Once registered, they'll have full editor privileges</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {emailSent ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">
                      ✓ Email Sent Successfully!
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      An invitation email with registration instructions has been sent to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                      ⚠️ Email Failed to Send
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      The invitation was created but email delivery failed. Please share the link below manually with the editor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Registration Link (Share with Editor)</Label>
              <div className="flex items-center gap-3">
                <Input
                  value={invitationLink}
                  readOnly
                  className="font-mono text-xs"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This unique link can only be used once and expires in 7 days.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">📋 Important Notes</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• The link is tied to <strong>{email}</strong></li>
                <li>• Once used, the link becomes invalid</li>
                <li>• The editor will be automatically approved upon registration</li>
                <li>• You can track the editor status in the Users section</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {!invitationLink ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
