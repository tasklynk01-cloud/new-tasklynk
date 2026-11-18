'use client';

/**
 * 🔐 TWO-FACTOR AUTHENTICATION SETUP COMPONENT
 * 
 * Allows admin users to enable 2FA for their accounts
 * 
 * FEATURES:
 * - QR code display for authenticator apps
 * - Manual entry key as fallback
 * - Backup codes generation and display
 * - Verification step to enable 2FA
 * - Download backup codes as text file
 * 
 * FLOW:
 * 1. User clicks "Enable 2FA"
 * 2. Shows QR code + manual key + backup codes
 * 3. User scans QR code with authenticator app
 * 4. User enters verification code
 * 5. 2FA is enabled on success
 */

import { useState } from 'react';
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
import { Download, Shield, AlertTriangle, CheckCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onSuccess, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Start 2FA setup
  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start 2FA setup');
      }

      setQrCode(data.data.qrCodeUrl);
      setManualKey(data.data.manualEntryKey);
      setBackupCodes(data.data.backupCodes);
      setStep('setup');
      toast.success('2FA setup started. Scan the QR code with your authenticator app.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start 2FA setup');
      console.error('2FA setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/auth/2fa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      toast.success('Two-factor authentication enabled successfully!');
      setStep('verify');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes as text file
  const handleDownloadBackupCodes = () => {
    const content = `TaskLynk Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a secure location.
Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

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

  // Copy manual key to clipboard
  const handleCopyKey = () => {
    navigator.clipboard.writeText(manualKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success('Manual entry key copied');
  };

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    toast.success('Backup codes copied');
  };

  // Initial step - start setup
  if (step === 'initial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication (2FA) requires you to enter a code from your
              authenticator app every time you log in. This significantly improves
              account security.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">What you'll need:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>An authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)</li>
              <li>Access to your email for account recovery</li>
              <li>A secure location to store backup codes</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleStartSetup} disabled={loading}>
            {loading ? 'Starting...' : 'Start Setup'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Setup step - show QR code and backup codes
  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Authenticator App
          </CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="space-y-2">
            <h4 className="font-medium">Step 1: Scan QR Code</h4>
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <h4 className="font-medium">Or enter this code manually:</h4>
            <div className="flex gap-2">
              <Input value={manualKey} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyKey}
              >
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Backup Codes */}
          <div className="space-y-2">
            <h4 className="font-medium">Step 2: Save Your Backup Codes</h4>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Store these codes in a secure location. Each code can only be used once.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
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
          </div>

          {/* Verification */}
          <div className="space-y-2">
            <h4 className="font-medium">Step 3: Verify Setup</h4>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app to enable 2FA
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-lg text-center"
                maxLength={6}
              />
              <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          2FA Enabled Successfully!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Two-factor authentication is now enabled for your account. You'll be asked
            for a verification code the next time you log in.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button onClick={onSuccess}>Done</Button>
      </CardFooter>
    </Card>
  );
}
