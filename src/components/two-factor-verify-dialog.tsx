'use client';

/**
 * 🔐 TWO-FACTOR AUTHENTICATION VERIFICATION DIALOG
 * 
 * Shows during login when user has 2FA enabled
 * Allows entering TOTP code or backup code
 * 
 * USAGE:
 * - Triggered after successful email/password validation
 * - User enters 6-digit code from authenticator app
 * - Or enters backup code if no access to authenticator
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Key } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorVerifyDialogProps {
  open: boolean;
  email: string;
  rememberMe?: boolean;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function TwoFactorVerifyDialog({
  open,
  email,
  rememberMe = false,
  onSuccess,
  onCancel,
}: TwoFactorVerifyDialogProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v2/auth/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token: code,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      // Show warning if backup codes are low
      if (data.warning) {
        toast.warning(data.warning);
      }

      toast.success('Login successful!');
      onSuccess(data);
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {showBackupCodeInput
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              For security, you need to verify your identity with a second factor.
            </AlertDescription>
          </Alert>

          {showBackupCodeInput ? (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Backup Code
              </label>
              <Input
                type="text"
                placeholder="XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="font-mono text-lg text-center"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Each backup code can only be used once
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={handleKeyDown}
                className="font-mono text-lg text-center"
                maxLength={6}
                autoFocus
              />
            </div>
          )}

          {/* Toggle between code types */}
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setShowBackupCodeInput(!showBackupCodeInput);
                setCode('');
              }}
              className="text-sm"
            >
              {showBackupCodeInput
                ? 'Use authenticator app instead'
                : 'Use backup code instead'}
            </Button>
          </div>

          {/* Lost access warning */}
          {showBackupCodeInput && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                If you've lost all backup codes, contact your system administrator
                to disable 2FA on your account.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || !code || (!showBackupCodeInput && code.length !== 6)}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
