"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, ExternalLink, Link as LinkIcon, CheckCircle, X, Send, Phone, Upload, File as FileIcon, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { FreelancerPreference } from '@/components/FreelancerPreference';
import Link from 'next/link';

// Service Catalog with Updated Pricing
const SERVICE_CATALOG = {
  // Academic & Writing Services - Updated to 240 minimum
  'essay': { name: 'Essay', rate: 240, unit: 'per page', type: 'page', workType: 'Essay' },
  'assignment': { name: 'Assignment', rate: 240, unit: 'per page', type: 'page', workType: 'Assignment' },
  'research-proposal': { name: 'Research Proposal', rate: 240, unit: 'per page', type: 'page', workType: 'Research Proposal' },
  'thesis-writing': { name: 'Thesis Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Thesis Writing' },
  'research-paper': { name: 'Research Paper', rate: 240, unit: 'per page', type: 'page', workType: 'Research Paper' },
  'dissertation': { name: 'Dissertation', rate: 240, unit: 'per page', type: 'page', workType: 'Dissertation' },
  'case-study': { name: 'Case Study', rate: 240, unit: 'per page', type: 'page', workType: 'Case Study' },
  'lab-report': { name: 'Lab Report', rate: 240, unit: 'per page', type: 'page', workType: 'Lab Report' },
  'article-writing': { name: 'Article Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Article Writing' },
  'blog-writing': { name: 'Blog Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Blog Writing' },
  
  // Presentation & Design Services - 150 per slide
  'presentation': { name: 'Presentation', rate: 150, unit: 'per slide', type: 'slide', workType: 'Presentation' },
  'powerpoint-design': { name: 'PowerPoint Design', rate: 150, unit: 'per slide', type: 'slide', workType: 'PowerPoint Design' },
  'slide-design': { name: 'Slide Design', rate: 150, unit: 'per slide', type: 'slide', workType: 'Slide Design' },
  
  // Editing & Quality Improvement
  'grammar-proofreading': { name: 'Grammar & Proofreading', rate: 30, unit: 'per page', type: 'page', category: 'editing', workType: 'Grammar & Proofreading' },
  'ai-content-removal': { name: 'AI Content Removal', rate: 50, unit: 'per page', type: 'page', category: 'editing', workType: 'AI Content Removal' },
  'humanization': { name: 'Humanization', rate: 50, unit: 'per page', type: 'page', category: 'editing', workType: 'Humanization' },
  'plagiarism-ai-detection': { name: 'Plagiarism + AI Detection Report', rate: 30, unit: 'per document', type: 'document', category: 'editing', workType: 'Plagiarism + AI Detection Report' },
  'formatting-referencing': { name: 'Formatting & Referencing', rate: 25, unit: 'per page', type: 'page', category: 'editing', workType: 'Formatting & Referencing' },
  
  // Document Management
  'pdf-editing': { name: 'PDF Editing', rate: 50, unit: 'per page', type: 'page', workType: 'PDF Editing' },
  'document-conversion': { name: 'Document Conversion', rate: 10, unit: 'per file', type: 'file', workType: 'Document Conversion' },
  
  // Data Analysis Services - Technical
  'data-analysis': { name: 'Data Analysis', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'Data Analysis', technical: true },
  'spss': { name: 'SPSS', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'SPSS', technical: true },
  'excel': { name: 'Excel', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'Excel', technical: true },
  'r-programming': { name: 'R Programming', rate: 300, unit: 'per dataset', type: 'dataset', workType: 'R Programming', technical: true },
  'python': { name: 'Python', rate: 300, unit: 'per dataset', type: 'dataset', workType: 'Python', technical: true },
  'stata': { name: 'STATA', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'STATA', technical: true },
  'jasp': { name: 'JASP', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'JASP', technical: true },
  'jamovi': { name: 'JAMOVI', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'JAMOVI', technical: true },
  
  // Design Services
  'infographics': { name: 'Infographics', rate: 150, unit: 'per graphic', type: 'graphic', workType: 'Infographics' },
  'data-visualization': { name: 'Data Visualization', rate: 150, unit: 'per graphic', type: 'graphic', workType: 'Data Visualization' },
  'poster-design': { name: 'Poster Design', rate: 200, unit: 'per design', type: 'design', workType: 'Poster Design' },
  'resume-design': { name: 'Resume Design', rate: 200, unit: 'per design', type: 'design', workType: 'Resume Design' },
  'brochure-design': { name: 'Brochure Design', rate: 200, unit: 'per design', type: 'design', workType: 'Brochure Design' },
  
  // Additional Services
  'revision-support': { name: 'Revision Support', rate: 100, unit: 'per revision', type: 'revision', workType: 'Revision Support' },
  'expert-consultation': { name: 'Expert Consultation', rate: 500, unit: 'per hour', type: 'hour', workType: 'Expert Consultation' },
  'tutoring': { name: 'Tutoring', rate: 500, unit: 'per hour', type: 'hour', workType: 'Tutoring' },
  
  // Other Services
  'other': { name: 'Other', rate: 240, unit: 'per page', type: 'page', workType: 'Other' },

  // Non-Academic / Managed Professional Services
  'website-development': { name: 'Corporate Business Website', rate: 35000, unit: 'project', type: 'project', workType: 'Website Development', category: 'technology' },
  'landing-page': { name: 'High-Converting Landing Page', rate: 15000, unit: 'project', type: 'project', workType: 'Landing Page', category: 'technology' },
  'ecommerce-store': { name: 'E-Commerce Store & M-Pesa', rate: 55000, unit: 'project', type: 'project', workType: 'E-Commerce Store', category: 'technology' },
  'web-application': { name: 'Custom Web Application (Next.js/React)', rate: 65000, unit: 'project', type: 'project', workType: 'Web Application', category: 'technology' },
  'website-maintenance': { name: 'Website Maintenance & Speed Audit', rate: 12000, unit: 'project', type: 'project', workType: 'Website Maintenance', category: 'technology' },
  'software-development': { name: 'Custom Backend API / Software System', rate: 60000, unit: 'project', type: 'project', workType: 'Software Development', category: 'software' },
  'systems-integration': { name: 'Systems & API Integration', rate: 25000, unit: 'project', type: 'project', workType: 'Systems Integration', category: 'software' },
  'database-architecture': { name: 'Database Architecture & Optimization', rate: 30000, unit: 'project', type: 'project', workType: 'Database Architecture', category: 'software' },
  'workflow-automation': { name: 'Business Workflow Automation', rate: 20000, unit: 'project', type: 'project', workType: 'Workflow Automation', category: 'software' },
  'spss-analysis': { name: 'SPSS Statistical Analysis (Chapter 4 + APA Tables)', rate: 8500, unit: 'project', type: 'project', workType: 'SPSS Data Analysis', category: 'data-analytics' },
  'power-bi-dashboard': { name: 'Power BI Business Intelligence Dashboard', rate: 15000, unit: 'project', type: 'project', workType: 'Power BI Dashboard', category: 'data-analytics' },
  'data-cleaning': { name: 'Data Cleaning & Outlier Standardization', rate: 5000, unit: 'project', type: 'project', workType: 'Data Cleaning', category: 'data-processing' },
  'survey-coding': { name: 'Survey Coding & Questionnaire Digitization', rate: 4500, unit: 'project', type: 'project', workType: 'Survey Coding', category: 'data-processing' },
  'brand-identity': { name: 'Brand Identity & Logo System', rate: 18000, unit: 'project', type: 'project', workType: 'Brand Identity', category: 'graphic-design' },
  'corporate-profile-design': { name: 'Corporate Profile / Brochure Design', rate: 12000, unit: 'project', type: 'project', workType: 'Corporate Profile Design', category: 'graphic-design' },
  'pitch-deck-design': { name: 'Investor Pitch Deck & Presentation', rate: 15000, unit: 'project', type: 'project', workType: 'Pitch Deck Design', category: 'graphic-design' },
  'corporate-video': { name: 'Corporate Brand Story / Video Edit', rate: 25000, unit: 'project', type: 'project', workType: 'Corporate Video', category: 'video-production' },
  'social-reels': { name: 'Short-Form Social Media Reels (Vertical)', rate: 8000, unit: 'project', type: 'project', workType: 'Social Media Reels', category: 'video-production' },
  'executive-va': { name: 'Executive Virtual Assistance (Weekly Support)', rate: 15000, unit: 'project', type: 'project', workType: 'Executive Virtual Assistance', category: 'virtual-assistance' },
  'monthly-bookkeeping': { name: 'Monthly Bookkeeping & Bank Reconciliation', rate: 20000, unit: 'project', type: 'project', workType: 'Bookkeeping Support', category: 'accounting-support' },
  'financial-statements': { name: 'Financial Statements (P&L, Balance Sheet)', rate: 15000, unit: 'project', type: 'project', workType: 'Financial Statements', category: 'accounting-support' },
  'business-plan': { name: 'Bank-Ready Business Plan (5-Yr Financials)', rate: 25000, unit: 'project', type: 'project', workType: 'Business Plan', category: 'business-research' },
  'feasibility-study': { name: 'Commercial Feasibility Study', rate: 35000, unit: 'project', type: 'project', workType: 'Feasibility Study', category: 'business-research' },
  'executive-cv': { name: 'Executive CV, Resume & Cover Letter Suite', rate: 5000, unit: 'project', type: 'project', workType: 'Executive CV Suite', category: 'professional-writing' },
  'commercial-contracts': { name: 'Commercial Contract / NDA / MOU Drafting', rate: 10000, unit: 'project', type: 'project', workType: 'Commercial Contracts', category: 'professional-writing' },

};


