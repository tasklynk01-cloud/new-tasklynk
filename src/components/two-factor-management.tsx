'use client';

/**
 * 🔐 TWO-FACTOR AUTHENTICATION MANAGEMENT COMPONENT
 * 
 * Complete 2FA management interface for admin settings
 * 
 * FEATURES:
 * - Enable/Disable 2FA
 * - View 2FA status
 * - Regenerate backup codes
 * - Download backup codes
 * - Security recommendations
 * 
 * USAGE: Include in admin settings page
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  RefreshCw,
  Check,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { TwoFactorSetup } from './two-factor-setup';

interface TwoFactorManagementProps {
  userEmail: string;
  twoFactorEnabled: boolean;
  onStatusChange?: () => void;
}

export function TwoFactorManagement({
  userEmail,
  twoFactorEnabled: initialEnabled,
  onStatusChange,
}: TwoFactorManagementProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialEnabled);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(initialEnabled);
  }, [initialEnabled]);

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!disableCode) {
      toast.error('Please enter your verification code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: disableCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
      toast.success('Two-factor authentication has been disabled');
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
      console.error('Disable 2FA error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode) {
      toast.error('Please enter your verification code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/auth/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: regenerateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }

      setNewBackupCodes(data.data.backupCodes);
      setRegenerateCode('');
      toast.success('New backup codes generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate backup codes');
      console.error('Regenerate backup codes error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const content = `TaskLynk Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}
Email: ${userEmail}

IMPORTANT: Store these codes in a secure location.
Each code can only be used once.

${newBackupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

---
If you lose access to your authenticator app, you can use these codes to log in.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasklynk-2fa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    toast.success('Backup codes copied');
  };

  // If showing setup wizard
  if (showSetup) {
    return (
      <TwoFactorSetup
        onSuccess={() => {
          setShowSetup(false);
          setTwoFactorEnabled(true);
          onStatusChange?.();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {twoFactorEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            {twoFactorEnabled
              ? 'Your account is protected with 2FA'
              : 'Add an extra layer of security to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <>
              <Alert className="border-green-200 bg-green-50">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Two-factor authentication is currently <strong>enabled</strong> for
                  your account. You'll need to enter a code from your authenticator app
                  when logging in.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  If you lose access to your authenticator app, you can use backup codes
                  to log in. Each code can only be used once.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateDialog(true)}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is currently <strong>disabled</strong>. We
                  strongly recommend enabling it to protect your admin account.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Why enable 2FA?</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Protects against unauthorized access even if password is compromised</li>
                  <li>Meets security best practices for admin accounts</li>
                  <li>Provides backup codes for emergency access</li>
                  <li>Works with popular authenticator apps</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {twoFactorEnabled ? (
            <Button
              variant="destructive"
              onClick={() => setShowDisableDialog(true)}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Disable 2FA
            </Button>
          ) : (
            <Button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Enable 2FA
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current verification code to disable 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will reduce your account security. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-lg text-center"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading || disableCode.length !== 6}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              {newBackupCodes.length > 0
                ? 'Save your new backup codes in a secure location'
                : 'Enter your verification code to generate new backup codes'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {newBackupCodes.length === 0 ? (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will replace all existing backup codes. Make sure to save the new codes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={regenerateCode}
                    onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="font-mono text-lg text-center"
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    New backup codes generated successfully. Save them in a secure location.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                  {newBackupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>{code}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBackupCodes}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Codes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBackupCodes}
                    className="flex items-center gap-2"
                  >
                    {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copy Codes
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {newBackupCodes.length === 0 ? (
              <>
                <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRegenerateBackupCodes}
                  disabled={loading || regenerateCode.length !== 6}
                >
                  {loading ? 'Generating...' : 'Generate New Codes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setShowRegenerateDialog(false);
                setNewBackupCodes([]);
              }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
