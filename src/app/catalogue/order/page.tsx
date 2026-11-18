"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  Upload, 
  MessageCircle, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Send,
  Loader2,
  Lock
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context-v2';
import { 
  CATEGORIES, 
  getAllServices, 
  getAllBundles, 
  getServiceBySlug, 
  getBundle 
} from '@/lib/catalogue';
import type { CategorySlug, ServiceKind } from '@/lib/catalogue/types';

function OrderWorkflowInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const preselectedServiceSlug = searchParams.get('service') || '';
  const preselectedBundleSlug = searchParams.get('bundle') || '';
  const preselectedCategory = searchParams.get('category') || '';

  const allServices = getAllServices();
  const allBundles = getAllBundles();

  const [orderType, setOrderType] = useState<'service' | 'bundle'>(
    preselectedBundleSlug ? 'bundle' : 'service'
  );
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(preselectedServiceSlug);
  const [selectedBundleSlug, setSelectedBundleSlug] = useState<string>(preselectedBundleSlug);

  // Common form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [preferredSoftware, setPreferredSoftware] = useState('');
  const [outputFormat, setOutputFormat] = useState('Word Document & Tables (.docx)');

  // Conditional Fields based on Service Kind
  const [researchObjectives, setResearchObjectives] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [variableDefinitions, setVariableDefinitions] = useState('');
  
  // Training conditional fields
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [trainingTiming, setTrainingTiming] = useState('evenings_weekends');
  const [trainingFormat, setTrainingFormat] = useState('one_on_one');

  // Business analytics conditional fields
  const [businessObjective, setBusinessObjective] = useState('');
  const [desiredMetrics, setDesiredMetrics] = useState('');

  // Qualitative fields
  const [recordingDetails, setRecordingDetails] = useState('');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('English');

  const [submitting, setSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<{
    reference: string;
    serviceName: string;
    email: string;
  } | null>(null);

  // Populate client details if user is authenticated
  useEffect(() => {
    if (user) {
      if (user.name && !clientName) setClientName(user.name);
      if (user.email && !clientEmail) setClientEmail(user.email);
      if (user.phone && !clientPhone) setClientPhone(user.phone);
    }
  }, [user]);

  // Determine current active service and its kind
  const currentService = selectedServiceSlug ? getServiceBySlug(selectedServiceSlug) : undefined;
  const currentBundle = selectedBundleSlug ? getBundle(selectedBundleSlug) : undefined;
  const currentKind: ServiceKind | 'general' = currentService ? currentService.kind : 'general';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Please provide your name and email address');
      return;
    }

    if (orderType === 'service' && !selectedServiceSlug) {
      toast.error('Please select a service from the catalogue');
      return;
    }

    if (orderType === 'bundle' && !selectedBundleSlug) {
      toast.error('Please select a service bundle');
      return;
    }

    setSubmitting(true);

    try {
      // Build specific fields object depending on kind
      const specificFields: Record<string, any> = {};
      if (currentKind === 'statistical' || currentKind === 'research') {
        specificFields.researchObjectives = researchObjectives;
        specificFields.sampleSize = sampleSize;
        specificFields.variableDefinitions = variableDefinitions;
      } else if (currentKind === 'training') {
        specificFields.skillLevel = skillLevel;
        specificFields.trainingTiming = trainingTiming;
        specificFields.trainingFormat = trainingFormat;
      } else if (currentKind === 'business') {
        specificFields.businessObjective = businessObjective;
        specificFields.desiredMetrics = desiredMetrics;
      } else if (currentKind === 'qualitative') {
        specificFields.recordingDetails = recordingDetails;
        specificFields.transcriptionLanguage = transcriptionLanguage;
      }

      const payload = {
        serviceSlug: orderType === 'service' ? selectedServiceSlug : null,
        serviceName: currentService?.name || null,
        categorySlug: currentService?.categorySlug || null,
        bundleSlug: orderType === 'bundle' ? selectedBundleSlug : null,
        clientName,
        clientEmail,
        clientPhone,
        deadline,
        projectScope,
        preferredSoftware,
        outputFormat,
        specificFields,
      };

      const res = await fetch('/api/catalogue/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setQuoteSuccess({
        reference: data.quoteReference,
        serviceName: currentService?.name || currentBundle?.name || 'Service Package',
        email: clientEmail,
      });

      toast.success('Quotation request submitted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (quoteSuccess) {
    const whatsAppFollowupUrl = `https://wa.me/254701066845?text=${encodeURIComponent(
      `Hello TaskLynk Support, I have just submitted a quotation request (Ref: ${quoteSuccess.reference}) for ${quoteSuccess.serviceName}. Could you please confirm receipt and provide quotation details?`
    )}`;

    return (
      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-2xl">
        <div className="linen-card rounded-2xl p-6 sm:p-8 shadow-lg text-center">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <Badge variant="outline" className="mb-2 text-xs bg-[#FAF5FE] text-[#5B3A8C] border-[#DDD3E9] font-bold">
            Quote Reference: {quoteSuccess.reference}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white">
            Quotation Request Received!
          </h2>

          <p className="text-sm text-[#5C556C] dark:text-[#B6B0C4] mt-3 leading-relaxed">
            Thank you, <strong>{clientName}</strong>. Our project managers are reviewing your project requirements for <strong>{quoteSuccess.serviceName}</strong>. A customized quotation and timeline will be sent to <strong>{quoteSuccess.email}</strong> shortly.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-[#FAF8FD] dark:bg-[#20183B] text-xs text-left space-y-2 text-muted-foreground border border-[#EDE5F6] dark:border-[#322554]">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Clock className="w-4 h-4 text-[#FF7A3D]" />
              Expected response time: within 2 to 4 hours.
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5B3A8C]" />
              A verified specialist in your discipline will be assigned upon quote confirmation.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-xs rounded-xl"
              size="lg"
            >
              <a href={whatsAppFollowupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Track via WhatsApp with Ref</span>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-xs font-semibold rounded-xl border-[#DDD3E9] dark:border-[#3A2D5C]"
            >
              <Link href="/catalogue">
                Return to Catalogue
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl relative">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="outline" className="mb-2 text-xs bg-[#FAF5FE] text-[#5B3A8C] border-[#DDD3E9] font-bold">
          Coordinated by Dedicated Project Manager
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-[#22183D] dark:text-white tracking-tight">
          Service Order &amp; Quotation Request
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tell us about your project requirements and deadline. We match your brief with a verified specialist and provide a transparent, all-inclusive quotation.
        </p>
      </div>

      <Card className="linen-card rounded-2xl shadow-sm border border-[#DDD3E9] dark:border-[#3A2F5B]">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Selection Mode: Service vs Bundle */}
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#796E8E] dark:text-[#9F93BA]">
                1. Select Service Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('service')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    orderType === 'service'
                      ? 'border-[#FF7A3D] bg-[#FFF5F0] dark:bg-[#2D1B17] text-[#FF7A3D]'
                      : 'border-[#E4DDF0] dark:border-[#2D2347] text-muted-foreground hover:bg-[#FAF8FD]'
                  }`}
                >
                  <span>Individual Service Listing</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#1A132E]">70+ Options</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('bundle')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    orderType === 'bundle'
                      ? 'border-[#5B3A8C] bg-[#F7F2FC] dark:bg-[#23173B] text-[#5B3A8C] dark:text-[#C5B3E6]'
                      : 'border-[#E4DDF0] dark:border-[#2D2347] text-muted-foreground hover:bg-[#FAF8FD]'
                  }`}
                >
                  <span>Service Package / Bundle</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#25D366]/15 text-[#25D366]">Save Up to 20%</span>
                </button>
              </div>

              {/* Service Dropdown */}
              {orderType === 'service' ? (
                <div>
                  <Label htmlFor="serviceSelect" className="text-xs font-semibold text-foreground mb-1 block">
                    Choose Service from Catalogue
                  </Label>
                  <Select
                    value={selectedServiceSlug}
                    onValueChange={(val) => setSelectedServiceSlug(val)}
                  >
                    <SelectTrigger id="serviceSelect" className="h-11 rounded-xl text-xs bg-[#FAF8FD] dark:bg-[#140E24]">
                      <SelectValue placeholder="Select a specific service..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {CATEGORIES.map((cat) => {
                        const svcs = allServices.filter((s) => s.categorySlug === cat.slug);
                        return (
                          <div key={cat.slug} className="p-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 block">
                              {cat.name}
                            </span>
                            {svcs.map((s) => (
                              <SelectItem key={s.slug} value={s.slug} className="text-xs">
                                {s.name}
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* Bundle Dropdown */
                <div>
                  <Label htmlFor="bundleSelect" className="text-xs font-semibold text-foreground mb-1 block">
                    Choose Service Bundle
                  </Label>
                  <Select
                    value={selectedBundleSlug}
                    onValueChange={(val) => setSelectedBundleSlug(val)}
                  >
                    <SelectTrigger id="bundleSelect" className="h-11 rounded-xl text-xs bg-[#FAF8FD] dark:bg-[#140E24]">
                      <SelectValue placeholder="Select a service package..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allBundles.map((b) => (
                        <SelectItem key={b.slug} value={b.slug} className="text-xs">
                          {b.name} (Save {b.discountPercent}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Selected Service Snippet */}
            {currentService && (
              <div className="p-4 rounded-2xl bg-[#FAF8FD] dark:bg-[#20183B] border border-[#EDE5F6] dark:border-[#322554] flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Selected</span>
                  <h4 className="font-bold text-[#22183D] dark:text-white">{currentService.name}</h4>
                  <p className="text-muted-foreground line-clamp-1 mt-0.5">{currentService.summary}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-muted-foreground block">Turnaround</span>
                  <span className="font-bold text-[#FF7A3D]">{currentService.turnaround.split('.')[0]}</span>
                </div>
              </div>
            )}

            {/* 2. Client Contact Information */}
            <div className="space-y-4 pt-4 border-t border-[#F0EAF8] dark:border-[#261B42]">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#796E8E] dark:text-[#9F93BA]">
                2. Contact & Client Details
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientName" className="text-xs font-medium text-foreground mb-1 block">
                    Full Name *
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Sarah Wanjiku"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail" className="text-xs font-medium text-foreground mb-1 block">
                    Email Address *
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientPhone" className="text-xs font-medium text-foreground mb-1 block">
                    Phone / WhatsApp Number
                  </Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* 3. Conditional Requirements based on Service Kind */}
            <div className="space-y-4 pt-4 border-t border-[#F0EAF8] dark:border-[#261B42]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#796E8E] dark:text-[#9F93BA]">
                  3. Project Scope & Specifications
                </Label>
                <span className="text-[11px] text-muted-foreground">Fields adapt to selected service</span>
              </div>

              {/* Deadline & Tool */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deadline" className="text-xs font-medium text-foreground mb-1 block">
                    Target Deadline *
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="preferredSoftware" className="text-xs font-medium text-foreground mb-1 block">
                    Preferred Software / Stack
                  </Label>
                  <Input
                    id="preferredSoftware"
                    value={preferredSoftware}
                    onChange={(e) => setPreferredSoftware(e.target.value)}
                    placeholder={currentService?.tools ? currentService.tools.slice(0, 3).join(', ') : 'e.g., SPSS, Excel, Power BI'}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="outputFormat" className="text-xs font-medium text-foreground mb-1 block">
                    Required Output Format
                  </Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger id="outputFormat" className="h-10 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Word Document & Tables (.docx)" className="text-xs">Word Document & Tables (.docx)</SelectItem>
                      <SelectItem value="Spreadsheet / Workbook (.xlsx)" className="text-xs">Spreadsheet / Workbook (.xlsx)</SelectItem>
                      <SelectItem value="SPSS Dataset & Syntax (.sav / .sps)" className="text-xs">SPSS Dataset & Syntax (.sav / .sps)</SelectItem>
                      <SelectItem value="Power BI Dashboard (.pbix)" className="text-xs">Power BI Dashboard (.pbix)</SelectItem>
                      <SelectItem value="R Markdown / Quarto Script" className="text-xs">R Markdown / Quarto Script</SelectItem>
                      <SelectItem value="Git Source Repository" className="text-xs">Git Source Repository</SelectItem>
                      <SelectItem value="PDF Report & Presentation" className="text-xs">PDF Report & Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional: Statistical / Research */}
              {(currentKind === 'statistical' || currentKind === 'research') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8FD] dark:bg-[#1F1738] border border-[#EBE3F5] dark:border-[#332652]">
                  <div>
                    <Label htmlFor="researchObjectives" className="text-xs font-medium text-foreground mb-1 block">
                      Research Objectives & Hypotheses
                    </Label>
                    <Textarea
                      id="researchObjectives"
                      value={researchObjectives}
                      onChange={(e) => setResearchObjectives(e.target.value)}
                      placeholder="Outline your main research questions, specific objectives, or hypotheses to be tested..."
                      className="text-xs rounded-xl min-h-[70px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sampleSize" className="text-xs font-medium text-foreground mb-1 block">
                      Sample Size & Variables Summary
                    </Label>
                    <Textarea
                      id="sampleSize"
                      value={sampleSize}
                      onChange={(e) => setSampleSize(e.target.value)}
                      placeholder="e.g., 250 respondents, 24 survey items on Likert scale, 4 demographic variables..."
                      className="text-xs rounded-xl min-h-[70px]"
                    />
                  </div>
                </div>
              )}

              {/* Conditional: Training */}
              {currentKind === 'training' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FAF8FD] dark:bg-[#1F1738] border border-[#EBE3F5] dark:border-[#332652]">
                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1 block">Current Skill Level</Label>
                    <Select value={skillLevel} onValueChange={setSkillLevel}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete_beginner" className="text-xs">Complete Beginner</SelectItem>
                        <SelectItem value="intermediate" className="text-xs">Intermediate</SelectItem>
                        <SelectItem value="advanced_refresher" className="text-xs">Advanced / Refresher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1 block">Training Format</Label>
                    <Select value={trainingFormat} onValueChange={setTrainingFormat}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_on_one" className="text-xs">1-on-1 Virtual Coaching</SelectItem>
                        <SelectItem value="small_group" className="text-xs">Small Group Session</SelectItem>
                        <SelectItem value="guided_project" className="text-xs">Guided Hands-On Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1 block">Preferred Availability</Label>
                    <Select value={trainingTiming} onValueChange={setTrainingTiming}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekdays_daytime" className="text-xs">Weekdays Daytime</SelectItem>
                        <SelectItem value="evenings_weekends" className="text-xs">Evenings & Weekends</SelectItem>
                        <SelectItem value="flexible" className="text-xs">Flexible / By Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Conditional: Business Reporting */}
              {currentKind === 'business' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8FD] dark:bg-[#1F1738] border border-[#EBE3F5] dark:border-[#332652]">
                  <div>
                    <Label htmlFor="businessObjective" className="text-xs font-medium text-foreground mb-1 block">
                      Business Goal & Target Decisions
                    </Label>
                    <Textarea
                      id="businessObjective"
                      value={businessObjective}
                      onChange={(e) => setBusinessObjective(e.target.value)}
                      placeholder="What decision or insight should this analysis or dashboard support?"
                      className="text-xs rounded-xl min-h-[70px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="desiredMetrics" className="text-xs font-medium text-foreground mb-1 block">
                      Target Metrics & Key Performance Indicators
                    </Label>
                    <Textarea
                      id="desiredMetrics"
                      value={desiredMetrics}
                      onChange={(e) => setDesiredMetrics(e.target.value)}
                      placeholder="e.g., Monthly recurring revenue, retention rate, regional sales comparison..."
                      className="text-xs rounded-xl min-h-[70px]"
                    />
                  </div>
                </div>
              )}

              {/* General Project Description */}
              <div>
                <Label htmlFor="projectScope" className="text-xs font-medium text-foreground mb-1 block">
                  Detailed Instructions & Scope *
                </Label>
                <Textarea
                  id="projectScope"
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  placeholder="Describe your requirements in detail: data formats, specific questions to answer, deliverables, or supervisor instructions..."
                  className="text-xs rounded-xl min-h-[100px]"
                  required
                />
              </div>

              {/* Data Privacy Notice */}
              <div className="p-3 rounded-xl bg-[#FAF8FD] dark:bg-[#1D1636] border border-[#EDE5F6] dark:border-[#30234E] text-xs text-muted-foreground flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#5B3A8C] shrink-0 mt-0.5" />
                <span>
                  <strong>Data Privacy Guarantee:</strong> Files and briefs are restricted to authorized TaskLynk managers and assigned specialists under strict non-disclosure obligations. You can upload datasets directly after quote confirmation.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 font-bold text-xs bg-[#FF7A3D] hover:bg-[#E9662F] text-white h-11"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Request...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit for Free Quotation
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 text-xs border-[#DDD3E9] dark:border-[#3A2D5C]"
                asChild
              >
                <Link href="/catalogue">
                  Back to Catalogue
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderWorkflowPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />
      <div className="pt-24 flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7A3D]" />
            <p className="text-xs text-muted-foreground mt-2">Loading order workflow...</p>
          </div>
        }>
          <OrderWorkflowInner />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  );
}

