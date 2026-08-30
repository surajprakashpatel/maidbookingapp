'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, Lock, Mail, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin, isAuthenticated, user, isLoading, isInitializing } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated as Admin, redirect immediately
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [isAuthenticated, user, isInitializing, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError('Please enter your admin email or phone number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const result = await adminLogin(emailOrPhone, password);
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader size={28} className="animate-spin text-[var(--primary-600)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo size="md" />
          <Badge variant="destructive" className="ml-2 text-[10px]">Admin Portal</Badge>
        </div>
        <Link href="/login">
          <Button variant="ghost" size="sm">Customer Login</Button>
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="flex-1 flex items-center justify-center p-5">
        <Card className="w-full max-w-md p-2">
          <CardHeader className="text-center pb-2">
            <div className="size-12 rounded-2xl bg-[var(--primary-50)] text-[var(--primary-500)] flex items-center justify-center mx-auto mb-2">
              <Shield className="size-6" />
            </div>
            <CardTitle className="text-xl font-extrabold">Administrator Login</CardTitle>
            <CardDescription>Enter credentials to access platform controls</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-xl bg-[var(--error-50)] border border-[var(--error-100)] text-xs font-medium text-[var(--error-700)] flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--text-primary)]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    placeholder="admin@example.com"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    className="pl-10 h-11"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--text-primary)]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-bold mt-2">
                {isLoading ? <Loader className="size-5 animate-spin" /> : 'Sign In to Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
