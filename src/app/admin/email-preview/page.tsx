'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Smartphone,
  Monitor,
  ExternalLink,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface TemplateOption {
  id: string;
  name: string;
  category: string;
  description: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'anniversary_specialist_update',
    name: '1-Year Milestone: Specialist Profile Update Action',
    category: 'Special Milestone',
    description: 'Official 1-year anniversary notice instructing specialists to update educational background, skills, portfolio, and credentials for administrative review.',
  },
  {
    id: 'anniversary_client_appreciation',
    name: '1-Year Milestone: Client Gratitude & Services Expansion',
    category: 'Special Milestone',
    description: '1-year anniversary letter to clients announcing platform expansion into web dev, data analytics, design, accounting, and business support.',
  },
  {
    id: 'anniversary_all_users_milestone',
    name: '1-Year Milestone: Community Vision (All Users)',
    category: 'Special Milestone',
    description: 'Anniversary celebration email to all registered members outlining TaskLynk vision and expanded capabilities.',
  },
  {
    id: 'registration_approved',
    name: 'Specialist Approved & Onboarding',
    category: 'Onboarding',
    description: 'Sent when an academic specialist/freelancer is vetted and approved by management.',
  },
  {
    id: 'email_job_assigned',
    name: 'Order Assigned to Specialist',
    category: 'Orders',
    description: 'Notification sent when a client project is assigned to a verified specialist.',
  },
  {
    id: 'new_job_posted',
    name: 'New Academic Project Available',
    category: 'Opportunities',
    description: 'Alert sent to specialists matching the domain when a new project is posted.',
  },
  {
    id: 'request_bid',
    name: 'Priority Invitation to Bid',
    category: 'Orders',
    description: 'Urgent project invitation sent to top specialists in a topic area.',
  },
  {
    id: 'email_work_delivered',
    name: 'Work Delivered to Client',
    category: 'Delivery',
    description: 'Notification to client when the specialist finishes and editor approves the deliverable.',
  },
  {
    id: 'email_revision_requested',
    name: 'Revision Request Notice',
    category: 'QA / Editorial',
    description: 'Specific editorial or client revision requirements sent to the assigned writer.',
  },
  {
    id: 'email_payment_confirmed',
    name: 'M-Pesa Payment Receipt',
    category: 'Finance',
    description: 'Instant receipt acknowledging client escrow payment or top-up.',
  },
  {
    id: 'client_registration_request',
    name: 'Client Registration Alert (Admin)',
    category: 'Admin Alert',
    description: 'Internal admin notification when a new institution or researcher requests account access.',
  },
  {
    id: 'email_client_promotional',
    name: 'Client Promotional Campaign',
    category: 'Marketing',
    description: 'Premium branded promotional offer with discount codes and guarantee badges.',
  },
  {
    id: 'email_freelancer_promotional',
    name: 'Specialist Surge Bonus Campaign',
    category: 'Marketing',
    description: 'Incentive email sent to specialists during peak dissertation submission seasons.',
  },
  {
    id: 'email_password_reset',
    name: 'Password Reset Security',
    category: 'Security',
    description: 'Cryptographic password reset link with 60-minute expiry and security guidelines.',
  },
  {
    id: 'email_verify_email',
    name: 'Email Verification OTP Code',
    category: 'Auth',
    description: 'Clean verification code card for new registrations.',
  },
  {
    id: 'registration_restored',
    name: 'Account Restored',
    category: 'Account',
    description: 'Sent when a previously suspended or deactivated account is restored.',
  },
  {
    id: 'admin_activation',
    name: 'Admin Portal Activation',
    category: 'Staff Access',
    description: 'One-time onboarding link for new system administrators.',
  },
];

