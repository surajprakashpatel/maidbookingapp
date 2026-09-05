'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  User,
  Home,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';

type NormalRole = 'customer' | 'maid';

export function LoginForm() {
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

  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approvalNotice, setApprovalNotice] = useState<{
    status: 'pending' | 'rejected';
    title: string;
    message: string;
  } | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!emailInput.trim()) {
      newErrors.email = 'Email or mobile number is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setApprovalNotice(null);

    const result = await login(role, emailInput.trim(), password);
    if (result.success) {
      const targetRole = result.role || role;
      if (result.isNewUser) {
        if (targetRole === 'maid') {
          router.push('/maid/register');
        } else {
          router.push('/profile/create');
        }
        return;
      }
      if (targetRole === 'admin') {
        showToast('success', 'Welcome Admin', 'Logged in as Administrator');
        router.push('/admin');
        return;
      }

      if (targetRole === 'maid' && (result.approvalStatus === 'pending' || result.approvalStatus === 'under_review')) {
        showToast('warning', 'Approval Pending', 'Your maid partner account is waiting for administrator approval.');
        setApprovalNotice({
          status: 'pending',
          title: 'Waiting for Admin Approval ⏳',
          message: 'Your maid partner account registration has been submitted and is currently awaiting administrator review. Once approved, you will be able to access all partner features.',
        });
        return;
      }

      if (result.approvalStatus === 'rejected') {
        showToast('error', 'Registration Not Approved', result.rejectionReason || 'Application was not approved.');
        setApprovalNotice({
          status: 'rejected',
          title: 'Registration Not Approved ❌',
          message: result.rejectionReason || 'Your registration could not be approved at this time. Please contact support.',
        });
        return;
      }

      showToast('success', 'Welcome back!', `Logged in successfully`);
      if (targetRole === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    } else {
      showToast('error', 'Login failed', result.error);
    }
  };

  const handleGoogle = async () => {
    setApprovalNotice(null);
    const result = await loginWithGoogle(role);
    if (result.success) {
      const targetRole = result.role || role;
      if (result.isNewUser) {
        if (targetRole === 'maid') {
          router.push('/maid/register');
        } else {
          router.push('/profile/create');
        }
        return;
      }
      if (targetRole === 'admin') {
        showToast('success', 'Welcome Admin', 'Logged in as Administrator');
        router.push('/admin');
        return;
      }

      if (targetRole === 'maid' && (result.approvalStatus === 'pending' || result.approvalStatus === 'under_review')) {
        showToast('warning', 'Approval Pending', 'Your maid partner account is waiting for administrator approval.');
        setApprovalNotice({
          status: 'pending',
          title: 'Waiting for Admin Approval ⏳',
          message: 'Your Google maid account registration is waiting for administrator review. Once approved, you will be granted access.',
        });
        return;
      }

      if (result.approvalStatus === 'rejected') {
        showToast('error', 'Registration Not Approved', result.rejectionReason || 'Application was not approved.');
        setApprovalNotice({
          status: 'rejected',
          title: 'Registration Not Approved ❌',
          message: result.rejectionReason || 'Your registration could not be approved at this time. Please contact support.',
        });
        return;
      }

      showToast('success', 'Logged in with Google!');
      if (targetRole === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-between items-center py-6 px-4 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full max-w-[420px] flex items-center justify-between py-2">
        <Link
          href="/"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <BrandLogo size="md" />
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Main Centered Login Card */}
      <main className="w-full max-w-[420px] my-auto py-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
          
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Sign in to your MaidEasy account
            </p>
          </div>

          {/* Approval Notice Banner if pending or rejected */}
          {approvalNotice && (
            <div className={`p-4 rounded-2xl border text-left space-y-2 animate-fade-in ${
              approvalNotice.status === 'pending'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-red-50/80 border-red-200 text-red-900'
            }`}>
              <div className="font-bold text-sm">{approvalNotice.title}</div>
              <p className="text-xs leading-relaxed opacity-90">{approvalNotice.message}</p>
              {approvalNotice.status === 'pending' && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Your account will activate immediately once approved.</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setApprovalNotice(null)}
                className="text-xs font-bold underline cursor-pointer pt-1 block"
              >
                Dismiss Notice
              </button>
            </div>
          )}

          {/* Clean Flat Role Navigation Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setErrors({});
              }}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                role === 'customer'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="size-4" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('maid');
                setErrors({});
              }}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                role === 'maid'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className="size-4" />
              <span>Maid Partner</span>
            </button>
          </div>

          {/* Google Sign In */}
          <div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs hover:border-slate-400 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider Line (Clean Single Divider) */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase shrink-0">
              or sign in with password
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Mobile & Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email or Phone Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="emailInput"
                className="block text-xs font-semibold text-slate-700"
              >
                Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="size-4" />
                </div>
                <input
                  id="emailInput"
                  type="text"
                  placeholder="Enter email or mobile number"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="passwordInput"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="size-4" />
                </div>
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Registration Links */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            {role === 'maid' ? (
              <p className="text-xs text-slate-500">
                New Maid Partner?{' '}
                <Link
                  href="/maid/register"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Register as a Maid
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-5 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>256-bit Secure Firebase Authentication</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[420px] text-center py-2 text-[11px] text-slate-400">
        <p>
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
