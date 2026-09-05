'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '@/lib/mockData';
import { validatePhone, validateEmail } from '@/lib/utils';
import {
  User, Phone, MapPin, Building, Home, Camera, Mail,
  ArrowRight, ArrowLeft, Loader2, ShieldCheck, CheckCircle2, Edit3, Compass
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';

const WIZARD_STEPS = [
  { id: 0, label: 'Customer', title: 'Customer Information', icon: User },
  { id: 1, label: 'Contact', title: 'Contact Information', icon: Phone },
  { id: 2, label: 'Location', title: 'Your Location', icon: MapPin },
  { id: 3, label: 'Address', title: 'House Details', icon: Home },
  { id: 4, label: 'Review', title: 'Review & Submit', icon: CheckCircle2 },
];

export function CustomerWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isInitializing, completeProfile } = useAuth();
  const { showToast } = useApp();

  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(SUPPORTED_CITIES[0] || 'Bhilai');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // If approved and complete, route directly into the app
    if (user.profileCompleted === true) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
      return;
    }

    // If role is maid, immediately route to the Complete Maid Profile Form
    const roleParam = searchParams.get('role');
    if (user.role === 'maid' || roleParam === 'maid') {
      router.replace('/maid/register');
      return;
    }

    if (user.name && !user.name.startsWith('User ') && user.name !== 'Google User') {
      setFullName(user.name);
    }
    if (user.email) setEmail(user.email);
    if (user.phone) setPhone(user.phone);
    if (user.photoUrl) {
      setPhotoUrl(user.photoUrl);
      setPhotoPreview(user.photoUrl);
    }
    if (user.city) setCity(user.city);
    if (user.area) setArea(user.area);
    if (user.address) setAddress(user.address);
  }, [isAuthenticated, isInitializing, user, router, searchParams]);

  const availableAreas = SUPPORTED_AREAS[city] || SUPPORTED_AREAS['Bhilai'] || [];

  useEffect(() => {
    const areas = SUPPORTED_AREAS[city] || SUPPORTED_AREAS['Bhilai'] || [];
    if (areas.length > 0 && (!area || !areas.includes(area))) {
      setArea(areas[0]);
      setCustomArea('');
    }
  }, [city, area]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Photo must be smaller than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Step-by-step validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!fullName.trim() || fullName.trim().length < 2 || fullName.trim().startsWith('User ') || fullName.trim() === 'Google User') {
        newErrors.name = 'Please enter your real full name (at least 2 characters)';
      }
    }

    if (step === 1) {
      if (!phone.trim() || !validatePhone(phone)) {
        newErrors.phone = 'Please provide a valid 10-digit mobile number';
      }
      if (email.trim() && !validateEmail(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step === 2) {
      if (!city) {
        newErrors.city = 'Please select your city';
      }
      const finalArea = area === '__custom__' ? customArea.trim() : area.trim();
      if (!finalArea) {
        newErrors.area = 'Please select or enter your locality / area';
      }
    }

    if (step === 3) {
      if (!address.trim() || address.trim().length < 5) {
        newErrors.address = 'Please enter your street address / flat details (min 5 characters)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (stepIndex: number) => {
    setErrors({});
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required steps before final submit
    let hasError = false;
    for (let s = 0; s <= 3; s++) {
      if (!validateStep(s)) {
        hasError = true;
        setCurrentStep(s);
        showToast('error', 'Incomplete Details', 'Please complete all required fields.');
        break;
      }
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      const finalArea = area === '__custom__' ? customArea.trim() : area.trim();
      const combinedAddress = landmark.trim() 
        ? `${address.trim()} (Landmark: ${landmark.trim()})`
        : address.trim();

      const res = await completeProfile({
        role: 'customer',
        name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        city,
        location: city,
        area: finalArea,
        address: combinedAddress,
        photoUrl: photoUrl || undefined,
        profileCompleted: true,
      });

      if (res.success && res.user) {
        showToast('success', 'Profile Completed!', 'Welcome to MaidEasy! You can now start booking trusted helpers.');
        router.push('/home');
      } else {
        showToast('error', 'Setup Failed', res.error || 'Could not save profile.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      console.error('Customer profile creation exception:', err);
      const errorMessage = (err as Error)?.message || 'Failed to complete profile. Please try again.';
      showToast('error', 'Submission Failed', errorMessage);
      setSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <span className="text-sm font-semibold text-slate-600">Verifying session...</span>
      </div>
    );
  }

  const finalDisplayArea = area === '__custom__' ? customArea || 'Custom Locality' : area;

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-between items-center py-8 px-4 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full max-w-[480px] flex items-center justify-between py-2">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Previous step"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <Link
            href="/login"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Back to login"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <BrandLogo size="md" />
        <span className="text-xs font-bold text-slate-400">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </span>
      </header>

      {/* Main Wizard Container */}
      <main className="w-full max-w-[480px] my-auto py-3">
        <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          {/* Wizard Progress Stepper Bar */}
          <div className="p-5 sm:p-6 pb-2 border-b border-slate-100 bg-slate-50/50 space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {WIZARD_STEPS[currentStep].title}
              </h1>
              <div className="size-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20 shrink-0">
                {(() => {
                  const CurrentIcon = WIZARD_STEPS[currentStep].icon;
                  return <CurrentIcon className="size-5" />;
                })()}
              </div>
            </div>

            {/* Stepper Dots & Labels */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {WIZARD_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      // Allow jumping back to previous completed steps
                      if (idx < currentStep) jumpToStep(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'bg-blue-600'
                        : idx < currentStep
                        ? 'bg-emerald-500 cursor-pointer hover:opacity-80'
                        : 'bg-slate-200'
                    }`}
                    title={`Step ${idx + 1}: ${s.label}`}
                  />
                ))}
              </div>

              {/* Step indicator labels */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-0.5">
                {WIZARD_STEPS.map((s, idx) => (
                  <span
                    key={s.id}
                    className={`transition-colors ${
                      idx === currentStep
                        ? 'text-blue-600 font-extrabold'
                        : idx < currentStep
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-7 space-y-6">
            {/* STEP 0: BASIC INFORMATION */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-fade-in">
                {/* Photo Upload */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative size-16 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 hover:border-blue-500 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0 transition-colors"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="size-full object-cover" />
                    ) : (
                      <User className="size-7 text-slate-400 group-hover:text-blue-500" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="size-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">Profile Photo (Optional)</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {photoPreview && user?.photoUrl ? 'Synced from Google profile' : 'Add a friendly picture for your profile'}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 hover:underline mt-1 cursor-pointer inline-block"
                    >
                      {photoPreview ? 'Change Photo' : 'Upload Image'}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                {errors.photo && <p className="text-[11px] font-semibold text-red-500">{errors.photo}</p>}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="fullName" className="text-xs font-bold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    {user?.name && !user.name.startsWith('User ') && user.name !== 'Google User' && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Auto-filled from Google
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`w-full h-11 pl-10 pr-3.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium placeholder:text-slate-400 ${
                        errors.name
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
                </div>
              </div>
            )}

            {/* STEP 1: CONTACT INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      inputMode="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={e => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full h-11 pl-10 pr-3.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium placeholder:text-slate-400 ${
                        errors.phone
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] font-semibold text-red-500">{errors.phone}</p>}
                  <p className="text-[11px] text-slate-400">Used for booking confirmations and maid coordination.</p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email" className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    {user?.email && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Verified from Google
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`w-full h-11 pl-10 pr-3.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium placeholder:text-slate-400 ${
                        errors.email
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] font-semibold text-red-500">{errors.email}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                {/* City */}
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-bold text-slate-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <select
                      id="city"
                      value={city}
                      onChange={e => {
                        setCity(e.target.value);
                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      className="w-full h-11 pl-10 pr-3.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 appearance-none cursor-pointer"
                    >
                      {SUPPORTED_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.city && <p className="text-[11px] font-semibold text-red-500">{errors.city}</p>}
                </div>

                {/* Area / Locality */}
                <div className="space-y-1.5">
                  <label htmlFor="area" className="text-xs font-bold text-slate-700">
                    Locality / Area <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <select
                      id="area"
                      value={area}
                      onChange={e => {
                        setArea(e.target.value);
                        if (errors.area) setErrors(prev => ({ ...prev, area: '' }));
                      }}
                      className="w-full h-11 pl-10 pr-3.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 appearance-none cursor-pointer"
                    >
                      {availableAreas.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="__custom__">+ Add Your Locality...</option>
                    </select>
                  </div>

                  {area === '__custom__' && (
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Type your locality or sector name"
                        value={customArea}
                        onChange={e => {
                          setCustomArea(e.target.value);
                          if (errors.area) setErrors(prev => ({ ...prev, area: '' }));
                        }}
                        className="w-full h-11 px-3.5 text-sm font-medium bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  )}
                  {errors.area && <p className="text-[11px] font-semibold text-red-500">{errors.area}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: HOUSE ADDRESS DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                {/* Street / Flat Address */}
                <div className="space-y-1.5">
                  <label htmlFor="address" className="text-xs font-bold text-slate-700">
                    House / Flat Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3.5 top-3 size-4 text-slate-400" />
                    <textarea
                      id="address"
                      rows={3}
                      required
                      placeholder="Flat / House No., Building Name, Street / Road..."
                      value={address}
                      onChange={e => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium placeholder:text-slate-400 resize-none ${
                        errors.address
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.address && <p className="text-[11px] font-semibold text-red-500">{errors.address}</p>}
                </div>

                {/* Landmark / Arrival Notes */}
                <div className="space-y-1.5">
                  <label htmlFor="landmark" className="text-xs font-bold text-slate-700">
                    Landmark or Entry Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      id="landmark"
                      type="text"
                      placeholder="e.g. Near Shiv Temple, 2nd Floor"
                      value={landmark}
                      onChange={e => setLandmark(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Ready to Activate:</span> Review your information below. Click any section&apos;s Edit button to make changes, or submit to start booking helpers immediately.
                  </div>
                </div>

                {/* Section 1: Customer Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <User className="size-3.5 text-blue-600" />
                      <span>Customer Details</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToStep(0)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="size-10 rounded-full object-cover border border-slate-300" />
                    ) : (
                      <div className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {fullName ? fullName.charAt(0) : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">{fullName}</div>
                      <div className="text-[11px] text-slate-500">Customer Account</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Phone className="size-3.5 text-blue-600" />
                      <span>Contact Info</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile:</span>
                      <span className="font-bold text-slate-900">{phone || 'Not provided'}</span>
                    </div>
                    {email && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-semibold text-slate-800">{email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Location */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <MapPin className="size-3.5 text-blue-600" />
                      <span>Service Location</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToStep(2)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">City:</span>
                      <span className="font-bold text-slate-900">{city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Locality:</span>
                      <span className="font-bold text-slate-900">{finalDisplayArea}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Address */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Home className="size-3.5 text-blue-600" />
                      <span>House Address</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToStep(3)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed pt-0.5 font-medium">
                    {address || 'Not provided'}
                    {landmark && <span className="block text-slate-500 mt-1">Landmark: {landmark}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons (Back / Next / Submit) */}
            <div className="pt-2 flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="size-4 mr-1.5" />
                  <span>Back</span>
                </Button>
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Submit Profile & Start Booking</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Switch to Maid Partner */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Looking to offer services as a Maid Partner?{' '}
                <Link
                  href="/maid/register"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Register as Maid
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-[11px] text-slate-400 text-center mt-5">
          By continuing, you agree to MaidEasy&apos;s{' '}
          <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </footer>
      </main>
    </div>
  );
}

export default function ProfileCreationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CustomerWizardForm />
    </Suspense>
  );
}
