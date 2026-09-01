'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '@/lib/mockData';
import { UserRole } from '@/lib/types';
import {
  User, Phone, MapPin, Building, Home, Camera,
  CheckCircle2, ArrowRight, Loader2, Sparkles, HeartHandshake, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function ProfileCreationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, completeProfile } = useAuth();
  const { showToast } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(SUPPORTED_CITIES[0] || 'Bhilai');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [address, setAddress] = useState('');
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

    if (user.profileCompleted === true) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
      return;
    }

    if (user.role) setSelectedRole(user.role);
    if (user.name && !user.name.startsWith('User ') && user.name !== 'Google User') {
      setFullName(user.name);
    }
    if (user.phone) setPhone(user.phone);
    if (user.photoUrl) {
      setPhotoUrl(user.photoUrl);
      setPhotoPreview(user.photoUrl);
    }
    if (user.city) setCity(user.city);
    if (user.area) setArea(user.area);
    if (user.address) setAddress(user.address);
  }, [isAuthenticated, isInitializing, user, router]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.name = 'Please enter your real full name (at least 2 characters)';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Please provide a valid contact mobile number';
    }
    if (!city) {
      newErrors.city = 'Please select your city';
    }
    if (!area) {
      newErrors.area = 'Please select your area / locality';
    }
    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = 'Please enter your street address / flat details (min 5 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('error', 'Incomplete Details', 'Please fill in all required profile information.');
      return;
    }

    setSubmitting(true);
    try {
      const finalArea = area === '__custom__' ? customArea.trim() : area.trim();
      const res = await completeProfile({
        role: selectedRole,
        name: fullName.trim(),
        phone: phone.trim(),
        city,
        location: city,
        area: finalArea,
        address: address.trim(),
        photoUrl: photoUrl || undefined,
        profileCompleted: true,
      });

      if (res.success && res.user) {
        showToast('success', 'Profile Created!', `Welcome to MaidEasy, ${res.user.name}`);
        if (selectedRole === 'maid') {
          router.push('/maid/register');
        } else {
          router.push('/home');
        }
      } else {
        showToast('error', 'Setup Failed', res.error || 'Could not save profile.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('error', 'Error', 'Failed to complete profile. Please try again.');
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

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-center items-center py-10 px-4">
      <div className="w-full max-w-[440px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <BrandLogo size="md" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
            <Sparkles className="size-3.5" />
            <span>Profile Setup</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Just a few quick details to get your verified MaidEasy account ready.
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-7 space-y-6">
            {/* Role Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                I am joining as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    selectedRole === 'customer'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="size-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                      <HeartHandshake className="size-4" />
                    </div>
                    {selectedRole === 'customer' && <CheckCircle2 className="size-4 text-blue-600" />}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Customer</div>
                    <div className="text-[11px] text-slate-500">Book trusted helpers</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('maid')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    selectedRole === 'maid'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="size-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                      <ShieldCheck className="size-4" />
                    </div>
                    {selectedRole === 'maid' && <CheckCircle2 className="size-4 text-blue-600" />}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Maid Partner</div>
                    <div className="text-[11px] text-slate-500">Offer home services</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Avatar */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative size-14 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 hover:border-blue-500 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0 transition-colors"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <User className="size-6 text-slate-400 group-hover:text-blue-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="size-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">Profile Photo</div>
                  <div className="text-[11px] text-slate-500 truncate">Add a recognizable photo</div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-blue-600 hover:underline mt-0.5 cursor-pointer inline-block"
                  >
                    Upload Image
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

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>
                {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>
                {errors.phone && <p className="text-[11px] font-semibold text-red-500">{errors.phone}</p>}
              </div>

              {/* City & Area */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">City *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 appearance-none cursor-pointer"
                    >
                      {SUPPORTED_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Area / Locality *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <select
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 appearance-none cursor-pointer"
                    >
                      {availableAreas.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="__custom__">+ Add Your Locality...</option>
                    </select>
                  </div>
                  {area === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Enter your locality name"
                      value={customArea}
                      onChange={e => setCustomArea(e.target.value)}
                      className="w-full mt-2 h-10 px-3 text-xs font-medium bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 placeholder:text-slate-400"
                    />
                  )}
                  {errors.area && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.area}</p>}
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">House Address *</label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-3 size-4 text-slate-400" />
                  <textarea
                    rows={2}
                    required
                    placeholder="Flat / House No, Building, Landmark..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 font-medium placeholder:text-slate-400 resize-none"
                  />
                </div>
                {errors.address && <p className="text-[11px] font-semibold text-red-500">{errors.address}</p>}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete & Continue</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400 text-center">
          By continuing, you agree to MaidEasy&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