export const SERVICE_CATEGORIES = [
  { id: 'academic', name: 'Academic Writing & Research', group: 'Academic' },
  { id: 'technology', name: 'Technology & Web Development', group: 'Technology' },
  { id: 'software', name: 'Software Development & Systems', group: 'Technology' },
  { id: 'data-analytics', name: 'Data Analytics & Statistics', group: 'Data' },
  { id: 'data-processing', name: 'Data Processing & Office Productivity', group: 'Data' },
  { id: 'graphic-design', name: 'Graphic Design & Branding', group: 'Design' },
  { id: 'video-production', name: 'Video Production & Editing', group: 'Design' },
  { id: 'virtual-assistance', name: 'Business Administration & Virtual Assistance', group: 'Business' },
  { id: 'accounting-support', name: 'Accounting & Financial Support', group: 'Business' },
  { id: 'business-research', name: 'Research & Business Intelligence', group: 'Business' },
  { id: 'professional-writing', name: 'Professional Writing & Presentations', group: 'Writing' },
];

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestDraft, setRequestDraft] = useState(false);
  const [requestPrintableSources, setRequestPrintableSources] = useState(false);
  const [singleSpaced, setSingleSpaced] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  
  // Files.fm link upload state
  const [stagedLinks, setStagedLinks] = useState<Array<{fileName: string, fileUrl: string}>>([]);
  const [linkInput, setLinkInput] = useState('');
  
  // Direct file upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [customAmountMode, setCustomAmountMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('academic');
  const [preferredSpecialistSlug, setPreferredSpecialistSlug] = useState<string | null>(null);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    accountOrderNumber: '',
    title: '',
    instructions: '',
    serviceType: '',
    quantity: '',
    cpp: '', // Client-set CPP
    amount: '',
    deadline: '',
  });
  
  // CPP validation state - only show error after blur
  const [cppTouched, setCppTouched] = useState(false);
  const [minCpp, setMinCpp] = useState<number | null>(null);
  const [cppError, setCppError] = useState<string>('');

  // Freelancer preference state
  const [preferredFreelancerId, setPreferredFreelancerId] = useState<number | null>(null);
  const [freelancerPreference, setFreelancerPreference] = useState<'preferred' | 'any'>('any');

  // Determine if this is an account client
  const isAccountClient = Boolean((user as any)?.accountId) || user?.role === 'account_owner';
  const [belongsToAccount, setBelongsToAccount] = useState<boolean>(isAccountClient);

  useEffect(() => {
    // Setup broadcast channel for real-time dashboard updates
    const bc = new BroadcastChannel('client_dashboard');
    channelRef.current = bc;
    return () => {
      bc.close();
    };
  }, []);

  // Read preferred freelancer from URL params
  useEffect(() => {
    const preferredFreelancerParam = searchParams.get('preferredFreelancer');
    if (preferredFreelancerParam) {
      const freelancerId = parseInt(preferredFreelancerParam);
      if (!isNaN(freelancerId)) {
        setPreferredFreelancerId(freelancerId);
        setFreelancerPreference('preferred');
        toast.success('Preferred freelancer selected from your history');
      }
    }
    const preferredSpecialistParam = searchParams.get('preferredSpecialist') || searchParams.get('specialist');
    if (preferredSpecialistParam) {
      setPreferredSpecialistSlug(preferredSpecialistParam.trim());
      setFreelancerPreference('preferred');
      toast.success('Preferred specialist attached to your order');
    }
  }, [searchParams]);

  // ?? FIX: Improved order number auto-generation with better naming logic
  const generateOrderNumberFromName = (name: string) => {
    // Extract first name and get first 3 letters (alpha only)
    const firstName = (name || 'USER').trim().split(/\s+/)[0] || 'USER';
    const alphaOnly = firstName.replace(/[^a-zA-Z]/g, '');
    let base = 'USR'; // Default fallback
    
    if (alphaOnly.length >= 3) {
      base = alphaOnly.slice(0, 3).toUpperCase();
    } else if (alphaOnly.length > 0) {
      // If less than 3 letters, pad with 'X'
      base = (alphaOnly + 'XXX').slice(0, 3).toUpperCase();
    }
    
    try {
      // Use user-specific storage key to maintain sequence per user
      const key = user?.id ? `order_seq_${user.id}` : 'order_seq_guest';
      const current = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, String(current));
      const seq = String(current).padStart(4, '0');
      return `${base}${seq}`;
    } catch (err) {
      console.error('[Order Number Generation] Storage error:', err);
      // Fallback to timestamp-based number
      return `${base}${String(Date.now()).slice(-4)}`;
    }
  };

  // Auto-fill order number for regular clients
  useEffect(() => {
    if (!belongsToAccount && user?.name) {
      const generated = generateOrderNumberFromName(user.name);
      setFormData(prev => ({ ...prev, accountOrderNumber: generated }));
    } else if (belongsToAccount) {
      setFormData(prev => ({ ...prev, accountOrderNumber: '' }));
    }
  }, [belongsToAccount, user?.name]);

  // Fetch minimum CPP when service type changes
  useEffect(() => {
    if (formData.serviceType) {
      const service = SERVICE_CATALOG[formData.serviceType as keyof typeof SERVICE_CATALOG];
      if (service) {
        const lowerWorkType = service.workType.toLowerCase();
        const isTechnical = (service as any).technical === true ||
          lowerWorkType.includes('technical') ||
          lowerWorkType.includes('data') ||
          lowerWorkType.includes('spss') ||
          lowerWorkType.includes('excel') ||
          lowerWorkType.includes('stata') ||
          lowerWorkType.includes('python') ||
          lowerWorkType.includes('r programming');

        const minimumForService = service.type === 'slide'
          ? 150
          : (isTechnical ? 270 : 240);

        setMinCpp(minimumForService);
      }
    } else {
      setMinCpp(null);
    }
  }, [formData.serviceType]);

  // Calculate amount based on CPP, quantity, deadline, and single spacing
  const calculateAmount = (cpp: number | string, quantity: string, deadline: string, isSingleSpaced: boolean = false, serviceType?: string) => {
    if (!quantity || !cpp) return 0;

    const qty = parseFloat(quantity);
    const cppValue = typeof cpp === 'string' ? parseFloat(cpp) : cpp;
    
    if (isNaN(qty) || qty <= 0 || isNaN(cppValue) || cppValue <= 0) return 0;

    let baseCpp = cppValue;
    
    // Apply single spacing multiplier for page-based services
    if (isSingleSpaced && serviceType) {
      const service = SERVICE_CATALOG[serviceType as keyof typeof SERVICE_CATALOG];
      if (service && service.type === 'page') {
        baseCpp *= 2;
      }
    }

    let baseAmount = baseCpp * qty;

    // Calculate urgent surcharge (40-60 KES) instead of multiplier
    if (deadline && serviceType) {
      const service = SERVICE_CATALOG[serviceType as keyof typeof SERVICE_CATALOG];
      if (service && (service as any).category !== 'editing') {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDeadline < 8 && hoursUntilDeadline > 0) {
          // Add fixed surcharge: 40-60 KES based on urgency
          if (hoursUntilDeadline < 3) {
            baseAmount += 60; // Very urgent (0-3 hours)
          } else if (hoursUntilDeadline < 5) {
            baseAmount += 50; // Urgent (3-5 hours)
          } else {
            baseAmount += 40; // Moderately urgent (5-8 hours)
          }
        }
      }
    }

    return Math.round(baseAmount * 100) / 100;
  };

  
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setDynamicAnswers({});
    if (catId === 'academic') {
      setFormData(prev => ({ ...prev, serviceType: 'essay', quantity: '1', cpp: '240', amount: '240' }));
    } else {
      const catServices = Object.entries(SERVICE_CATALOG).filter(([_, s]: any) => s.category === catId);
      if (catServices.length > 0) {
        const [defaultKey, defaultSvc]: any = catServices[0];
        setFormData(prev => ({
          ...prev,
          serviceType: defaultKey,
          quantity: '1',
          cpp: '',
          amount: String(defaultSvc.rate || 5000),
        }));
      }
    }
  };

  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, serviceType: value, quantity: '', amount: '', cpp: '' });
    setCustomAmountMode(false);
    setCppTouched(false);
    setCppError('');
  };

  const handleQuantityChange = (value: string) => {
    if (!customAmountMode && formData.cpp && value) {
      const calculatedAmount = calculateAmount(formData.cpp, value, formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), singleSpaced, formData.serviceType);
      setFormData({ ...formData, quantity: value, amount: calculatedAmount > 0 ? calculatedAmount.toString() : '' });
    } else {
      setFormData({ ...formData, quantity: value });
    }
  };

  const handleDeadlineChange = (value: string) => {
    if (!customAmountMode && formData.cpp && formData.quantity) {
      const calculatedAmount = calculateAmount(formData.cpp, formData.quantity, value, singleSpaced, formData.serviceType);
      setFormData({ ...formData, deadline: value, amount: calculatedAmount > 0 ? calculatedAmount.toString() : formData.amount });
    } else {
      setFormData({ ...formData, deadline: value });
    }
  };

  const handleSingleSpacedChange = (checked: boolean) => {
    setSingleSpaced(checked);
    if (!customAmountMode && formData.cpp && formData.quantity) {
      const calculatedAmount = calculateAmount(formData.cpp, formData.quantity, formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), checked, formData.serviceType);
      setFormData({ ...formData, amount: calculatedAmount > 0 ? calculatedAmount.toString() : formData.amount });
    }
  };

  // Handle CPP input change
  const handleCppChange = (value: string) => {
    setCppError('');
    
    // Recalculate amount if quantity is set (deadline not required for basic calc)
    if (!customAmountMode && formData.quantity && value) {
      const calculatedAmount = calculateAmount(value, formData.quantity, formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), singleSpaced, formData.serviceType);
      setFormData(prev => ({ ...prev, cpp: value, amount: calculatedAmount > 0 ? calculatedAmount.toString() : '' }));
    } else {
      setFormData(prev => ({ ...prev, cpp: value }));
    }
  };

  // Handle CPP blur - validate minimum
  const handleCppBlur = () => {
    setCppTouched(true);
    if (!formData.cpp) {
      setCppError('CPP is required');
      return;
    }
    
    const cppValue = parseFloat(formData.cpp);
    if (isNaN(cppValue) || cppValue <= 0) {
      setCppError('CPP must be a positive number');
      return;
    }
    
    if (minCpp !== null && cppValue < minCpp) {
      setCppError(`Rate is below minimum threshold. Please increase your rate.`);
      return;
    }
    
    setCppError('');
  };

  const handleCustomAmountChange = (value: string) => {
    const enteredAmount = parseFloat(value);
    const minAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced);
    if (value && !isNaN(enteredAmount) && enteredAmount < minAmount) {
      toast.error(`Amount cannot be less than computed price: KSh ${minAmount.toFixed(2)}`);
    }
    setFormData({ ...formData, amount: value });
  };

  const toggleCustomAmount = () => {
    if (!customAmountMode) {
      setCustomAmountMode(true);
      toast.info('You can now set a custom amount (must not be less than computed price)');
    } else {
      setCustomAmountMode(false);
      const calculatedAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced);
      setFormData({ ...formData, amount: calculatedAmount.toString() });
      toast.info('Switched back to automatic price calculation');
    }
  };

  const isValidFilesFmLink = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('files.fm');
    } catch {
      return false;
    }
  };

  const handleAddLinkToStaging = () => {
    if (!linkInput.trim()) {
      toast.error('Please enter a files.fm link');
      return;
    }
    if (!isValidFilesFmLink(linkInput)) {
      toast.error('Please enter a valid files.fm link (e.g., https://files.fm/...)');
      return;
    }
    if (stagedLinks.some(link => link.fileUrl === linkInput.trim())) {
      toast.error('This link has already been added');
      return;
    }
    let fileName = 'Shared File';
    try {
      const urlObj = new URL(linkInput);
      const pathParts = urlObj.pathname.split('/');
      fileName = pathParts[pathParts.length - 1] || 'Shared File';
    } catch {}
    setStagedLinks([...stagedLinks, { fileName, fileUrl: linkInput.trim() }]);
    setLinkInput('');
    toast.success('Link added to list');
  };

  const removeStagedLink = (index: number) => {
    setStagedLinks(stagedLinks.filter((_, i) => i !== index));
    toast.info('Link removed from list');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) selected`);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      const quantity = parseFloat(formData.quantity);
      const amount = parseFloat(formData.amount);
      const cppValue = parseFloat(formData.cpp || '0');
      const minAmount = formData.cpp && formData.quantity && formData.deadline 
        ? calculateAmount(formData.cpp, formData.quantity, formData.deadline, singleSpaced, formData.serviceType)
        : 0;

      console.log({
        title: formData.title,
        serviceType: formData.serviceType,
        quantity,
        amount,
        minAmount,
      });

      // ?? FIX: More flexible quantity validation
      const selectedService = SERVICE_CATALOG[formData.serviceType as keyof typeof SERVICE_CATALOG];
      
      // Only require quantity for page/slide-based services
      if (selectedService && (selectedService.type === 'page' || selectedService.type === 'slide')) {
        if (!quantity || quantity <= 0) {
          console.error('[Order Placement] ? Invalid quantity:', quantity);
          setError(`Please enter the number of ${selectedService.type === 'page' ? 'pages' : 'slides'}`);
          setLoading(false);
          return;
        }
      }

      if (!amount || amount <= 0) {
        console.error('[Order Placement] ? Invalid amount:', amount);
        setError('Please enter the order amount (KSh)');
        setLoading(false);
        return;
      }

      // ?? FIX: Relax amount validation - warn but allow submission
      if (customAmountMode && amount < minAmount) {
        console.warn('[Order Placement] ?? Amount below computed minimum:', amount, 'vs min:', minAmount);
        // Allow submission but show warning
        toast.warning(`Amount is below recommended minimum of KSh ${minAmount.toFixed(2)}. Admin will review pricing.`);
      }

      if (belongsToAccount && !formData.accountOrderNumber.trim()) {
        console.error('[Order Placement] ? Missing account order number');
        setError('Order Number is required for account clients');
        setLoading(false);
        return;
      }

      const actualDeadline = new Date(formData.deadline);
      const now = new Date();
      const totalTime = actualDeadline.getTime() - now.getTime();
      const freelancerTime = totalTime * 0.6;
      const freelancerDeadline = new Date(now.getTime() + freelancerTime);

      // Use the selectedService variable already declared above
      const backendWorkType = selectedService ? selectedService.workType : formData.serviceType;

      // Use client-set CPP, fallback to service rate if not set
      const baseCpp = cppValue > 0 ? cppValue : (selectedService ? selectedService.rate : 0);
      const effectiveCpp = singleSpaced && selectedService?.type === 'page' ? baseCpp * 2 : baseCpp;
      
      // Validate CPP if required (only for page/slide/dataset services)
      if (selectedService && (selectedService.type === 'page' || selectedService.type === 'slide' || selectedService.type === 'dataset')) {
        if (!formData.cpp || parseFloat(formData.cpp) <= 0) {
          setError('Please enter a valid CPP (Cost Per Page/Slide/Dataset)');
          setLoading(false);
          return;
        }
        
        // ?? STRICT VALIDATION: Block submission if CPP is below minimum
        if (minCpp !== null && parseFloat(formData.cpp) < minCpp) {
          setError(`Your rate is below the minimum threshold. Please increase your rate and try again.`);
          setLoading(false);
          return;
        }
      }

      const orderPayload = {
        clientId: user?.id,
        title: formData.title,
        instructions: formData.instructions,
        workType: backendWorkType,
        pages: selectedService && selectedService.type === 'page' ? parseFloat(formData.quantity) : null,
        slides: selectedService && selectedService.type === 'slide' ? parseFloat(formData.quantity) : null,
        amount: parseFloat(formData.amount),
        deadline: actualDeadline.toISOString(),
        actualDeadline: actualDeadline.toISOString(),
        freelancerDeadline: freelancerDeadline.toISOString(),
        requestDraft,
        requestPrintableSources,
        singleSpaced,
        baseCpp,
        effectiveCpp,
        clientCpp: cppValue > 0 ? cppValue : null, // Client-set CPP
        accountOrderNumber: formData.accountOrderNumber || undefined,
        accountLinked: belongsToAccount,
        // Freelancer preference
        preferredFreelancerId: freelancerPreference === 'preferred' ? preferredFreelancerId : null,
        preferredSpecialistSlug: freelancerPreference === 'preferred' ? preferredSpecialistSlug : null,
        freelancerPreference: freelancerPreference,
      };


      // Step 1: Create the job
      const jobResponse = await safeApiFetch('/api/v2/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify(orderPayload),
      });

      if (!jobResponse.ok) {
        const data = await jobResponse.json().catch(() => ({}));
        console.error('[Order Placement] ? API Error:', {
          status: jobResponse.status,
          statusText: jobResponse.statusText,
          error: data.error,
          code: data.code ?? data?.error?.code,
          details: data
        });
        
        // Provide user-friendly error messages
        const extractedMessage = extractErrorMessage(data, 'Failed to create order');
        const extractedCode = (typeof data?.code === 'string'
          ? data.code
          : typeof data?.error?.code === 'string'
            ? data.error.code
            : undefined);
        
        // Ensure we always have a string message (never render objects)
        let userMessage = String(extractedMessage || 'Failed to create order. Please try again.');
        
        // Translate error codes to friendly messages
        if (extractedCode === 'AMOUNT_BELOW_MINIMUM' || extractedCode === 'CLIENT_CPP_BELOW_MINIMUM') {
          userMessage = `Your rate is below the minimum threshold. Please adjust your pricing.`;
        } else if (extractedCode === 'MISSING_ACCOUNT_ORDER_NUMBER') {
          userMessage = 'Please enter your account order number (e.g., EP2025001)';
        } else if (extractedCode === 'ORDER_NUMBER_EXISTS' || extractedCode === 'DUPLICATE_ENTRY') {
          userMessage = 'This order number already exists. Please try again with a different number.';
        } else if (extractedCode === 'UNAUTHORIZED' || extractedCode === 'ACCOUNT_NOT_APPROVED') {
          userMessage = extractedMessage; // Use exact server message for auth/approval issues
          if (extractedCode === 'UNAUTHORIZED') {
            setTimeout(() => router.push('/login'), 2000);
          }
        } else if (extractedCode === 'DATABASE_ERROR' || extractedCode === 'DATABASE_CONNECTION_ERROR') {
          userMessage = 'Database error. Please try again in a moment.';
        } else if (extractedCode === 'TIMEOUT_ERROR') {
          userMessage = 'Request timed out. Please check your connection and try again.';
        }
        
        setError(userMessage);
        toast.error(userMessage);
        setLoading(false);
        return;
      }

      const createdJobResponse = await jobResponse.json();
      const createdJob = (createdJobResponse?.data?.order || createdJobResponse?.order || createdJobResponse) as any;

      if (!createdJob?.id) {
        throw new Error('Order created but missing id in response');
      }

      try {
        channelRef.current?.postMessage({ type: 'jobCreated', jobId: createdJob.id });
      } catch {}

      // Step 2: Upload files (if any)
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        toast.info(`Uploading ${selectedFiles.length} file(s)...`);
        
        let uploadedCount = 0;
        let failedCount = 0;
        
        for (const file of selectedFiles) {
          try {
            // Validate file size client-side before upload
            const maxSize = 40 * 1024 * 1024; // 40MB
            if (file.size > maxSize) {
              console.error('[File Upload] ? File too large:', file.name, formatFileSize(file.size));
              toast.error(`File too large: ${file.name} (${formatFileSize(file.size)}). Max size is 40MB.`);
              failedCount++;
              continue;
            }

            const fd = new FormData();
            fd.append('file', file);
            fd.append('jobId', createdJob.id.toString());
            fd.append('folder', 'tasklynk/uploads');


            const uploadResponse = await safeApiFetch('/api/cloudinary/upload', {
              method: 'POST',
              body: fd,
              credentials: 'include', // ?? CRITICAL: Include auth cookies
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
              console.error('[File Upload] ? Upload failed:', file.name, errorData);
              toast.error(`Failed to upload ${file.name}: ${extractErrorMessage(errorData, 'Unknown error')}`);
              failedCount++;
              continue;
            }

            const uploadData = await uploadResponse.json();

            // Save file metadata to database
            const attachmentPayload = {
              fileName: file.name,
              fileUrl: uploadData.url,
              fileSize: file.size,
              fileType: file.type || 'application/octet-stream',
              uploadType: 'initial',
              uploadedBy: user?.id,
            };

            const attachmentResponse = await safeApiFetch(`/api/jobs/${createdJob.id}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Ensure cookies are sent
              body: JSON.stringify(attachmentPayload),
            });

            if (!attachmentResponse.ok) {
              const attachError = await attachmentResponse.json().catch(() => ({ error: 'Failed to save' }));
              console.error('[File Upload] ? Failed to save metadata:', file.name, attachError);
              toast.error(`Uploaded but failed to save: ${file.name}`);
              failedCount++;
            } else {
              uploadedCount++;
            }
          } catch (err) {
            console.error('[File Upload] ? Exception:', err);
            toast.error(`Error uploading: ${file.name}`);
            failedCount++;
          }
        }
        
        
        if (uploadedCount > 0) {
          toast.success(`${uploadedCount} file(s) uploaded successfully!`);
        }
        if (failedCount > 0) {
          toast.error(`${failedCount} file(s) failed to upload.`);
        }
        setUploadingFiles(false);
      }

      // Step 3: Send files.fm links as messages (if any)
      if (stagedLinks.length > 0) {
        toast.info('Submitting links as messages...');
        for (const link of stagedLinks) {
          try {
            await safeApiFetch(`/api/jobs/${createdJob.id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Ensure cookies are sent
              body: JSON.stringify({
                senderId: user?.id,
                message: link.fileUrl,
                messageType: 'link',
              }),
            });
          } catch (err) {
            console.error('[Order Placement] ? Failed to send link:', err);
          }
        }
      }

      // Success message
      const fileCount = selectedFiles.length;
      const linkCount = stagedLinks.length;
      
      if (fileCount > 0 || linkCount > 0) {
        toast.success(`Job posted successfully! ${fileCount > 0 ? `${fileCount} file(s) uploaded, ` : ''}${linkCount > 0 ? `${linkCount} link(s) submitted and ` : ''}awaiting admin approval.`);
      } else {
        toast.success('Job posted successfully! Awaiting admin approval.');
      }

      // Optional aggregate conversion event: only after the order API succeeds.
      void import('@/lib/alex/analytics-client').then(({ trackAlex }) => trackAlex('order_created')).catch(() => undefined);

      // ?? FIX: Use window.location for reliable navigation after order submission
      // This prevents the error page from showing by doing a full page reload
      window.location.href = '/client/dashboard';
      
      // Keep loading state true during navigation to prevent state updates
      return;
    } catch (err) {
      console.error('[Order Placement] ? CRITICAL ERROR:', err);
      console.error('[Order Placement] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const selectedService = formData.serviceType ? SERVICE_CATALOG[formData.serviceType as keyof typeof SERVICE_CATALOG] : null;
  const showSingleSpacingOption = selectedService?.type === 'page';

  // Check if user is approved
  const isApproved = user?.approved && (user?.status === 'active' || user?.status === 'approved');

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Create New Project</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
              Live Bidding Queue
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit your research prompt or academic instructions to get matched with verified specialists
            {preferredSpecialistSlug && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Preferred Specialist: {preferredSpecialistSlug.replace(/-/g, ' ')}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border text-xs font-semibold">
            <Link href="/client/pricing-calculator" className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>CPP Calculator</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/client/dashboard">
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      {/* Approval Status Warning */}
      {!isApproved && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs py-2.5">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Account Verification Pending:</strong> Your client profile is being reviewed by our compliance team. 
            You can compose orders now; matching will start immediately upon approval.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-xl border border-border/70 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground">Job Specifications &amp; Instructions</CardTitle>
          <CardDescription className="text-xs">
            Provide clear criteria to get accurate bids. Title and instructions are required; file attachments are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account ownership toggle */}
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="belongsToAccount"
                checked={belongsToAccount}
                onCheckedChange={(c) => setBelongsToAccount(Boolean(c))}
                disabled={loading || isAccountClient}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="belongsToAccount" className="cursor-pointer font-semibold">
                  {isAccountClient ? '? Account Client (Automatic)' : 'Account Order? (Check if you have an external order number)'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isAccountClient
                    ? 'Your profile is linked to an account. Order number entry is enabled.'
                    : 'Check Yes if you have an external platform order number (e.g., from EssayPro). Otherwise leave unchecked for auto-generated order numbers.'}
                </p>
              </div>
            </div>

            {/* Order Number Field */}
            <div className="space-y-2">
              <Label htmlFor="accountOrderNumber">
                Order Number {belongsToAccount && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id="accountOrderNumber"
                placeholder={belongsToAccount ? 'Enter your account order number (e.g., EP2025001)' : 'Auto-generated from your name'}
                value={formData.accountOrderNumber}
                onChange={(e) => setFormData({ ...formData, accountOrderNumber: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                required={belongsToAccount}
                disabled={loading || !belongsToAccount}
                className={!belongsToAccount ? 'bg-muted' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {belongsToAccount
                  ? 'Enter the order number from your external account (e.g., EssayPro order number)'
                  : `This is your auto-generated order number. It cannot be changed.`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Research Paper on Climate Change"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Work Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={handleServiceTypeChange}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="research-proposal">Research Proposal</SelectItem>
                  <SelectItem value="thesis-writing">Thesis Writing</SelectItem>
                  <SelectItem value="research-paper">Research Paper</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="powerpoint-design">PowerPoint Design</SelectItem>
                  <SelectItem value="slide-design">Slide Design</SelectItem>
                  <SelectItem value="dissertation">Dissertation</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="lab-report">Lab Report</SelectItem>
                  <SelectItem value="article-writing">Article Writing</SelectItem>
                  <SelectItem value="blog-writing">Blog Writing</SelectItem>
                  <SelectItem value="grammar-proofreading">Grammar & Proofreading</SelectItem>
                  <SelectItem value="ai-content-removal">AI Content Removal</SelectItem>
                  <SelectItem value="humanization">Humanization</SelectItem>
                  <SelectItem value="plagiarism-ai-detection">Plagiarism + AI Detection Report</SelectItem>
                  <SelectItem value="formatting-referencing">Formatting & Referencing</SelectItem>
                  <SelectItem value="pdf-editing">PDF Editing</SelectItem>
                  <SelectItem value="document-conversion">Document Conversion</SelectItem>
                  <SelectItem value="file-compression">File Compression</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="spss">SPSS</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="r-programming">R Programming</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="stata">STATA</SelectItem>
                  <SelectItem value="jasp">JASP</SelectItem>
                  <SelectItem value="jamovi">JAMOVI</SelectItem>
                  <SelectItem value="infographics">Infographics</SelectItem>
                  <SelectItem value="data-visualization">Data Visualization</SelectItem>
                  <SelectItem value="poster-design">Poster Design</SelectItem>
                  <SelectItem value="resume-design">Resume Design</SelectItem>
                  <SelectItem value="brochure-design">Brochure Design</SelectItem>
                  <SelectItem value="revision-support">Revision Support</SelectItem>
                  <SelectItem value="expert-consultation">Expert Consultation</SelectItem>
                  <SelectItem value="tutoring">Tutoring</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  {selectedService.name} service - Set your preferred rate below
                </p>
              )}
            </div>

            {/* CPP Input Field - Only show for page/slide/dataset services */}
            {selectedCategory === 'academic' && selectedService && (selectedService.type === 'page' || selectedService.type === 'slide' || selectedService.type === 'dataset') && (
              <div className="space-y-2">
                <Label htmlFor="cpp">
                  {selectedService.type === 'slide' ? 'Cost Per Slide' : 'Cost Per Page/Unit'} *
                </Label>
                <Input
                  id="cpp"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={selectedService.type === 'slide' ? 'Cost Per Slide' : 'Cost Per Page/Unit'}
                  value={formData.cpp}
                  onChange={(e) => handleCppChange(e.target.value)}
                  onBlur={handleCppBlur}
                  required
                  disabled={loading}
                  className={cppTouched && cppError ? 'border-red-500' : ''}
                />
                {cppTouched && cppError && (
                  <p className="text-xs text-red-600">{cppError}</p>
                )}
                {cppTouched && !cppError && formData.cpp && (
                  <p className="text-xs text-green-600">? Valid rate</p>
                )}
              </div>
            )}

            {selectedService && (
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {selectedService.type === 'page' && 'Number of Pages'}
                  {selectedService.type === 'slide' && 'Number of Slides'}
                  {selectedService.type === 'dataset' && 'Number of Datasets'}
                  {selectedService.type === 'document' && 'Number of Documents'}
                  {selectedService.type === 'graphic' && 'Number of Graphics'}
                  {selectedService.type === 'design' && 'Number of Designs'}
                  {selectedService.type === 'file' && 'Number of Files'}
                  {selectedService.type === 'hour' && 'Number of Hours'}
                  {selectedService.type === 'revision' && 'Number of Revisions'}
                  *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={selectedService.type === 'page' ? '0.1' : '1'}
                  step={selectedService.type === 'page' ? '0.1' : selectedService.type === 'hour' ? '0.5' : '1'}
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* NEW: Single Spacing Checkbox - Only for page-based services */}
            {showSingleSpacingOption && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <Checkbox
                  id="singleSpaced"
                  checked={singleSpaced}
                  onCheckedChange={(c) => handleSingleSpacedChange(Boolean(c))}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="singleSpaced" className="cursor-pointer font-semibold">Single Spaced (Doubles CPP)</Label>
                  <p className="text-xs text-muted-foreground">
                    Check this if your document should be single-spaced instead of double-spaced. 
                    This will double the cost per page (CPP). For example, 2 pages at KSh 250/page becomes KSh 500/page when single-spaced.
                  </p>
                  {singleSpaced && formData.cpp && (
                    <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Single spacing applied:</strong> Base CPP of KSh {parseFloat(formData.cpp).toFixed(2)} is now KSh {(parseFloat(formData.cpp) * 2).toFixed(2)} per page
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                required
                disabled={loading}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                The final deadline for your completed work
              </p>
            </div>

            {/* Automated Price Calculation Display - Updated to use client-set CPP */}
            {formData.amount && selectedService && formData.quantity && formData.cpp && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-primary">Price Calculation</h3>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  {selectedService.type === 'page' || selectedService.type === 'slide' || selectedService.type === 'dataset' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Cost Per Page:</span>
                        <span className="font-medium">KSh {parseFloat(formData.cpp).toFixed(2)} {selectedService.type === 'page' ? 'per page' : selectedService.type === 'slide' ? 'per slide' : 'per dataset'}</span>
                      </div>
                      {singleSpaced && selectedService.type === 'page' && (
                        <div className="flex justify-between text-sm">
                          <span>Single Spacing Multiplier:</span>
                          <span className="font-medium text-yellow-600">×2 (KSh {(parseFloat(formData.cpp) * 2).toFixed(2)}/page)</span>
                        </div>
                      )}
                    </>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20">
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                      <span>Computed Amount:</span>
                      <span className="font-medium">
                        KSh {formData.cpp && formData.quantity ? calculateAmount(formData.cpp, formData.quantity, formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), singleSpaced, formData.serviceType).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Amount Toggle and Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Payment Amount</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleCustomAmount}
                      disabled={loading}
                    >
                      {customAmountMode ? 'Use Auto Amount' : 'Set Custom Amount'}
                    </Button>
                  </div>

                  {customAmountMode ? (
                    <div className="space-y-2">
                      <Label htmlFor="customAmount">
                        Custom Amount (KSh) *
                      </Label>
                      <Input
                        id="customAmount"
                        type="number"
                        min={formData.cpp && formData.quantity && formData.deadline ? calculateAmount(formData.cpp, formData.quantity, formData.deadline, singleSpaced, formData.serviceType) : 0}
                        step="0.01"
                        placeholder={formData.cpp && formData.quantity && formData.deadline ? `Minimum: ${calculateAmount(formData.cpp, formData.quantity, formData.deadline, singleSpaced, formData.serviceType).toFixed(2)}` : 'Enter amount'}
                        value={formData.amount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        required
                        disabled={loading}
                        className="text-lg font-semibold"
                      />
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Calculated: KSh {formData.cpp && formData.quantity && formData.deadline ? calculateAmount(formData.cpp, formData.quantity, formData.deadline, singleSpaced, formData.serviceType).toFixed(2) : '0.00'}</strong>
                          <br />
                          You can set a higher amount to incentivize quality work.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Final Payment Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          KSh {formData.amount && !isNaN(parseFloat(formData.amount)) ? parseFloat(formData.amount).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.amount && !isNaN(parseFloat(formData.amount)) ? 'Click "Set Custom Amount" to modify this amount' : 'Enter CPP and quantity to calculate amount'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions *</Label>
              <Textarea
                id="instructions"
                placeholder="Provide detailed instructions for the writer..."
                rows={8}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include topic, formatting requirements, citation style, and any other important details
              </p>
            </div>

            {/* Draft Request Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requestDraft" 
                checked={requestDraft}
                onCheckedChange={(checked) => setRequestDraft(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="requestDraft" 
                className="text-sm font-normal cursor-pointer"
              >
                Request a draft before final submission
              </Label>
            </div>

            {/* NEW: Request Printable Sources Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requestPrintableSources" 
                checked={requestPrintableSources}
                onCheckedChange={(checked) => setRequestPrintableSources(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="requestPrintableSources" 
                className="text-sm font-normal cursor-pointer"
              >
                Request printable sources with the final submission
              </Label>
            </div>

            {/* Freelancer Preference Selection */}
            {user?.id && (
              <FreelancerPreference
                clientId={user.id}
                onSelect={(freelancerId, preference) => {
                  setPreferredFreelancerId(freelancerId);
                  setFreelancerPreference(preference);
                }}
                disabled={loading}
              />
            )}

            {/* ENHANCED FILE UPLOAD SECTION - Now clearly marked as optional */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Attach Files (Optional)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can submit the job without files and add them later if needed
                  </p>
                </div>
              </div>

              {/* DIRECT FILE UPLOAD - NOW ENABLED */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/30">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Upload Files Directly</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 40MB per file. Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, PNG, JPG
                    </p>
                  </div>

                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept="*/*"
                    disabled={loading || uploadingFiles}
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={loading || uploadingFiles}
                    className="w-full"
                    variant="outline"
                  >
                    <FileIcon className="w-4 h-4 mr-2" />
                    Select Files to Upload
                  </Button>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Selected files ({selectedFiles.length}):</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-background p-4 rounded border">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileIcon className="w-4 h-4 flex-shrink-0 text-primary" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedFile(index)}
                              disabled={loading || uploadingFiles}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FILES.FM LINK UPLOAD - ALTERNATIVE METHOD */}
              <div className="border-2 border-green-500 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium mb-1">?? Alternative: Share files via Files.fm</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Upload your files to <a href="https://files.fm" target="_blank" rel="noopener noreferrer" className="underline">Files.fm</a></li>
                      <li>Copy the Files.fm link</li>
                      <li>Paste the link below and click "Add to List"</li>
                      <li>Links will be submitted with your job and sent to admin for approval</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="link-input" className="text-green-800 dark:text-green-200">
                      Files.fm Link
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="link-input"
                        type="url"
                        placeholder="https://files.fm/..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLinkToStaging();
                          }
                        }}
                        disabled={loading}
                        className="flex-1 bg-white dark:bg-gray-900"
                      />
                      <Button
                        type="button"
                        onClick={handleAddLinkToStaging}
                        disabled={loading || !linkInput.trim()}
                        className="gap-3 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Add to List
                      </Button>
                    </div>
                  </div>

                  {/* Staged Links Display */}
                  {stagedLinks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-green-300 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          ?? Links Ready to Submit ({stagedLinks.length})
                        </p>
                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300">
                          <Send className="w-4 h-4 mr-1" />
                          Will be submitted with job
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stagedLinks.map((link, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {link.fileName}
                              </p>
                              <a
                                href={link.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-700 hover:underline break-all inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.fileUrl}
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStagedLink(index)}
                              disabled={loading}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Summary */}
              {(selectedFiles.length > 0 || stagedLinks.length > 0) && (
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Ready to submit:</strong> {selectedFiles.length} file(s) + {stagedLinks.length} link(s)
                    {stagedLinks.length > 0 && ' (links require admin approval)'}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{String(error)}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={!isApproved || loading || uploadingFiles} className="flex-1">
                {!isApproved ? (
                  'Account Pending Approval'
                ) : uploadingFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Files...
                  </>
                ) : loading ? (
                  'Submitting...'
                ) : (
                  `Submit Job${selectedFiles.length + stagedLinks.length > 0 ? ` with ${selectedFiles.length + stagedLinks.length} attachment(s)` : ''}`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || uploadingFiles}
              >
                Cancel
              </Button>
            </div>

            {/* Call Us Button */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-3 text-muted-foreground mb-3">
                <span className="text-sm">Need help? Call us directly:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="tel:0701066845"
                  className="flex-1"
                >
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full gap-3 hover:bg-green-50 dark:hover:bg-green-950 border-green-500 text-green-700 dark:text-green-400"
                  >
                    <Phone className="w-4 h-4" />
                    0701066845
                  </Button>
                </a>
                <a 
                  href="tel:0702794172"
                  className="flex-1"
                >
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full gap-3 hover:bg-green-50 dark:hover:bg-green-950 border-green-500 text-green-700 dark:text-green-400"
                  >
                    <Phone className="w-4 h-4" />
                    0702794172
                  </Button>
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
