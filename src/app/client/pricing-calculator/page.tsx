"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Calculator, 
  Loader2, 
  ArrowLeft, 
  FileText, 
  Presentation, 
  Database, 
  HelpCircle,
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface PricingMinimum {
  id: number;
  serviceType: string;
  minCpp: number;
  technicalBonus: number;
  isActive: boolean;
}

interface EstimateResult {
  serviceType: string;
  quantity: number;
  unitType: string;
  baseRate: number;
  technicalBonus: number;
  effectiveRate: number;
  subtotal: number;
  discount: number;
  total: number;
}

const SERVICE_TYPES = [
  { value: 'essay', label: 'Essay / General Writing', icon: FileText, unitType: 'pages' },
  { value: 'research_paper', label: 'Research Paper', icon: FileText, unitType: 'pages' },
  { value: 'dissertation', label: 'Dissertation / Thesis', icon: FileText, unitType: 'pages' },
  { value: 'case_study', label: 'Case Study', icon: FileText, unitType: 'pages' },
  { value: 'presentation', label: 'Presentation', icon: Presentation, unitType: 'slides' },
  { value: 'data_analysis', label: 'Data Analysis (Technical)', icon: Database, unitType: 'pages' },
  { value: 'excel_work', label: 'Excel / Spreadsheet Work', icon: Database, unitType: 'pages' },
  { value: 'spss_analysis', label: 'SPSS Analysis', icon: Database, unitType: 'pages' },
  { value: 'other', label: 'Other', icon: HelpCircle, unitType: 'pages' },
];

export default function PricingCalculatorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Pricing data
  const [pricingMinimums, setPricingMinimums] = useState<PricingMinimum[]>([]);
  const [clientDiscount, setClientDiscount] = useState<number>(0);
  
  // Form state
  const [serviceType, setServiceType] = useState('essay');
  const [quantity, setQuantity] = useState<number>(1);
  const [isTechnical, setIsTechnical] = useState(false);
  
  // Result
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/login');
        return;
      }
      fetchPricingData();
    }
  }, [user, authLoading, router]);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      // Fetch pricing minimums
      const pricingResponse = await safeApiFetch('/api/v2/admin/pricing-minimums', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      
      if (pricingResponse.ok) {
        const data = await pricingResponse.json();
        setPricingMinimums(data.pricingMinimums || []);
      }
      
      // Fetch client profile for discount
      if (user) {
        const profileResponse = await safeApiFetch(`/api/v2/client/profile?userId=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setClientDiscount(profileData.profile?.recurringClientDiscount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = () => {
    setCalculating(true);
    
    try {
      // Find pricing minimum for selected service type
      const pricing = pricingMinimums.find(p => 
        p.serviceType.toLowerCase().replace(/[_\s]/g, '') === serviceType.toLowerCase().replace(/[_\s]/g, '')
      );
      
      // Default rates if not found
      const baseRate = pricing?.minCpp || 240;
      const technicalBonus = isTechnical ? (pricing?.technicalBonus || 30) : 0;
      const effectiveRate = baseRate + technicalBonus;
      
      const subtotal = effectiveRate * quantity;
      const discountAmount = (subtotal * clientDiscount) / 100;
      const total = subtotal - discountAmount;
      
      const serviceConfig = SERVICE_TYPES.find(s => s.value === serviceType);
      
      setEstimate({
        serviceType: serviceConfig?.label || serviceType,
        quantity,
        unitType: serviceConfig?.unitType || 'pages',
        baseRate,
        technicalBonus,
        effectiveRate,
        subtotal,
        discount: discountAmount,
        total,
      });
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Failed to calculate estimate');
    } finally {
      setCalculating(false);
    }
  };

  const handleServiceTypeChange = (value: string) => {
    setServiceType(value);
    // Auto-detect technical work types
    const technicalTypes = ['data_analysis', 'excel_work', 'spss_analysis'];
    setIsTechnical(technicalTypes.includes(value));
    setEstimate(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">CPP &amp; Order Calculator</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
              Live Rates
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get an instant cost estimate for essays, presentations, and technical data analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border text-xs font-semibold">
            <Link href="/client/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm">
            <Link href="/client/new-job">
              Place Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Calculator Form */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground">Project Parameters</CardTitle>
            <CardDescription className="text-xs">
              Select your academic service type and quantity to calculate the exact payout and discounts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <SelectItem key={service.value} value={service.value}>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {service.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Quantity ({SERVICE_TYPES.find(s => s.value === serviceType)?.unitType || 'pages'})
              </Label>
              <Input
                type="number"
                min="1"
                max="500"
                step="0.5"
                value={quantity}
                onChange={(e) => {
                  setQuantity(parseFloat(e.target.value) || 1);
                  setEstimate(null);
                }}
                placeholder="Enter number of pages/slides"
              />
              <p className="text-xs text-muted-foreground">
                1 page = 275 words (double-spaced)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="technical"
                  checked={isTechnical}
                  onChange={(e) => {
                    setIsTechnical(e.target.checked);
                    setEstimate(null);
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="technical" className="cursor-pointer">
                  Technical work (Excel, SPSS, PowerPoint)
                </Label>
              </div>
              {isTechnical && (
                <Badge variant="secondary" className="text-xs">
                  +KSh 30/page bonus
                </Badge>
              )}
            </div>

            {clientDiscount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  You have a <strong>{clientDiscount}%</strong> recurring client discount!
                </span>
              </div>
            )}

            <Button 
              onClick={calculateEstimate} 
              className="w-full"
              disabled={calculating || quantity < 1}
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Estimate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Estimate Result */}
        {estimate && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                Your Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Service Type</p>
                  <p className="font-medium">{estimate.serviceType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{estimate.quantity} {estimate.unitType}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Rate</span>
                  <span>KSh {estimate.baseRate.toFixed(2)} / {estimate.unitType.slice(0, -1)}</span>
                </div>
                {estimate.technicalBonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Technical Bonus</span>
                    <span className="text-green-600">+KSh {estimate.technicalBonus.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Effective Rate</span>
                  <span className="font-medium">KSh {estimate.effectiveRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>KSh {estimate.subtotal.toFixed(2)}</span>
                </div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Client Discount ({clientDiscount}%)</span>
                    <span>-KSh {estimate.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Estimated Total</span>
                  <span className="text-2xl font-bold text-primary">
                    KSh {estimate.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Link href="/client/new-job" className="flex-1">
                  <Button className="w-full">
                    Place Order Now
                  </Button>
                </Link>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  This is an estimate based on standard pricing. Final price may vary based on 
                  deadline, complexity, and specific requirements. Additional services like 
                  plagiarism reports may incur extra charges.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pricing Reference</CardTitle>
            <CardDescription>
              Minimum rates per page/slide for different service types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricingMinimums.length > 0 ? (
              <div className="grid gap-3">
                {pricingMinimums.filter(p => p.isActive).map((pricing) => (
                  <div 
                    key={pricing.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm capitalize">
                      {pricing.serviceType.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        KSh {pricing.minCpp}
                      </Badge>
                      {pricing.technicalBonus > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{pricing.technicalBonus} technical
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Using default pricing (KSh 240/page standard, KSh 270/page technical)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
