"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Loader2,
  Phone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrainingBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    slug: string;
    title: string;
    standardPrice: number;
    earlyBirdPrice?: number | null;
    promotionalPrice?: number | null;
    currency: string;
    cohorts: Array<{
      id: number;
      cohortCode: string;
      name: string;
      startDate: string;
      endDate: string;
      capacity: number;
      enrolledCount: number;
      registrationClosesAt: string;
    }>;
  };
}

export const TrainingBookingDialog: React.FC<TrainingBookingDialogProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'payment' | 'polling' | 'confirmed'>('form');
  const [selectedCohortId, setSelectedCohortId] = useState<number>(course.cohorts[0]?.id || 0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');
  const [groupSize, setGroupSize] = useState(1);
  const [discountCode, setDiscountCode] = useState('');

  // Booking & Payment states
  const [bookingReference, setBookingReference] = useState('');
  const [agreedPrice, setAgreedPrice] = useState<number>(course.standardPrice);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasActivePaymentRequest, setHasActivePaymentRequest] = useState(false);

  const selectedCohort = course.cohorts.find((c) => c.id === selectedCohortId) || course.cohorts[0];

  // Calculate unit price
  const unitPrice =
    course.promotionalPrice && Number(course.promotionalPrice) > 0
      ? Number(course.promotionalPrice)
      : Number(course.standardPrice);

  const calculatedTotal = unitPrice * (registrationType === 'group' ? groupSize : 1);

  // Step 1: Submit Booking Form
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/training/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          cohortId: selectedCohortId,
          fullName,
          email,
          phone,
          organization,
          jobTitle,
          registrationType,
          groupSize: registrationType === 'group' ? groupSize : 1,
          discountCode: discountCode.trim().toUpperCase() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create booking.');
      }

      setBookingReference(data.bookingReference);
      setAgreedPrice(data.agreedPrice);

      if (data.bookingStatus === 'confirmed') {
        setStep('confirmed');
      } else {
        await handleInitiateMpesa(data.bookingReference, phone);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateMpesa = async (
    reference = bookingReference,
    phoneNumber = phone,
  ) => {
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/training/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference: reference,
          phoneNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment prompt.');
      }

      setHasActivePaymentRequest(true);
      setStep('polling');
    } catch (err: any) {
      setErrorMessage(err.message || 'M-Pesa push error.');
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/training/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not check the payment status.');
      }

      if (data.status === 'confirmed') {
        setReceiptNumber(data.receiptNumber || 'MPESA-VERIFIED');
        setStep('confirmed');
      } else if (data.status === 'failed') {
        setHasActivePaymentRequest(false);
        setErrorMessage(data.errorMessage || 'M-Pesa payment was not completed.');
      } else {
        setStep('polling');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not check the payment status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'polling') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/training/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingReference }),
        });

        const data = await res.json();
        if (data.success && data.status === 'confirmed') {
          clearInterval(interval);
          setReceiptNumber(data.receiptNumber || 'MPESA-VERIFIED');
          setStep('confirmed');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setErrorMessage(data.errorMessage || 'M-Pesa payment was not completed.');
          setStep('payment');
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    }, 3000);

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (step === 'polling') {
        setErrorMessage('We could not confirm your payment yet. Check its status or try again.');
        setStep('payment');
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [step, bookingReference]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#241B3F] dark:text-[#F8F5FC] p-6 sm:p-8 rounded-2xl shadow-2xl">
        <DialogHeader className="text-left pb-4 border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5B3594] dark:text-[#FFA06E] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#FF7A3D]" />
            TaskLynk Training Academy • Enrolment
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#22183D] dark:text-white leading-tight">
            {course.title}
          </DialogTitle>
          <DialogDescription className="text-[#6B627A] dark:text-[#DDD3E9]/80 text-xs sm:text-sm">
            Complete your registration and M-Pesa payment to secure verified access to live workshops and learning materials.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="my-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'form' && (
          <form onSubmit={handleCreateBooking} className="space-y-4 pt-3">
            {/* Cohort Selection */}
            <div>
              <Label className="text-xs font-bold text-[#22183D] dark:text-slate-200">Select Training Intake</Label>
              <div className="grid grid-cols-1 gap-2 mt-1.5">
                {course.cohorts.map((cohort) => {
                  const isSelected = selectedCohortId === cohort.id;
                  const availableSeats = Math.max(0, cohort.capacity - cohort.enrolledCount);
                  return (
                    <div
                      key={cohort.id}
                      onClick={() => setSelectedCohortId(cohort.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#FF7A3D] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15'
                          : 'border-[#DDD3E9] dark:border-[#3A2F5B] bg-[#F8F5FC]/60 dark:bg-[#160F29]/60 hover:border-[#FF7A3D]/40'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#22183D] dark:text-white flex items-center gap-2">
                          <span>{cohort.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5B3594]/10 dark:bg-white/10 text-[#5B3594] dark:text-[#FFA06E]">
                            {cohort.cohortCode}
                          </span>
                        </div>
                        <div className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#FF7A3D]" />
                            {new Date(cohort.startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} –{' '}
                            {new Date(cohort.endDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{availableSeats} seats available</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#FF7A3D]">
                          {course.currency} {calculatedTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Learner Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Kelvin Mutua"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">M-Pesa Phone Number *</Label>
                <Input
                  required
                  placeholder="0712 345 678 or 254..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Organization / University</Label>
                <Input
                  placeholder="e.g. Strathmore University / Freelance"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white"
                />
              </div>
            </div>

            {/* Registration Type & Group Multiplier */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Registration Type</Label>
                <select
                  value={registrationType}
                  onChange={(e) => setRegistrationType(e.target.value as any)}
                  className="w-full mt-1 h-9 rounded-md bg-[#FAF8FD] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] px-3 text-xs sm:text-sm text-[#22183D] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF7A3D]"
                >
                  <option value="individual">Individual Learner (1 Seat)</option>
                  <option value="group">Group / Team Booking</option>
                </select>
              </div>

              {registrationType === 'group' ? (
                <div>
                  <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Number of Seats</Label>
                  <Input
                    type="number"
                    min="2"
                    max="50"
                    value={groupSize}
                    onChange={(e) => setGroupSize(Math.max(2, Number(e.target.value)))}
                    className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">Discount Code (Optional)</Label>
                  <Input
                    placeholder="e.g. ACADEMY2026"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="mt-1 bg-[#FAF8FD] dark:bg-[#160F29] border-[#DDD3E9] dark:border-[#3A2F5B] text-xs sm:text-sm text-[#22183D] dark:text-white uppercase"
                  />
                </div>
              )}
            </div>

            {/* Price Summary Banner */}
            <div className="p-4 rounded-xl bg-[#F8F5FC] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">Total Payable Amount</span>
                <div className="text-2xl font-black text-[#22183D] dark:text-white">
                  {course.currency} {calculatedTotal.toLocaleString()}
                </div>
              </div>

              <div className="text-right text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant M-Pesa Confirmation
                </span>
                <span>Closes 48h prior to intake</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl text-base shadow-lg shadow-[#FF7A3D]/25 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reserving seat &amp; starting payment...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Pay via M-Pesa</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Payment retry after a booking is reserved */}
        {step === 'payment' && (
          <div className="space-y-5 pt-3">
            <div className="p-4 rounded-xl bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 border border-[#5B3594]/20 dark:border-[#FF7A3D]/20 text-sm">
              <div className="font-bold text-[#5B3594] dark:text-[#FFA06E] text-base mb-1">Booking Reserved!</div>
              <div className="flex items-center justify-between text-xs text-[#22183D] dark:text-slate-200">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Booking Reference:</span>
                <span className="font-mono font-bold text-[#FF7A3D]">{bookingReference}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#22183D] dark:text-slate-200 mt-1">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Amount:</span>
                <span className="font-black text-[#22183D] dark:text-white">{course.currency} {agreedPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F8F5FC] dark:bg-[#160F29] rounded-xl border border-[#DDD3E9] dark:border-[#3A2F5B] space-y-3">
              <Label className="text-xs font-semibold text-[#22183D] dark:text-slate-300">M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-[#6B627A] dark:text-slate-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="pl-9 bg-white dark:bg-[#1D1533] border-[#DDD3E9] dark:border-[#3A2F5B] text-[#22183D] dark:text-white font-mono"
                />
              </div>
              <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/80">
                A payment request will be sent to this number. Approve it on your phone to complete payment.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleInitiateMpesa()}
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/25"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to M-Pesa...
                  </span>
                ) : (
                  <span>Pay via M-Pesa (KES {agreedPrice})</span>
                )}
              </Button>

              {hasActivePaymentRequest && (
                <Button
                  variant="outline"
                  onClick={handleCheckPaymentStatus}
                  disabled={loading}
                  className="w-full text-xs border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#FFA06E]"
                >
                  Check payment status
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setStep('form')}
                className="text-xs text-[#6B627A] dark:text-[#DDD3E9] hover:text-[#22183D] dark:hover:text-white"
              >
                Back to Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: POLLING / AWAITING PAYMENT CALLBACK */}
        {step === 'polling' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FF7A3D]/20 text-[#FF7A3D] flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#22183D] dark:text-white">Check Your Phone</h3>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mt-1 max-w-sm mx-auto">
                We sent a payment request to <span className="font-mono text-[#FF7A3D] font-bold">{phone}</span> for KES {agreedPrice}. Approve it on your phone.
              </p>
            </div>

            <div className="p-3 bg-[#F8F5FC] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 max-w-sm mx-auto">
              Confirming your payment...
            </div>

            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('payment')}
                className="text-xs text-[#6B627A] dark:text-[#DDD3E9]"
              >
                Change Phone Number
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMED & ENROLLED */}
        {step === 'confirmed' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-[#22183D] dark:text-white">Enrolment Confirmed!</h3>
              <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mt-1">
                Your payment was verified and your learner access has been activated.
              </p>
            </div>

            <div className="p-4 bg-[#F8F5FC] dark:bg-[#160F29] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Booking Reference:</span>
                <span className="font-mono font-bold text-[#22183D] dark:text-white">{bookingReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Payment Receipt:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Cohort:</span>
                <span className="font-semibold text-[#22183D] dark:text-white">{selectedCohort?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/80">Start Date:</span>
                <span className="font-semibold text-[#22183D] dark:text-white">
                  {selectedCohort ? new Date(selectedCohort.startDate).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                onClose();
                router.push(`/training/learn/${course.slug}`);
              }}
              className="w-full h-12 bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl text-base shadow-xl shadow-[#FF7A3D]/25"
            >
              <span>Launch Learner LMS Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
