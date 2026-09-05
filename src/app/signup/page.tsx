'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { validatePhone, validateEmail } from '@/lib/utils';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '@/lib/mockData';
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, Loader, Home } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, isLoading } = useAuth();
  const { showToast } = useApp();

  const roleParam = searchParams.get('role');

  useEffect(() => {
    if (roleParam === 'maid') {
      router.replace('/maid/register');
    }
  }, [roleParam, router]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: SUPPORTED_CITIES[0] || 'Bhilai',
    area: (SUPPORTED_AREAS[SUPPORTED_CITIES[0]] || [])[0] || 'Sector 5',
    customArea: '',
    address: '',
    password: '',
    confirm: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm(p => {
      const updated = { ...p, [field]: value };
      if (field === 'city') {
        const availableAreas = SUPPORTED_AREAS[value] || [];
        updated.area = availableAreas[0] || '';
        updated.customArea = '';
      }
      return updated;
    });
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your full name (min 2 characters)';
    if (!form.phone || !validatePhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.email && !validateEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.city) e.city = 'Please select your city';
    const finalArea = form.area === '__custom__' ? form.customArea.trim() : form.area.trim();
    if (!finalArea) e.area = 'Please select or enter your locality';
    if (!form.address.trim() || form.address.trim().length < 5) e.address = 'Enter your address (min 5 characters)';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalArea = form.area === '__custom__' ? form.customArea.trim() : form.area.trim();
    const result = await signup(
      'customer',
      form.name.trim(),
      form.phone,
      form.password,
      {
        email: form.email.trim() || undefined,
        city: form.city,
        location: form.city,
        area: finalArea,
        address: form.address.trim(),
      }
    );
    if (result.success) {
      showToast('success', 'Account Created!', `Welcome to MaidEasy, ${form.name.trim()}`);
      router.push('/home');
    } else {
      showToast('error', 'Signup failed', result.error);
    }
  };

  const currentAreas = SUPPORTED_AREAS[form.city] || [];

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-between items-center py-6 px-4 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full max-w-[440px] flex items-center justify-between py-2">
        <Link
          href="/login"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          aria-label="Back to login"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <BrandLogo size="md" />
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Main Registration Form Card */}
      <main className="w-full max-w-[440px] my-auto py-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create Customer Account
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Book verified and trusted home maids in minutes
            </p>
          </div>

          {/* Clean Flat Role Navigation Tabs matching Login */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              className="flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 border-blue-600 text-blue-600 transition-colors cursor-pointer"
            >
              <User className="size-4" />
              <span>Customer</span>
            </button>
            <Link
              href="/maid/register"
              className="flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Home className="size-4" />
              <span>Maid Partner</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-bold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="size-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="size-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.phone
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-700">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="size-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* City & Area Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-bold text-slate-700">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  id="city"
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {SUPPORTED_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="area" className="block text-xs font-bold text-slate-700">
                  Locality / Area <span className="text-red-500">*</span>
                </label>
                <select
                  id="area"
                  value={form.area}
                  onChange={e => update('area', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {currentAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="__custom__">+ Add Your Locality...</option>
                </select>

                {form.area === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter your locality name"
                    value={form.customArea}
                    onChange={e => update('customArea', e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                )}
                {errors.area && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.area}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-xs font-bold text-slate-700">
                Address / Flat / Street <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Home className="size-4" />
                </div>
                <input
                  id="address"
                  type="text"
                  placeholder="Flat 102, Sunshine Apts, Street 5"
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.address
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.address && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.address}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="size-4" />
                </div>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-xs font-bold text-slate-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="size-4" />
                </div>
                <input
                  id="confirm"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={e => update('confirm', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.confirm
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {isLoading ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account & Start Booking</span>
              )}
            </button>
          </form>

          {/* Quick Registration Links */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[440px] text-center py-2 text-[11px] text-slate-400">
        <p>
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </p>
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50">
          <Loader className="size-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
