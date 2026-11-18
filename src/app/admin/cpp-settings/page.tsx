"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { 
  Save, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Layers,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context-v2";

// Default CPP levels (fallback if database is empty)
const DEFAULT_CPP_LEVELS = [
  {
    level: 1,
    levelName: 'Starter',
    description: 'Beginning your journey with us',
    completedOrdersRequired: 0,
    cppNonTechnical: 150,
    cppTechnical: 170,
    orderCountInLevel: 3,
    progressBarColor: '#10b981',
  },
  {
    level: 2,
    levelName: 'Rising',
    description: 'Showing consistent quality work',
    completedOrdersRequired: 3,
    cppNonTechnical: 160,
    cppTechnical: 180,
    orderCountInLevel: 5,
    progressBarColor: '#06b6d4',
  },
  {
    level: 3,
    levelName: 'Established',
    description: 'Building a strong reputation',
    completedOrdersRequired: 8,
    cppNonTechnical: 170,
    cppTechnical: 190,
    orderCountInLevel: 15,
    progressBarColor: '#3b82f6',
  },
  {
    level: 4,
    levelName: 'Expert',
    description: 'Trusted by many clients',
    completedOrdersRequired: 23,
    cppNonTechnical: 180,
    cppTechnical: 200,
    orderCountInLevel: 27,
    progressBarColor: '#8b5cf6',
  },
  {
    level: 5,
    levelName: 'Master',
    description: 'Excellence in every project',
    completedOrdersRequired: 50,
    cppNonTechnical: 200,
    cppTechnical: 220,
    orderCountInLevel: 999,
    progressBarColor: '#fbbf24',
  },
];

// Default pricing minimums
const DEFAULT_PRICING_MINIMUMS = [
  { serviceType: 'writing_page', minCpp: 240, minCps: null, description: 'Standard writing page minimum' },
  { serviceType: 'technical_page', minCpp: 270, minCps: null, description: 'Technical writing page minimum' },
  { serviceType: 'slide', minCpp: 200, minCps: 200, description: 'Slide/presentation minimum' },
  { serviceType: 'data_analysis', minCpp: 300, minCps: null, description: 'Data analysis work minimum' },
  { serviceType: 'programming', minCpp: 350, minCps: null, description: 'Programming task minimum' },
];

interface CPPLevel {
  id?: number;
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  orderCountInLevel: number;
  progressBarColor: string;
}

interface PricingMinimum {
  id?: number;
  serviceType: string;
  minCpp: number;
  minCps: number | null;
  description: string;
}

