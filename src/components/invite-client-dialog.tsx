"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Mail, Copy, Check, AlertCircle, RefreshCw, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth-context-v2';

type InviteClientDialogProps = {
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

export function InviteClientDialog({ open, onOpenChange, onInviteSuccess }: InviteClientDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusDetails, setStatusDetails] = useState<any>(null);
  const { user } = useAuth();

  const checkInvitationStatus = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setInvitationStatus(null);
      return;
    }

    setCheckingStatus(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = (user?.id ? String(user.id) : null) || storedToken;
      if (!authToken) {
        setInvitationStatus('error');
        setStatusMessage('Authentication required');
        return;
      }

      // Check for existing client invitation
      const response = await fetch(`/api/admin/check-invitation-status?email=${encodeURIComponent(emailToCheck)}&role=client`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setInvitationStatus(data.status as InvitationStatus);
        setStatusMessage(data.message);
        setStatusDetails(data.invitation || data.user || null);
      } else {
        setInvitationStatus('error');
        setStatusMessage(data.error || 'Failed to check invitation status');
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
      setInvitationStatus('error');
      setStatusMessage('Failed to check invitation status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Debounced status check when email changes
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setInvitationStatus(null);
      setStatusMessage('');
      setStatusDetails(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkInvitationStatus(email);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

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

      const response = await fetch('/api/admin/invite-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email, name: name.trim() || undefined }),
      });

      const data = await response.json();

      if (response.ok) {
        setInvitationLink(data.invitationLink);
        setEmailSent(data.emailSent);
        setInvitationStatus('active');
        
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
        // Re-check status after error
        await checkInvitationStatus(email);
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('An error occurred while creating the invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleReinvite = async () => {
    // Reinvite is the same as invite - it will create a new unique token
    await handleInvite();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setInvitationLink('');
    setEmailSent(false);
    setCopied(false);
    setInvitationStatus(null);
    setStatusMessage('');
    setStatusDetails(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-primary" />
            Invite Client
          </DialogTitle>
          <DialogDescription>
            Send an exclusive invitation to a potential client. The email includes a persuasive overview of TaskLynk's services and benefits.
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., John or ABC Writing Services"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || checkingStatus}
              />
              <p className="text-xs text-muted-foreground">
                The name will be used in the email greeting for a personal touch.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Client Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading || checkingStatus}
                autoFocus
              />
              
              {/* Status Indicator */}
              {checkingStatus && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="animate-spin">⏳</span>
                  Checking invitation status...
                </div>
              )}

              {invitationStatus && !checkingStatus && (
                <div className={`rounded-lg p-4 text-xs ${
                  invitationStatus === 'no_invitation' || invitationStatus === 'active' 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900'
                    : invitationStatus === 'expired' || invitationStatus === 'used'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900'
                    : invitationStatus === 'user_exists'
                    ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                    : 'bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-900'
                }`}>
                  <div className="flex items-start gap-3">
                    {invitationStatus === 'no_invitation' && (
                      <>
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">Ready to Invite</p>
                          <p className="text-blue-700 dark:text-blue-300 mt-1">{statusMessage}</p>
                        </div>
                      </>
                    )}
                    {invitationStatus === 'active' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 dark:text-amber-100">Active Invitation Exists</p>
                          <p className="text-amber-700 dark:text-amber-300 mt-1">{statusMessage}</p>
                          {statusDetails?.expiresAt && (
                            <p className="text-amber-600 dark:text-amber-400 mt-1 text-[10px]">
                              Expires: {new Date(statusDetails.expiresAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {invitationStatus === 'expired' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 dark:text-amber-100">Invitation Expired</p>
                          <p className="text-amber-700 dark:text-amber-300 mt-1">{statusMessage}</p>
                          {statusDetails?.expiresAt && (
                            <p className="text-amber-600 dark:text-amber-400 mt-1 text-[10px]">
                              Expired: {new Date(statusDetails.expiresAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {invitationStatus === 'used' && (
                      <>
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 dark:text-green-100">Invitation Already Used</p>
                          <p className="text-green-700 dark:text-green-300 mt-1">{statusMessage}</p>
                          {statusDetails?.usedAt && (
                            <p className="text-green-600 dark:text-green-400 mt-1 text-[10px]">
                              Used: {new Date(statusDetails.usedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {invitationStatus === 'user_exists' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900 dark:text-red-100">User Already Exists</p>
                          <p className="text-red-700 dark:text-red-300 mt-1">{statusMessage}</p>
                          {statusDetails && (
                            <p className="text-red-600 dark:text-red-400 mt-1 text-[10px]">
                              User: {statusDetails.name} ({statusDetails.role})
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                ⏰ Each invitation link is unique and valid for <strong>14 days</strong>. Can only be used <strong>once</strong>.
              </p>
            </div>

            {/* Benefits Preview */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-3">
                <span>📧</span> What the client will receive:
              </h4>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                <li>✅ <strong>Personalized invitation</strong> with their name</li>
                <li>✨ <strong>Overview of services:</strong> Essays, Dissertations, PowerPoint, SPSS & more</li>
                <li>⚡ <strong>Turnaround times:</strong> Rush (3-6 hours) to standard (24-48 hours)</li>
                <li>💰 <strong>Pricing:</strong> Starting at KSh 240/page with volume discounts</li>
                <li>🔒 <strong>Quality guarantees:</strong> Plagiarism-free, AI detection screening, free revisions</li>
                <li>👥 <strong>Account management:</strong> Dedicated managers and writers</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>✅ A unique secure registration link will be generated</li>
                <li>📧 A persuasive email invitation will be sent to the client</li>
                <li>🔐 The client can register using the link within 14 days</li>
                <li>👤 Once registered, they'll be able to place orders immediately</li>
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
                      A persuasive invitation email has been sent to <strong>{email}</strong> highlighting TaskLynk's services and benefits.
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
                      The invitation was created but email delivery failed. Please share the link below manually with the client.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Registration Link (Share with Client)</Label>
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
                This unique link can only be used once and expires in 14 days.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">📋 Important Notes</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• The link is tied to <strong>{email}</strong></li>
                <li>• Once used, the link becomes invalid</li>
                <li>• The client will be automatically approved upon registration</li>
                <li>• You can track client status in the Users section</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {!invitationLink ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading || checkingStatus}>
                Cancel
              </Button>
              {(invitationStatus === 'expired' || invitationStatus === 'used' || invitationStatus === 'active') && statusDetails?.canReinvite ? (
                <Button onClick={handleReinvite} disabled={loading || checkingStatus}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating New Invitation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reinvite Client
                    </>
                  )}
                </Button>
              ) : invitationStatus === 'user_exists' ? (
                <Button disabled>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  User Exists
                </Button>
              ) : (
                <Button onClick={handleInvite} disabled={loading || checkingStatus || invitationStatus === 'error'}>
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
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
