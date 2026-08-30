'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { validatePhone, validateEmail } from '@/lib/utils';
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const { showToast } = useApp();

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!form.phone || !validatePhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.email && !validateEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await signup('customer', form.name.trim(), form.phone, form.password);
    if (result.success) {
      showToast('success', 'Account created!', 'Welcome to MaidEasy');
      router.push('/home');
    } else {
      showToast('error', 'Signup failed', result.error);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/login">
          <button className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></button>
        </Link>
        <span style={{ fontWeight: 700, fontSize: '17px' }}>Create Account</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-2xl)', padding: '24px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-light)' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Join MaidEasy</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Book trusted maids near you</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { field: 'name', label: 'Full Name', icon: <User size={16} />, type: 'text', placeholder: 'Your full name', required: true },
                { field: 'phone', label: 'Phone Number', icon: <Phone size={16} />, type: 'tel', placeholder: '10-digit mobile number', required: true },
                { field: 'email', label: 'Email (Optional)', icon: <Mail size={16} />, type: 'email', placeholder: 'your@email.com', required: false },
              ].map(({ field, label, icon, type, placeholder, required }) => (
                <div key={field} className="form-group">
                  <label className="form-label">{label}{required && <span className="required"> *</span>}</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{icon}</div>
                    <input
                      className={`input-base ${errors[field] ? 'input-error' : ''}`}
                      type={type}
                      inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'text'}
                      placeholder={placeholder}
                      value={form[field as keyof typeof form]}
                      onChange={e => update(field, field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                  {errors[field] && <span className="form-error">{errors[field]}</span>}
                </div>
              ))}

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={16} /></div>
                  <input
                    className={`input-base ${errors.password ? 'input-error' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              {/* Confirm */}
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <input
                  className={`input-base ${errors.confirm ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={e => update('confirm', e.target.value)}
                />
                {errors.confirm && <span className="form-error">{errors.confirm}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading} style={{ marginTop: '4px' }}>
                {isLoading ? <Loader size={20} /> : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              By creating an account, you agree to our{' '}
              <Link href="/terms" style={{ color: 'var(--primary-600)' }}>Terms</Link> and{' '}
              <Link href="/privacy" style={{ color: 'var(--primary-600)' }}>Privacy Policy</Link>.
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
