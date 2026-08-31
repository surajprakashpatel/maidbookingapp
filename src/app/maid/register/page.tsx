'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { MaidRegistrationForm } from '@/lib/types';
import { SelfieCapture } from '@/components/maid/SelfieCapture';
import { SUPPORTED_CITIES, SUPPORTED_AREAS, SERVICE_CATEGORIES } from '@/lib/mockData';
import { validatePhone, validateEmail, validateAadhaar, maskAadhaar } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, CheckCircle, Camera,
  User, Eye, EyeOff, Loader, Lock, AlertTriangle, Lightbulb, FileText, Wrench, Wallet, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';

const STEPS = [
  { label: 'Personal', Icon: User },
  { label: 'Identity', Icon: FileText },
  { label: 'Location', Icon: MapPin },
  { label: 'Services', Icon: Wrench },
  { label: 'Pricing', Icon: Wallet },
  { label: 'Review', Icon: CheckCircle },
];

const LANGUAGES = ['Hindi', 'English', 'Chhattisgarhi', 'Marathi', 'Bengali', 'Telugu', 'Tamil', 'Gujarati'];

const INITIAL_FORM: MaidRegistrationForm = {
  name: '', phone: '', email: '', dateOfBirth: '', gender: 'female',
  profilePhoto: null, profilePhotoPreview: '',
  aadhaarNumber: '', selfieDataUrl: '', selfieStatus: 'not_captured',
  location: 'Bhilai', city: 'Bhilai', area: '', address: '', pincode: '', serviceAreas: [], workRadius: 5,
  qualification: '', experience: 0, services: [], languages: [], bio: '',
  hourlyEnabled: true, hourlyPrice: '',
  dailyEnabled: false, dailyPrice: '',
  monthlyEnabled: false, monthlyPrice: '',
};

