"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Search, Mail, Check, AlertCircle, Clock, User, RefreshCw, Copy, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context-v2';
import { Badge } from '@/components/ui/badge';

type InvitationStatus = 
  | 'no_invitation' 
  | 'active' 
  | 'expired' 
  | 'used' 
  | 'user_exists' 
  | 'checking' 
  | 'error';

interface InvitationCheckResult {
  status: InvitationStatus;
  email: string;
  role: string;
  message: string;
  invitation?: {
    token?: string;
    expiresAt?: string;
    createdAt?: string;
    usedAt?: string;
    used?: boolean;
    isExpired?: boolean;
  };
  user?: {
    id: number;
    name: string;
    role: string;
    approved: boolean;
  };
  canInvite?: boolean;
  canReinvite?: boolean;
}

export function InvitationStatusChecker() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('client');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvitationCheckResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleCheck = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = (user?.id ? String(user.id) : null) || storedToken;
      if (!authToken) {
        toast.error('You are not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/check-invitation-status?email=${encodeURIComponent(email)}&role=${role}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data as InvitationCheckResult);
      } else {
        toast.error(extractErrorMessage(data, 'Failed to check invitation status'));
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
      toast.error('An error occurred while checking the invitation status');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (result?.invitation?.token) {
      navigator.clipboard.writeText(result.invitation.token);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (!result) return null;
    
    switch (result.status) {
      case 'no_invitation':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">No Invitation</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expired</Badge>;
      case 'used':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Used</Badge>;
      case 'user_exists':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">User Exists</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    
    switch (result.status) {
      case 'no_invitation':
        return <Mail className="h-8 w-8 text-blue-500" />;
      case 'active':
        return <Check className="h-8 w-8 text-green-500" />;
      case 'expired':
        return <Clock className="h-8 w-8 text-amber-500" />;
      case 'used':
        return <User className="h-8 w-8 text-purple-500" />;
      case 'user_exists':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Search className="w-5 h-5" />
          Check Invitation Status
        </CardTitle>
        <CardDescription>
          Look up the status of an invitation by email and role. Use this to verify if someone has been invited, if the invitation is active, expired, or already used.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="check-email">Email Address</Label>
            <Input
              id="check-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-full sm:w-40 space-y-2">
            <Label htmlFor="check-role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger id="check-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCheck} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className={`rounded-lg border p-6 ${
            result.status === 'no_invitation' ? 'bg-blue-50/50 border-blue-200' :
            result.status === 'active' ? 'bg-green-50/50 border-green-200' :
            result.status === 'expired' ? 'bg-amber-50/50 border-amber-200' :
            result.status === 'used' ? 'bg-purple-50/50 border-purple-200' :
            result.status === 'user_exists' ? 'bg-red-50/50 border-red-200' :
            'bg-gray-50/50 border-gray-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="font-semibold text-lg">{result.email}</h3>
                  {getStatusBadge()}
                  <Badge variant="secondary" className="text-xs">
                    {result.role.charAt(0).toUpperCase() + result.role.slice(1)}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">{result.message}</p>
                
                {/* Invitation Details */}
                {result.invitation && (
                  <div className="space-y-2 text-sm">
                    {result.invitation.token && (
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground">Token:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs font-mono truncate max-w-[200px]">
                          {result.invitation.token.substring(0, 20)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyToken}
                          className="h-7 px-2"
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    {result.invitation.createdAt && (
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground">Created:</span>
                        <span>{new Date(result.invitation.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                    {result.invitation.expiresAt && (
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground">
                          {result.invitation.isExpired ? 'Expired:' : 'Expires:'}
                        </span>
                        <span className={result.invitation.isExpired ? 'text-red-600' : ''}>
                          {new Date(result.invitation.expiresAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {result.invitation.usedAt && (
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground">Used At:</span>
                        <span>{new Date(result.invitation.usedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* User Details */}
                {result.user && (
                  <div className="space-y-2 text-sm mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">Existing User Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-muted-foreground">Name:</span>
                        <span className="ml-2">{result.user.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Role:</span>
                        <span className="ml-2">{result.user.role}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">User ID:</span>
                        <span className="ml-2">{result.user.id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Approved:</span>
                        <span className={`ml-2 ${result.user.approved ? 'text-green-600' : 'text-amber-600'}`}>
                          {result.user.approved ? 'Yes' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Hints */}
                <div className="mt-4 pt-4 border-t">
                  {result.canInvite && (
                    <p className="text-sm text-blue-600 flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      This email can be invited. Use the appropriate invite dialog to send an invitation.
                    </p>
                  )}
                  {result.canReinvite && (
                    <p className="text-sm text-amber-600 flex items-center gap-3">
                      <RefreshCw className="h-4 w-4" />
                      A new invitation can be sent to replace the {result.status === 'expired' ? 'expired' : 'previous'} one.
                    </p>
                  )}
                  {result.status === 'user_exists' && (
                    <p className="text-sm text-red-600 flex items-center gap-3">
                      <AlertCircle className="h-4 w-4" />
                      Cannot send invitation - user already has an account on the platform.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Status Legend</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">No Invitation</Badge>
              <span className="text-muted-foreground">- Never invited</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              <span className="text-muted-foreground">- Pending use</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expired</Badge>
              <span className="text-muted-foreground">- Link expired</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Used</Badge>
              <span className="text-muted-foreground">- Already registered</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">User Exists</Badge>
              <span className="text-muted-foreground">- Has account</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