export default function CPPSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cppLevels, setCppLevels] = useState<CPPLevel[]>(DEFAULT_CPP_LEVELS);
  const [pricingMinimums, setPricingMinimums] = useState<PricingMinimum[]>(DEFAULT_PRICING_MINIMUMS);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([1]); // First level expanded by default

  // Fetch existing CPP settings
  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch CPP levels
      const cppResponse = await safeApiFetch('/api/v2/admin/cpp-settings', {
        credentials: 'include',
      });
      
      if (cppResponse.ok) {
        const cppData = await cppResponse.json();
        if (cppData.cppLevels && cppData.cppLevels.length > 0) {
          setCppLevels(cppData.cppLevels);
        }
        if (cppData.pricingMinimums && cppData.pricingMinimums.length > 0) {
          setPricingMinimums(cppData.pricingMinimums);
        }
      }

      // Fetch pricing minimums
      const pricingResponse = await safeApiFetch('/api/v2/admin/pricing-minimums', {
        credentials: 'include',
      });
      
      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        if (pricingData.pricingMinimums && pricingData.pricingMinimums.length > 0) {
          setPricingMinimums(pricingData.pricingMinimums);
        }
      }
    } catch (error) {
      console.error('Error fetching CPP settings:', error);
      toast.error('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (levelIndex: number, field: keyof CPPLevel, value: any) => {
    setCppLevels(prev => {
      const updated = [...prev];
      updated[levelIndex] = { ...updated[levelIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handlePricingChange = (index: number, field: keyof PricingMinimum, value: any) => {
    setPricingMinimums(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const toggleLevelExpand = (level: number) => {
    setExpandedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const saveCPPLevels = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await safeApiFetch('/api/v2/admin/cpp-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cppLevels })
      });

      if (response.ok) {
        toast.success('CPP levels saved successfully');
        setHasChanges(false);
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to save CPP levels'));
      }
    } catch (error) {
      console.error('Error saving CPP levels:', error);
      toast.error('Failed to save CPP levels');
    } finally {
      setSaving(false);
    }
  };

  const savePricingMinimums = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await safeApiFetch('/api/v2/admin/pricing-minimums', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ minimums: pricingMinimums })
      });

      if (response.ok) {
        toast.success('Pricing minimums saved successfully');
        setHasChanges(false);
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to save pricing minimums'));
      }
    } catch (error) {
      console.error('Error saving pricing minimums:', error);
      toast.error('Failed to save pricing minimums');
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    await saveCPPLevels();
    await savePricingMinimums();
  };

  const initializeDefaults = async () => {
    if (!user) return;
    
    const confirmed = confirm(
      'This will reset all CPP levels and pricing minimums to default values. Continue?'
    );
    if (!confirmed) return;

    setCppLevels(DEFAULT_CPP_LEVELS);
    setPricingMinimums(DEFAULT_PRICING_MINIMUMS);
    setHasChanges(true);
    toast.info('Defaults loaded. Click "Save All Changes" to apply.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading CPP settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            CPP Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure freelancer pay rates and client pricing minimums
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={initializeDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveAllSettings} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cppLevels.length}</p>
                <p className="text-sm text-muted-foreground">CPP Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">KSh {cppLevels[0]?.cppNonTechnical || 150}</p>
                <p className="text-sm text-muted-foreground">Starter CPP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">KSh {cppLevels[cppLevels.length - 1]?.cppNonTechnical || 200}</p>
                <p className="text-sm text-muted-foreground">Master CPP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Layers className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pricingMinimums.length}</p>
                <p className="text-sm text-muted-foreground">Pricing Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cpp-levels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="cpp-levels" className="gap-3">
            <Users className="h-4 w-4" />
            Freelancer CPP Levels
          </TabsTrigger>
          <TabsTrigger value="client-pricing" className="gap-3">
            <DollarSign className="h-4 w-4" />
            Client Pricing
          </TabsTrigger>
        </TabsList>

        {/* CPP Levels Tab */}
        <TabsContent value="cpp-levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Freelancer CPP Tiers</CardTitle>
              <CardDescription>
                Configure payment rates for each freelancer tier. Technical work automatically adds a premium.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cppLevels.map((level, index) => (
                <div 
                  key={level.level}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Level Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleLevelExpand(level.level)}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: level.progressBarColor }}
                      />
                      <div>
                        <h3 className="font-semibold">
                          Level {level.level}: {level.levelName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {level.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="font-medium">
                          KSh {level.cppNonTechnical} / {level.cppTechnical}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Non-tech / Technical
                        </p>
                      </div>
                      {expandedLevels.includes(level.level) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Level Details (Collapsible) */}
                  {expandedLevels.includes(level.level) && (
                    <div className="p-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${level.level}`}>Level Name</Label>
                          <Input
                            id={`name-${level.level}`}
                            value={level.levelName}
                            onChange={(e) => handleLevelChange(index, 'levelName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`cpp-${level.level}`}>CPP (Non-Technical)</Label>
                          <Input
                            id={`cpp-${level.level}`}
                            type="number"
                            value={level.cppNonTechnical}
                            onChange={(e) => handleLevelChange(index, 'cppNonTechnical', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`cpp-tech-${level.level}`}>CPP (Technical)</Label>
                          <Input
                            id={`cpp-tech-${level.level}`}
                            type="number"
                            value={level.cppTechnical}
                            onChange={(e) => handleLevelChange(index, 'cppTechnical', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`color-${level.level}`}>Progress Color</Label>
                          <div className="flex gap-3">
                            <Input
                              id={`color-${level.level}`}
                              type="color"
                              value={level.progressBarColor}
                              onChange={(e) => handleLevelChange(index, 'progressBarColor', e.target.value)}
                              className="w-14 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={level.progressBarColor}
                              onChange={(e) => handleLevelChange(index, 'progressBarColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`orders-${level.level}`}>Orders to Reach Level</Label>
                          <Input
                            id={`orders-${level.level}`}
                            type="number"
                            value={level.completedOrdersRequired}
                            onChange={(e) => handleLevelChange(index, 'completedOrdersRequired', parseInt(e.target.value) || 0)}
                            disabled={index === 0}
                          />
                          {index === 0 && (
                            <p className="text-xs text-muted-foreground">First level starts at 0</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`count-${level.level}`}>Orders in This Level</Label>
                          <Input
                            id={`count-${level.level}`}
                            type="number"
                            value={level.orderCountInLevel}
                            onChange={(e) => handleLevelChange(index, 'orderCountInLevel', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`desc-${level.level}`}>Description</Label>
                          <Input
                            id={`desc-${level.level}`}
                            value={level.description}
                            onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={saveCPPLevels} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save CPP Levels
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CPP Progression Visual */}
          <Card>
            <CardHeader>
              <CardTitle>CPP Progression Chart</CardTitle>
              <CardDescription>
                Visual representation of freelancer progression through CPP tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-end justify-between gap-3 h-40">
                  {cppLevels.map((level, index) => (
                    <div key={level.level} className="flex-1 flex flex-col items-center gap-3">
                      <div 
                        className="w-full rounded-t-md transition-all"
                        style={{ 
                          height: `${(level.cppNonTechnical / 250) * 100}%`,
                          backgroundColor: level.progressBarColor,
                          minHeight: '20%'
                        }}
                      />
                      <div className="text-center">
                        <p className="font-medium text-sm">{level.levelName}</p>
                        <p className="text-xs text-muted-foreground">KSh {level.cppNonTechnical}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Pricing Tab */}
        <TabsContent value="client-pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Pricing Minimums</CardTitle>
              <CardDescription>
                Set minimum prices charged to clients for different service types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {pricingMinimums.map((pricing, index) => (
                  <div 
                    key={pricing.serviceType}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Input
                        value={pricing.serviceType}
                        onChange={(e) => handlePricingChange(index, 'serviceType', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min CPP (Per Page)</Label>
                      <Input
                        type="number"
                        value={pricing.minCpp}
                        onChange={(e) => handlePricingChange(index, 'minCpp', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min CPS (Per Slide)</Label>
                      <Input
                        type="number"
                        value={pricing.minCps || ''}
                        placeholder="N/A"
                        onChange={(e) => handlePricingChange(index, 'minCps', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={pricing.description}
                        onChange={(e) => handlePricingChange(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setPricingMinimums(prev => [...prev, {
                      serviceType: 'new_service',
                      minCpp: 250,
                      minCps: null,
                      description: 'New service type'
                    }]);
                    setHasChanges(true);
                  }}
                >
                  + Add Service Type
                </Button>
                <Button onClick={savePricingMinimums} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Pricing Minimums
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
              <CardDescription>
                Quick reference for current minimum pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricingMinimums.map((pricing) => (
                  <div 
                    key={pricing.serviceType}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {pricing.serviceType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="secondary">
                        KSh {pricing.minCpp}
                        {pricing.minCps && ` / ${pricing.minCps}`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pricing.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                How CPP Levels Work
              </h3>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li> Freelancers start at <strong>Level 1 (Starter)</strong> and progress as they complete orders</li>
                <li> Each level has <strong>Non-Technical</strong> and <strong>Technical</strong> CPP rates (Technical adds +20)</li>
                <li> <strong>Client pricing minimums</strong> ensure profitability on all orders</li>
                <li> Changes take effect immediately for new orders</li>
                <li> Existing orders retain their original pricing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