export default function MaidRegisterPage() {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MaidRegistrationForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill fields if user is already logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        city: prev.city || user.city || user.location || 'Bhilai',
        location: prev.location || user.location || 'Bhilai',
        area: prev.area || user.area || '',
        address: prev.address || user.address || '',
      }));
    }
  }, [user]);

  const update = <K extends keyof MaidRegistrationForm>(key: K, value: MaidRegistrationForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const toggleArea = (area: string) => {
    setForm(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your full name';
      if (!form.phone || !validatePhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
      if (form.email && !validateEmail(form.email)) e.email = 'Enter a valid email address';
      if (!form.gender) e.gender = 'Select your gender';
    }
    if (s === 1) {
      if (!form.aadhaarNumber || !validateAadhaar(form.aadhaarNumber)) e.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number';
      if (!form.selfieDataUrl) e.selfie = 'Live selfie is required for verification';
    }
    if (s === 2) {
      if (!form.city) e.city = 'Select your city';
      if (!form.area.trim()) e.area = 'Enter your area';
      if (form.serviceAreas.length === 0) e.serviceAreas = 'Select at least one service area';
    }
    if (s === 3) {
      if (form.services.length === 0) e.services = 'Select at least one service';
    }
    if (s === 4) {
      const hasAny = form.hourlyEnabled || form.dailyEnabled || form.monthlyEnabled;
      if (!hasAny) e.pricing = 'Enable at least one pricing option';
      if (form.hourlyEnabled && (!form.hourlyPrice || Number(form.hourlyPrice) <= 0)) e.hourlyPrice = 'Enter valid hourly price';
      if (form.dailyEnabled && (!form.dailyPrice || Number(form.dailyPrice) <= 0)) e.dailyPrice = 'Enter valid daily price';
      if (form.monthlyEnabled && (!form.monthlyPrice || Number(form.monthlyPrice) <= 0)) e.monthlyPrice = 'Enter valid monthly price';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const back = () => {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { submitMaidRegistration } = await import('@/lib/services/maidService');
      const userId = user?.id || '';
      const res = await submitMaidRegistration(form, userId);
      if (res.success) {
        setSubmitted(true);
        showToast('success', 'Profile submitted!', 'Your registration is under review.');
      } else {
        showToast('error', 'Submission Failed', res.error || 'Could not submit registration.');
      }
    } catch {
      showToast('error', 'Submission Error', 'Failed to connect to registration service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('error', 'File too large', 'Maximum 5MB allowed'); return; }
    const reader = new FileReader();
    reader.onload = () => update('profilePhotoPreview', reader.result as string);
    reader.readAsDataURL(file);
    update('profilePhoto', file);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: '24px' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--success-50)', border: '2px solid var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>Profile Submitted!</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-600)', marginBottom: '16px' }}>Your account is under review</h2>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
            Your profile has been submitted successfully and is waiting for admin verification. You&apos;ll receive a notification once your account is approved. This usually takes 24–48 hours.
          </p>
        </div>
        <Link href="/maid/dashboard">
          <button className="btn btn-primary btn-lg">Go to Dashboard</button>
        </Link>
      </div>
    );
  }

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 18);
  const maxDob = maxDobDate.toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {step > 0 ? (
            <button onClick={back} className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></button>
          ) : (
            <Link href="/"><button className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></button></Link>
          )}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Maid Registration</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(() => {
                  const Icon = STEPS[step].Icon;
                  return <Icon size={14} style={{ color: 'var(--primary-600)' }} />;
                })()}
                <span>{STEPS[step].label}</span>
              </div>
            </div>
            <BrandLogo size="sm" />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{step + 1}/{STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Step dots */}
        <div className="stepper" style={{ marginTop: '10px' }}>
          {STEPS.map((s, i) => (
            <div key={s.label} className={`stepper-step ${i < step ? 'completed' : i === step ? 'active' : ''}`}>
              <div className="stepper-dot">
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <div className="stepper-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: '560px', margin: '0 auto', width: '100%' }}>

        {/* ===================== STEP 0: PERSONAL ===================== */}
        {step === 0 && (
          <div className="animate-fade-in">
            <SectionTitle title="Personal Information" desc="Tell us about yourself" />

            {/* Profile Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: form.profilePhotoPreview ? `url(${form.profilePhotoPreview}) center/cover` : 'var(--gray-100)',
                  backgroundSize: 'cover',
                  border: '3px dashed var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!form.profilePhotoPreview && <User size={32} style={{ color: 'var(--gray-400)' }} />}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--primary-600)',
                    color: 'white',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={14} />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePhoto} style={{ display: 'none' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile photo (optional)</span>
              <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '11px', color: 'var(--primary-700)', textAlign: 'center', maxWidth: '280px' }}>
                ℹ️ Profile photo is separate from verification selfie. You&apos;ll capture a live selfie in the next step.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField label="Full Name" required error={errors.name}>
                <input className={`input-base ${errors.name ? 'input-error' : ''}`} type="text" placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} />
              </FormField>
              <FormField label="Mobile Number" required error={errors.phone}>
                <input className={`input-base ${errors.phone ? 'input-error' : ''}`} type="tel" inputMode="tel" placeholder="10-digit mobile number" value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </FormField>
              <FormField label="Email (Optional)" error={errors.email}>
                <input className={`input-base ${errors.email ? 'input-error' : ''}`} type="email" inputMode="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </FormField>
              <FormField label="Date of Birth" error={errors.dateOfBirth}>
                <input className="input-base" type="date" value={form.dateOfBirth} max={maxDob} onChange={e => update('dateOfBirth', e.target.value)} />
              </FormField>
              <FormField label="Gender" required error={errors.gender}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['female', 'male', 'other'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => update('gender', g)}
                      className={`btn btn-sm ${form.gender === g ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* ===================== STEP 1: IDENTITY ===================== */}
        {step === 1 && (
          <div className="animate-fade-in">
            <SectionTitle title="Identity Verification" desc="Your identity will be securely verified" />

            {/* Aadhaar */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--primary-500)' }} /> Aadhaar Verification
              </h3>
              <div style={{ background: 'var(--accent-50)', border: '1px solid var(--accent-100)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: 'var(--accent-600)', lineHeight: '1.6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} style={{ color: 'var(--accent-600)', flexShrink: 0 }} /> Your Aadhaar number is stored securely and never displayed publicly. Only the last 4 digits are shown on your profile.
              </div>
              <FormField label="Aadhaar Number" required error={errors.aadhaarNumber}>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`input-base ${errors.aadhaarNumber ? 'input-error' : ''}`}
                    type={showAadhaar ? 'text' : 'password'}
                    inputMode="numeric"
                    placeholder="12-digit Aadhaar number"
                    value={form.aadhaarNumber}
                    maxLength={12}
                    onChange={e => update('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    style={{ paddingRight: '44px', fontFamily: 'monospace', letterSpacing: '2px' }}
                  />
                  <button type="button" onClick={() => setShowAadhaar(!showAadhaar)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showAadhaar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.aadhaarNumber.length === 12 && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Will be stored as: {maskAadhaar(form.aadhaarNumber)}
                  </div>
                )}
              </FormField>
            </div>

            {/* Live Selfie */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} style={{ color: 'var(--primary-500)' }} /> Live Selfie Verification
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: '1.6' }}>
                We require a live camera selfie to verify your identity. This is separate from your profile photo.
              </p>

              {errors.selfie && (
                <div style={{ background: 'var(--error-50)', border: '1px solid var(--error-100)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: 'var(--error-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> {errors.selfie}
                </div>
              )}

              {form.selfieDataUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', padding: '10px', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success-100)' }}>
                    <CheckCircle size={18} style={{ color: 'var(--success-500)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>Live selfie captured successfully</span>
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.selfieDataUrl} alt="Verification selfie" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--success-500)' }} />
                    <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--success-500)', borderRadius: '50%', padding: '3px', border: '2px solid white' }}>
                      <CheckCircle size={14} style={{ color: 'white', display: 'block' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => update('selfieDataUrl', '')}
                      style={{ gap: '6px' }}
                    >
                      <Camera size={14} /> Retake Selfie
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Lock size={12} /> This selfie is stored securely and only visible to admin.
                  </p>
                </div>
              ) : (
                <SelfieCapture
                  onCapture={(dataUrl) => {
                    update('selfieDataUrl', dataUrl);
                    update('selfieStatus', 'captured');
                    if (errors.selfie) setErrors(prev => ({ ...prev, selfie: '' }));
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ===================== STEP 2: LOCATION ===================== */}
        {step === 2 && (
          <div className="animate-fade-in">
            <SectionTitle title="Your Location" desc="Tell us where you are and where you can work" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <FormField label="City" required error={errors.city}>
                <select className="input-base" value={form.city} onChange={e => { update('city', e.target.value); update('location', e.target.value); update('area', ''); update('serviceAreas', []); }} style={{ appearance: 'none' }}>
                  <option value="">Select city</option>
                  {SUPPORTED_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Your Area/Locality" required error={errors.area}>
                <input className={`input-base ${errors.area ? 'input-error' : ''}`} type="text" placeholder="e.g. Nehru Nagar" value={form.area} onChange={e => update('area', e.target.value)} />
              </FormField>
              <FormField label="Full Address" error={errors.address}>
                <textarea className="textarea-base" placeholder="House/flat number, street, landmark..." value={form.address} onChange={e => update('address', e.target.value)} rows={2} />
              </FormField>
              <FormField label="Pincode" error={errors.pincode}>
                <input className="input-base" type="text" inputMode="numeric" placeholder="6-digit pincode" value={form.pincode} maxLength={6} onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </FormField>
              <FormField label="Work Radius (km)" error={''}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min={1} max={20} value={form.workRadius} onChange={e => update('workRadius', Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-700)', minWidth: '48px', textAlign: 'right' }}>{form.workRadius} km</span>
                </div>
              </FormField>
            </div>

            {/* Service Areas */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                Areas You&apos;ll Work In <span style={{ color: 'var(--error-500)' }}>*</span>
              </div>
              {errors.serviceAreas && <div className="form-error" style={{ marginBottom: '8px' }}>{errors.serviceAreas}</div>}
              {form.city && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(SUPPORTED_AREAS[form.city] || []).map(area => (
                    <button
                      key={area}
                      onClick={() => toggleArea(area)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: form.serviceAreas.includes(area) ? '1.5px solid var(--primary-500)' : '1.5px solid var(--border)',
                        background: form.serviceAreas.includes(area) ? 'var(--primary-50)' : 'white',
                        color: form.serviceAreas.includes(area) ? 'var(--primary-700)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {form.serviceAreas.includes(area) && <CheckCircle size={12} />}
                      {area}
                    </button>
                  ))}
                </div>
              )}
              {!form.city && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select a city first</p>}
              {form.serviceAreas.length > 0 && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success-600)', fontWeight: 600 }}>✓ {form.serviceAreas.length} area{form.serviceAreas.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>
          </div>
        )}

        {/* ===================== STEP 3: SERVICES ===================== */}
        {step === 3 && (
          <div className="animate-fade-in">
            <SectionTitle title="Qualifications & Services" desc="Tell us about your skills and experience" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <FormField label="Qualification" error={''}>
                <select className="input-base" value={form.qualification} onChange={e => update('qualification', e.target.value)} style={{ appearance: 'none' }}>
                  <option value="">Select highest qualification</option>
                  {['Middle School (8th)', 'Matriculation (10th)', 'Higher Secondary (12th)', 'Graduate (BA/BSc/BCom)', 'Post Graduate', 'Other'].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </FormField>
              <FormField label="Years of Experience" error={''}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min={0} max={30} value={form.experience} onChange={e => update('experience', Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-700)', minWidth: '60px', textAlign: 'right' }}>{form.experience} {form.experience === 1 ? 'yr' : 'yrs'}</span>
                </div>
              </FormField>
              <FormField label="Short Bio (Optional)" error={''}>
                <textarea
                  className="textarea-base"
                  placeholder="Briefly describe yourself, your work style, and why customers should choose you..."
                  value={form.bio}
                  onChange={e => update('bio', e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>{form.bio.length}/300</div>
              </FormField>
            </div>

            {/* Services */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                Services You Offer <span style={{ color: 'var(--error-500)' }}>*</span>
              </div>
              {errors.services && <div className="form-error" style={{ marginBottom: '8px' }}>{errors.services}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {SERVICE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleService(cat.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      border: form.services.includes(cat.name) ? '2px solid var(--primary-500)' : '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      background: form.services.includes(cat.name) ? 'var(--primary-50)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: form.services.includes(cat.name) ? 'var(--primary-700)' : 'var(--text-primary)', flex: 1 }}>{cat.name}</span>
                    {form.services.includes(cat.name) && <CheckCircle size={16} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>Languages Spoken</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontWeight: 500,
                      border: form.languages.includes(lang) ? '1.5px solid var(--primary-500)' : '1.5px solid var(--border)',
                      background: form.languages.includes(lang) ? 'var(--primary-50)' : 'white',
                      color: form.languages.includes(lang) ? 'var(--primary-700)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== STEP 4: PRICING ===================== */}
        {step === 4 && (
          <div className="animate-fade-in">
            <SectionTitle title="Your Pricing" desc="Set your rates in INR. Enable the types that apply to you." />
            <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={16} style={{ color: 'var(--primary-600)', flexShrink: 0 }} /> All prices are in Indian Rupees (₹). Set competitive rates to attract more bookings.
            </div>

            {errors.pricing && <div className="form-error" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> {errors.pricing}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'hourly' as const, label: 'Hourly Rate', unit: 'per hour', enabled: form.hourlyEnabled, enabledKey: 'hourlyEnabled' as const, priceKey: 'hourlyPrice' as const, placeholder: 'e.g. 150', min: 50, max: 1000 },
                { key: 'daily' as const, label: 'Daily Rate', unit: 'per day', enabled: form.dailyEnabled, enabledKey: 'dailyEnabled' as const, priceKey: 'dailyPrice' as const, placeholder: 'e.g. 800', min: 300, max: 5000 },
                { key: 'monthly' as const, label: 'Monthly Rate', unit: 'per month', enabled: form.monthlyEnabled, enabledKey: 'monthlyEnabled' as const, priceKey: 'monthlyPrice' as const, placeholder: 'e.g. 18000', min: 5000, max: 50000 },
              ].map(opt => (
                <div key={opt.key} style={{
                  background: 'white',
                  border: opt.enabled ? '2px solid var(--primary-300)' : '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: opt.enabled ? '12px' : '0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹ {opt.unit}</div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={opt.enabled}
                      className={`toggle ${opt.enabled ? 'on' : ''}`}
                      onClick={() => update(opt.enabledKey, !opt.enabled)}
                    />
                  </div>
                  {opt.enabled && (
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--primary-600)', fontSize: '18px' }}>₹</span>
                      <input
                        className={`input-base ${errors[opt.priceKey] ? 'input-error' : ''}`}
                        type="number"
                        inputMode="numeric"
                        placeholder={opt.placeholder}
                        value={form[opt.priceKey]}
                        min={opt.min}
                        max={opt.max}
                        onChange={e => update(opt.priceKey, e.target.value)}
                        style={{ paddingLeft: '32px' }}
                      />
                      {errors[opt.priceKey] && <div className="form-error" style={{ marginTop: '4px' }}>{errors[opt.priceKey]}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center', lineHeight: '1.6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Lightbulb size={14} /> Platform charges a 5% fee on each booking. You receive the remaining 95%.
            </p>
          </div>
        )}

        {/* ===================== STEP 5: REVIEW ===================== */}
        {step === 5 && (
          <div className="animate-fade-in">
            <SectionTitle title="Review & Submit" desc="Please review your information before submitting" />

            {/* Review sections */}
            <ReviewSection title="Personal Info">
              <ReviewRow label="Name" value={form.name} />
              <ReviewRow label="Phone" value={form.phone} />
              <ReviewRow label="Gender" value={form.gender} />
              {form.email && <ReviewRow label="Email" value={form.email} />}
            </ReviewSection>

            <ReviewSection title="Identity">
              <ReviewRow label="Aadhaar" value={form.aadhaarNumber ? maskAadhaar(form.aadhaarNumber) : 'Not provided'} />
              <ReviewRow label="Live Selfie" value={form.selfieDataUrl ? 'Captured & Verified' : 'Not captured'} highlight={!form.selfieDataUrl} />
            </ReviewSection>

            <ReviewSection title="Location">
              <ReviewRow label="City" value={form.city} />
              <ReviewRow label="Area" value={form.area} />
              <ReviewRow label="Service Areas" value={form.serviceAreas.join(', ') || 'None'} />
              <ReviewRow label="Work Radius" value={`${form.workRadius} km`} />
            </ReviewSection>

            <ReviewSection title="Services">
              <ReviewRow label="Services" value={form.services.join(', ') || 'None'} />
              <ReviewRow label="Experience" value={`${form.experience} years`} />
              {form.qualification && <ReviewRow label="Qualification" value={form.qualification} />}
            </ReviewSection>

            <ReviewSection title="Pricing">
              {form.hourlyEnabled && form.hourlyPrice && <ReviewRow label="Per Hour" value={`₹${form.hourlyPrice}`} />}
              {form.dailyEnabled && form.dailyPrice && <ReviewRow label="Per Day" value={`₹${form.dailyPrice}`} />}
              {form.monthlyEnabled && form.monthlyPrice && <ReviewRow label="Per Month" value={`₹${form.monthlyPrice}`} />}
              {!form.hourlyEnabled && !form.dailyEnabled && !form.monthlyEnabled && <ReviewRow label="Pricing" value="Not set" highlight />}
            </ReviewSection>

            {/* Edit buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {STEPS.slice(0, 5).map((s, i) => {
                const Icon = s.Icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => setStep(i)}
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Icon size={14} /> Edit {s.label}
                  </button>
                );
              })}
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ gap: '8px' }}
            >
              {isSubmitting ? <><Loader size={20} className="animate-spin" /> Submitting...</> : <><CheckCircle size={20} /> Submit for Approval</>}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', lineHeight: '1.6' }}>
              By submitting, you confirm that all information provided is accurate. Your profile will be reviewed within 24–48 hours.
            </p>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
            {step > 0 && (
              <button className="btn btn-outline" onClick={back} style={{ flex: 1, gap: '6px' }}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button className="btn btn-primary" onClick={next} style={{ flex: 2, gap: '6px' }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div style={{ height: '32px' }} />
      </div>
    </div>
  );
}

// Reusable components
function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>{title}</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
    </div>
  );
}

function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="required"> *</span>}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '16px', marginBottom: '12px', border: '1px solid var(--border-light)' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '90px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: highlight ? 'var(--error-500)' : 'var(--text-primary)', flex: 1 }}>{value}</span>
    </div>
  );
}
