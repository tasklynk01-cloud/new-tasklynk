"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Loader2, Save, Building, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type BillingAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type ClientProfile = {
  id: number;
  userId: number;
  companyName: string | null;
  industry: string | null;
  website: string | null;
  taxId: string | null;
  businessRegistration: string | null;
  billingAddress: BillingAddress | null;
  shippingAddress: ShippingAddress | null;
  preferredPaymentMethod: string | null;
  automatePayments: boolean;
  totalJobsPosted: number;
  totalSpent: number;
  recurringClientDiscount: number;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Real Estate',
  'Marketing',
  'Legal',
  'Non-Profit',
  'Other'
];

const PAYMENT_METHODS = [
  'M-Pesa',
  'Paystack',
  'Bank Transfer',
  'Credit Card',
  'PayPal'
];

export default function ClientCompanyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [useSameAddress, setUseSameAddress] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    website: '',
    taxId: '',
    businessRegistration: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Kenya'
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Kenya'
    },
    preferredPaymentMethod: '',
    automatePayments: false,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/login');
        return;
      }
      
      fetchProfile();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (useSameAddress) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }));
    }
  }, [useSameAddress, formData.billingAddress]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await safeApiFetch('/api/v2/client/profile', {
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            companyName: data.profile.companyName || '',
            industry: data.profile.industry || '',
            website: data.profile.website || '',
            taxId: data.profile.taxId || '',
            businessRegistration: data.profile.businessRegistration || '',
            billingAddress: data.profile.billingAddress || {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Kenya'
            },
            shippingAddress: data.profile.shippingAddress || {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Kenya'
            },
            preferredPaymentMethod: data.profile.preferredPaymentMethod || '',
            automatePayments: data.profile.automatePayments || false,
          });
          setIsEditMode(false);
        } else {
          // No profile exists, set to edit mode
          setIsEditMode(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setLoading(true);

    try {
      const method = profile ? 'PUT' : 'POST';
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await safeApiFetch('/api/v2/client/profile', {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(profile ? 'Profile updated successfully!' : 'Profile created successfully!');
        fetchProfile();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to save profile'));
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/client/profile"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-600 mt-2">Manage your company and billing information</p>
      </div>

      {profile && !isEditMode && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setIsEditMode(true)} variant="outline">
            Edit Profile
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>Basic information about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                  disabled={!!profile && !isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  disabled={!!profile && !isEditMode}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind.toLowerCase()}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.acme.com"
                  disabled={!!profile && !isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="A123456789"
                  disabled={!!profile && !isEditMode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessRegistration">Business Registration Number</Label>
              <Input
                id="businessRegistration"
                value={formData.businessRegistration}
                onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })}
                placeholder="PVT-202300XXXX"
                disabled={!!profile && !isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
            <CardDescription>Where invoices should be sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="billingStreet">Street Address *</Label>
              <Textarea
                id="billingStreet"
                value={formData.billingAddress.street}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billingAddress: { ...formData.billingAddress, street: e.target.value }
                })}
                placeholder="123 Main Street, Suite 100"
                rows={2}
                disabled={!!profile && !isEditMode}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingCity">City *</Label>
                <Input
                  id="billingCity"
                  value={formData.billingAddress.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, city: e.target.value }
                  })}
                  placeholder="Nairobi"
                  disabled={!!profile && !isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="billingState">State / County</Label>
                <Input
                  id="billingState"
                  value={formData.billingAddress.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, state: e.target.value }
                  })}
                  placeholder="Nairobi County"
                  disabled={!!profile && !isEditMode}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingPostalCode">Postal Code</Label>
                <Input
                  id="billingPostalCode"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, postalCode: e.target.value }
                  })}
                  placeholder="00100"
                  disabled={!!profile && !isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="billingCountry">Country *</Label>
                <Input
                  id="billingCountry"
                  value={formData.billingAddress.country}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, country: e.target.value }
                  })}
                  placeholder="Kenya"
                  disabled={!!profile && !isEditMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
            <CardDescription>Where physical deliveries should be sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="sameAddress" 
                checked={useSameAddress}
                onCheckedChange={(checked) => setUseSameAddress(!!checked)}
                  disabled={!!profile && !isEditMode}
              />
              <Label 
                htmlFor="sameAddress" 
                className="text-sm font-normal cursor-pointer"
              >
                Same as billing address
              </Label>
            </div>

            <div>
              <Label htmlFor="shippingStreet">Street Address</Label>
              <Textarea
                id="shippingStreet"
                value={formData.shippingAddress.street}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                })}
                placeholder="123 Main Street, Suite 100"
                rows={2}
                disabled={(profile && !isEditMode) || useSameAddress}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingCity">City</Label>
                <Input
                  id="shippingCity"
                  value={formData.shippingAddress.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                  })}
                  placeholder="Nairobi"
                  disabled={(profile && !isEditMode) || useSameAddress}
                />
              </div>

              <div>
                <Label htmlFor="shippingState">State / County</Label>
                <Input
                  id="shippingState"
                  value={formData.shippingAddress.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                  })}
                  placeholder="Nairobi County"
                  disabled={(profile && !isEditMode) || useSameAddress}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingPostalCode">Postal Code</Label>
                <Input
                  id="shippingPostalCode"
                  value={formData.shippingAddress.postalCode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shippingAddress: { ...formData.shippingAddress, postalCode: e.target.value }
                  })}
                  placeholder="00100"
                  disabled={(profile && !isEditMode) || useSameAddress}
                />
              </div>

              <div>
                <Label htmlFor="shippingCountry">Country</Label>
                <Input
                  id="shippingCountry"
                  value={formData.shippingAddress.country}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                  })}
                  placeholder="Kenya"
                  disabled={(profile && !isEditMode) || useSameAddress}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              Payment Preferences
            </CardTitle>
            <CardDescription>Set your preferred payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
              <Select
                value={formData.preferredPaymentMethod}
                onValueChange={(value) => setFormData({ ...formData, preferredPaymentMethod: value })}
                disabled={!!profile && !isEditMode}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => {
                    const isPaystack = method === 'Paystack';
                    const value = method.toLowerCase().replace(/\s+/g, '_');

                    return (
                      <SelectItem key={method} value={value}>
                        {method}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="automatePayments" 
                checked={formData.automatePayments}
                onCheckedChange={(checked) => setFormData({ ...formData, automatePayments: !!checked })}
                disabled={!!profile && !isEditMode}
              />
              <Label 
                htmlFor="automatePayments" 
                className="text-sm font-normal cursor-pointer"
              >
                Enable automatic payments for approved orders
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Profile Stats (if profile exists) */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your account activity summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Jobs Posted</p>
                  <p className="text-2xl font-bold text-blue-600">{profile.totalJobsPosted}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">
                    KSh {profile.totalSpent.toFixed(2)}
                  </p>
                </div>
                {profile.recurringClientDiscount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client Discount</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {profile.recurringClientDiscount}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {(!profile || isEditMode) && (
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {profile ? 'Update Profile' : 'Create Profile'}
                </>
              )}
            </Button>
            {profile && isEditMode && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditMode(false);
                  fetchProfile();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