export default function EmailPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('registration_approved');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState<string>('');
  const [sendingTest, setSendingTest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const previewUrl = `/api/preview-email?template=${selectedTemplate}&standalone=1`;

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/api/preview-email?template=${selectedTemplate}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Preview link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid test email address.');
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch('/api/v2/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: [testEmail.trim()],
          templateId: selectedTemplate,
          variables: {},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch test email');
      toast.success(`Test email sent successfully to ${testEmail}!`);
    } catch (err: any) {
      toast.error(err.message || 'Error sending test email');
    } finally {
      setSendingTest(false);
    }
  };

  const currentTpl = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1A122E] px-4 lg:px-8 py-4 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/email-management"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B3594] dark:text-[#DDD3E9] hover:text-[#FF7A3D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Email Management
            </Link>
            <span className="text-[#DDD3E9] dark:text-[#3A2F5B]">/</span>
            <div className="inline-flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF7A3D]" />
              <h1 className="text-lg font-black text-[#22183D] dark:text-white tracking-tight">
                Live Email Template Previewer
              </h1>
              <Badge className="bg-[#FF7A3D]/15 text-[#FF7A3D] border-[#FF7A3D]/30 text-[10px] font-black uppercase">
                2026 Brand Design
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="inline-flex items-center bg-[#F4EFFB] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-lg p-1">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  deviceView === 'desktop'
                    ? 'bg-white dark:bg-[#1A122E] text-[#22183D] dark:text-white shadow-sm'
                    : 'text-[#6B627A] dark:text-[#DDD3E9] hover:text-[#22183D]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop (650px)
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  deviceView === 'mobile'
                    ? 'bg-white dark:bg-[#1A122E] text-[#22183D] dark:text-white shadow-sm'
                    : 'text-[#6B627A] dark:text-[#DDD3E9] hover:text-[#22183D]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile (375px)
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIframeKey((k) => k + 1)}
              className="border-[#DDD3E9] dark:border-[#3A2F5B]"
              title="Reload template preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            {/* Copy preview URL */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-[#DDD3E9] dark:border-[#3A2F5B] text-xs font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Share URL'}
            </Button>

            {/* Standalone Link */}
            <a
              href={`/api/preview-email?template=${selectedTemplate}&standalone=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#241B3F] hover:bg-[#35255C] text-white rounded-lg text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF7A3D]" />
              Open Standalone Tab
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Template Catalog & Test Dispatcher */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1A122E] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-extrabold flex items-center justify-between">
                  <span>Select Email Template</span>
                  <Badge variant="outline" className="text-[11px] font-bold">
                    {TEMPLATE_OPTIONS.length} Available
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Pick any notification to preview its responsive styling with the official retina logo, trust guarantees, and M-Pesa badges.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const isActive = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                        isActive
                          ? 'border-[#FF7A3D] bg-[#F4EFFB] dark:bg-[#271E42] shadow-sm ring-1 ring-[#FF7A3D]'
                          : 'border-[#EDE5F5] dark:border-[#271E42] hover:border-[#DDD3E9] bg-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-black ${isActive ? 'text-[#FF7A3D]' : 'text-[#22183D] dark:text-white'}`}>
                          {tpl.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#5B3594] dark:text-[#DDD3E9]">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/80 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Send Test Email to My Inbox */}
            <Card className="border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1A122E] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#FF7A3D]" />
                  <span>Send Real Test to Your Inbox</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Dispatch this rendered template to your email address to check rendering in Gmail, Outlook, or Apple Mail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="test-email" className="text-xs font-bold">
                    Recipient Email Address
                  </Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="e.g. your-name@gmail.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="border-[#DDD3E9] dark:border-[#3A2F5B] text-xs"
                  />
                </div>
                <Button
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className="w-full bg-[#FF7A3D] hover:bg-[#E5682C] text-white font-extrabold text-xs shadow-sm"
                >
                  {sendingTest ? (
                    'Sending Test Email...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-2" />
                      Send Live Test Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Brand Design Checklist */}
            <div className="p-4 rounded-xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#F4EFFB]/60 dark:bg-[#1D1533]/60 space-y-2 text-xs">
              <div className="font-extrabold text-[#22183D] dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Email Standard</span>
              </div>
              <ul className="space-y-1.5 text-[#6B627A] dark:text-[#DDD3E9]/90 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  Official Retina logo: <code className="bg-white/80 dark:bg-black/30 px-1 py-0.5 rounded">tl-logo-192.png</code>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  Theme: Option 3 Deep Purple (`#241B3F`) & Orange (`#FF7A3D`)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  3-Pillar Guarantee: Turnitin Zero-AI, Triple-Check QA, Express Delivery
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  M-Pesa Express verified escrow receipt styles
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Responsive Iframe Preview */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#1A122E] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-[#22183D] dark:text-white">
                  {currentTpl?.name}
                </span>
              </div>
              <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9] font-mono">
                {deviceView === 'desktop' ? 'Viewport: 650px (Max Email Width)' : 'Viewport: 375px (iPhone/Mobile)'}
              </div>
            </div>

            {/* Visual Frame */}
            <div className="bg-[#EAE4F2] dark:bg-[#110B1C] p-4 sm:p-8 rounded-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] flex justify-center items-start min-h-[750px] shadow-inner overflow-x-auto">
              <div
                className="transition-all duration-300 ease-in-out bg-white rounded-xl shadow-2xl overflow-hidden border border-[#D5CBE2]"
                style={{
                  width: deviceView === 'desktop' ? '650px' : '375px',
                  maxWidth: '100%',
                }}
              >
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  title="TaskLynk Email Preview"
                  className="w-full h-[760px] border-0"
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
