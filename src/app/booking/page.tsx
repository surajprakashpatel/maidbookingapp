'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Maid } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { formatINR, generateTransactionId } from '@/lib/utils';
import { CheckCircle, ChevronLeft, ChevronRight, Loader, Wrench, CreditCard, Smartphone, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const STEPS = ['Service', 'Date', 'Duration', 'Location', 'Summary', 'Payment', 'Done'];

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast, selectedArea } = useApp();

  const maidId = searchParams.get('maidId');
  const [maid, setMaid] = useState<Maid | null>(null);
  const [loadingMaid, setLoadingMaid] = useState(true);
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');

  const [selectedService, setSelectedService] = useState('Cleaning');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [pricingType, setPricingType] = useState<'hourly' | 'daily' | 'monthly'>('hourly');
  const [duration, setDuration] = useState(2);
  const [address, setAddress] = useState(user?.address ?? '');
  const [area, setArea] = useState(user?.area ?? selectedArea);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'phonepe'>('razorpay');

  useEffect(() => {
    async function load() {
      if (maidId) {
        setLoadingMaid(true);
        const { fetchMaidById } = await import('@/lib/services/maidService');
        const m = await fetchMaidById(maidId);
        if (m) {
          setMaid(m);
          setSelectedService(m.services[0] ?? 'Cleaning');
        }
        setLoadingMaid(false);
      } else {
        setLoadingMaid(false);
      }
    }
    load();
  }, [maidId]);

  const [dateBounds] = useState(() => {
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 30);
    const maxStr = d.toISOString().split('T')[0];
    return { min: todayStr, max: maxStr };
  });

  const serviceRate = useMemo(() => {
    if (!maid) return 150;
    if (pricingType === 'monthly') return maid.monthlyPrice ?? 18000;
    if (pricingType === 'daily') return maid.dailyPrice ?? 800;
    return maid.hourlyPrice ?? 150;
  }, [maid, pricingType]);

  const serviceAmount = useMemo(() => {
    if (pricingType === 'hourly') return serviceRate * duration;
    if (pricingType === 'daily') return serviceRate * duration;
    return serviceRate;
  }, [serviceRate, pricingType, duration]);

  const platformFee = Math.round(serviceAmount * 0.05);
  const totalAmount = serviceAmount + platformFee;

  if (loadingMaid) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Book Maid', showBack: true }}>
        <div className="p-12 text-center text-sm text-[var(--text-secondary)] flex flex-col items-center justify-center gap-3">
          <Loader className="size-6 animate-spin text-[var(--primary-600)]" />
          <span>Loading maid profile...</span>
        </div>
      </AppShell>
    );
  }

  if (!maid) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Book Maid', showBack: true }}>
        <div className="p-8 text-center space-y-4">
          <div className="size-14 rounded-full bg-[var(--gray-100)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
            <AlertCircle className="size-8" />
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">Maid Profile Not Found</div>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            Please select a verified maid from our directory to initiate a booking.
          </p>
          <Button onClick={() => router.push('/search')} className="font-bold">
            Browse Maids
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleNext = () => {
    if (step === 0 && !selectedService) {
      showToast('error', 'Select a Service', 'Please choose a service to continue.');
      return;
    }
    if (step === 1 && !selectedDate) {
      showToast('error', 'Select Date', 'Please choose a date to continue.');
      return;
    }
    if (step === 3 && (!address.trim() || !area.trim())) {
      showToast('error', 'Enter Address', 'Please provide service address and area.');
      return;
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
  };

  const handlePayment = async () => {
    if (!user) {
      showToast('error', 'Sign In Required', 'Please sign in or create an account to complete your booking.');
      router.push(`/login?role=customer`);
      return;
    }
    setProcessing(true);
    try {
      const { createBooking } = await import('@/lib/services/bookingService');
      const txnId = generateTransactionId('PAY');

      const res = await createBooking({
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        customerAddress: address,
        customerArea: area,
        maidId: maid.id,
        maidName: maid.name,
        maidPhoto: maid.profilePhoto,
        serviceId: selectedService.toLowerCase().replace(/\s+/g, '_'),
        serviceName: selectedService,
        pricingType,
        duration,
        date: selectedDate,
        time: selectedTime,
        serviceAmount,
        tax: 0,
        discount: 0,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentGateway: paymentMethod,
        transactionId: txnId,
      });

      if (res.success && res.bookingNumber) {
        setBookingNumber(res.bookingNumber);
        setStep(6); // Success step
      } else {
        showToast('error', 'Booking Failed', res.error || 'Could not process booking');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Payment Error', 'Payment processing failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const progressPercent = ((step + 1) / (STEPS.length - 1)) * 100;

  return (
    <AppShell role="customer" headerProps={{ title: 'Book Maid', showBack: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Stepper Header */}
        {step < 6 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Step {step + 1} of {STEPS.length - 1}: {STEPS[step]}</span>
              <span>{Math.round(progressPercent)}% Completed</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}

        {/* Animated Wizard Body */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* Step 0: Select Service */}
          {step === 0 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Select Service</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Choose the type of service you need from {maid.name}</p>
                </div>
                <div className="space-y-2">
                  {maid.services.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedService === service
                          ? 'border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                          : 'border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--gray-50)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
                          <Wrench className="size-4 text-[var(--primary-600)]" />
                        </div>
                        <span className="font-semibold text-sm">{service}</span>
                      </div>
                      {selectedService === service && <CheckCircle className="size-5 text-[var(--primary-600)]" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Select Date & Start Time</h2>
                  <p className="text-xs text-[var(--text-secondary)]">When should {maid.name} arrive?</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Service Date</label>
                    <input
                      type="date"
                      min={dateBounds.min}
                      max={dateBounds.max}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="input-base text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Arrival Time</label>
                    <select
                      value={selectedTime}
                      onChange={e => setSelectedTime(e.target.value)}
                      className="input-base text-sm"
                    >
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '16:00', '18:00'].map(t => (
                        <option key={t} value={t}>{t} ({t < '12:00' ? 'Morning' : 'Afternoon/Evening'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Duration & Type */}
          {step === 2 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Service Frequency & Duration</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Choose billing type and duration</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['hourly', 'daily', 'monthly'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPricingType(type)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        pricingType === type
                          ? 'border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)] font-bold'
                          : 'border-[var(--border)] bg-white text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-xs capitalize">{type}</div>
                      <div className="text-sm font-extrabold mt-1">
                        {type === 'monthly' ? formatINR(maid.monthlyPrice || 18000)
                         : type === 'daily' ? formatINR(maid.dailyPrice || 800)
                         : formatINR(maid.hourlyPrice || 150)}
                      </div>
                    </button>
                  ))}
                </div>

                {pricingType !== 'monthly' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Number of {pricingType === 'hourly' ? 'Hours' : 'Days'}: {duration}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={pricingType === 'hourly' ? '8' : '30'}
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full accent-[var(--primary-600)] cursor-pointer"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Service Location</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Where should {maid.name} report?</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Area / Locality</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 7"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className="input-base text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Full House Address</label>
                    <textarea
                      rows={3}
                      placeholder="Flat no, House name, Street, Landmark..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="textarea-base text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Booking Summary</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Review all details before proceeding to payment</p>
                </div>

                <div className="space-y-2 border-b border-[var(--border)] pb-3 text-xs">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Maid</span><span className="font-bold text-[var(--text-primary)]">{maid.name}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Service</span><span className="font-bold text-[var(--text-primary)]">{selectedService}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date & Time</span><span className="font-semibold text-[var(--text-primary)]">{selectedDate} @ {selectedTime}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Address</span><span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{address}, {area}</span></div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]"><span>Service Charge</span><span>{formatINR(serviceAmount)}</span></div>
                  <div className="flex justify-between text-[var(--text-secondary)]"><span>Platform Fee (5%)</span><span>{formatINR(platformFee)}</span></div>
                  <div className="flex justify-between text-base font-black text-[var(--primary-700)] pt-2 border-t border-[var(--border)]"><span>Total Amount</span><span>{formatINR(totalAmount)}</span></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Payment Method</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Choose your preferred gateway</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { id: 'razorpay' as const, label: 'Razorpay', desc: 'Cards, UPI, Net Banking', Icon: CreditCard },
                    { id: 'phonepe' as const, label: 'PhonePe', desc: 'UPI & PhonePe Wallet', Icon: Smartphone },
                  ].map(gw => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setPaymentMethod(gw.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        paymentMethod === gw.id
                          ? 'border-[var(--primary-600)] bg-[var(--primary-50)]'
                          : 'border-[var(--border)] bg-white hover:bg-[var(--gray-50)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[var(--gray-100)] flex items-center justify-center">
                          <gw.Icon className="size-5 text-[var(--primary-600)]" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">{gw.label}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{gw.desc}</div>
                        </div>
                      </div>
                      {paymentMethod === gw.id && <CheckCircle className="size-5 text-[var(--primary-600)]" />}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[var(--primary-50)] text-center">
                  <div className="text-xs text-[var(--primary-600)]">Total Payable</div>
                  <div className="text-3xl font-black text-[var(--primary-700)] mt-0.5">{formatINR(totalAmount)}</div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
                  <Lock className="size-3" /> Encrypted secure payment via {paymentMethod === 'razorpay' ? 'Razorpay' : 'PhonePe'}
                </p>

                <Button onClick={handlePayment} disabled={processing} className="w-full h-12 text-base font-bold">
                  {processing ? <Loader className="size-5 animate-spin" /> : `Pay ${formatINR(totalAmount)} Now`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Confirmation Success */}
          {step === 6 && (
            <Card className="text-center p-8">
              <div className="size-20 rounded-full bg-[var(--success-50)] border-2 border-[var(--success-100)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-10 text-[var(--success-600)]" />
              </div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Booking Confirmed!</h1>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Your booking #{bookingNumber} with {maid.name} has been placed successfully.
              </p>
              <Badge variant="success" className="mx-auto mb-6 px-3 py-1 text-xs">
                Status: Confirmed & Paid
              </Badge>
              <div className="space-y-2">
                <Button onClick={() => router.push('/bookings')} className="w-full h-11">
                  View My Bookings
                </Button>
                <Button variant="outline" onClick={() => router.push('/home')} className="w-full h-11">
                  Go to Home
                </Button>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Bottom Wizard Controls */}
        {step < 5 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button onClick={handleNext} className="gap-1 px-6">
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        <div className="h-6" />
      </div>
    </AppShell>
  );
}

export default function BookingPage() {
  return (
    <Suspense>
      <BookingWizard />
    </Suspense>
  );
}
