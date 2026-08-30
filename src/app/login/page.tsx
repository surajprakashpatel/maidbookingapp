'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { validatePhone } from '@/lib/utils';
import { Eye, EyeOff, Phone, Lock, Loader, ArrowLeft, User, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';

type NormalRole = 'customer' | 'maid';

const ROLE_CONFIG = {
  customer: { label: 'Customer', Icon: User, desc: 'Book verified maids in your area' },
  maid: { label: 'Maid', Icon: Home, desc: 'Manage your bookings and earnings' },
};

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { showToast } = useApp();

  const roleParam = searchParams.get('role');

  useEffect(() => {
    if (roleParam === 'admin') {
      router.replace('/admin/login');
    }
  }, [roleParam, router]);

  const initialRole: NormalRole = roleParam === 'maid' ? 'maid' : 'customer';
  const [role, setRole] = useState<NormalRole>(initialRole);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(role, phone, password);
    if (result.success) {
      showToast('success', 'Welcome back!', `Logged in as ${ROLE_CONFIG[role].label}`);
      if (role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    } else {
      showToast('error', 'Login failed', result.error);
    }
  };

  const handleGoogle = async () => {
    const result = await loginWithGoogle(role);
    if (result.success) {
      showToast('success', 'Logged in with Google!');
      if (role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    }
  };

  const rc = ROLE_CONFIG[role];

  return (
    <div className="min-h-dvh bg-[var(--background)] flex flex-col justify-between overflow-x-hidden">
      {/* Top Navigation Header */}
      <header className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border)] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <BrandLogo size="md" />
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md space-y-4"
        >
          <Card className="p-2 border border-[var(--border)] shadow-md bg-white">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-black text-[var(--text-primary)]">Welcome back</CardTitle>
              <CardDescription className="text-sm text-[var(--text-secondary)]">
                Sign in to continue to your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {/* Role Toggle Selector (Customer vs Service Provider ONLY - NO Admin!) */}
              <div className="flex gap-1.5 bg-[var(--gray-100)] p-1 rounded-xl">
                {(Object.keys(ROLE_CONFIG) as NormalRole[]).map(r => {
                  const Icon = ROLE_CONFIG[r].Icon;
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-[var(--primary-500)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="size-4" /> {ROLE_CONFIG[r].label}
                    </button>
                  );
                })}
              </div>

              {/* Role Description Banner */}
              <div className="p-3 rounded-xl bg-[var(--primary-50)] text-xs font-medium text-[var(--primary-700)] flex items-center gap-2.5 border border-[var(--primary-100)]">
                <rc.Icon className="size-4 text-[var(--primary-500)] shrink-0" />
                <span>{rc.desc}</span>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="pl-10 h-11"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <span className="text-[11px] text-[var(--error-600)] font-semibold">{errors.phone}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-[11px] text-[var(--error-600)] font-semibold">{errors.password}</span>}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-extrabold mt-2 shadow-xs">
                  {isLoading ? <Loader className="size-5 animate-spin" /> : 'Sign In'}
                </Button>
              </form>

              <div className="relative text-center my-3">
                <span className="bg-white px-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider relative z-10">
                  or
                </span>
                <div className="absolute inset-0 top-1/2 border-t border-[var(--border)]" />
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full h-11 gap-2.5 font-bold"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </CardContent>
          </Card>

          {/* Registration Links */}
          {role === 'customer' ? (
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Don’t have an account?{' '}
              <Link href="/signup" className="text-[var(--primary-500)] font-extrabold hover:underline">
                Sign Up
              </Link>
            </p>
          ) : (
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Not registered yet?{' '}
              <Link href="/maid/register" className="text-[var(--primary-500)] font-extrabold hover:underline">
                Register as Maid
              </Link>
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
