'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Star, Users } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { HomeServiceIllustration } from '@/components/ui/HomeServiceIllustration';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'admin') router.push('/admin');
      else if (role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    }
  }, [isAuthenticated, role, router]);

  return (
    <div className="min-h-dvh bg-[var(--background)] flex flex-col justify-between overflow-x-hidden">
      {/* Top Header Logo Bar */}
      <header className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border)] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <BrandLogo size="md" />
        <Link href="/login">
          <Button variant="ghost" size="sm" className="font-semibold text-[var(--primary-500)]">
            Login
          </Button>
        </Link>
      </header>

      {/* Main First Screen Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3 mb-6"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-50)] text-[var(--primary-500)] text-xs font-extrabold tracking-wide uppercase">
            ✦ Premium Home Services
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
            Find trusted help <br />
            <span className="text-[var(--primary-500)]">for your home</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
            Book background-checked, ID-verified home service professionals in your neighborhood with complete peace of mind.
          </p>
        </motion.div>

        {/* Vector Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xs sm:max-w-sm my-2 flex justify-center"
        >
          <HomeServiceIllustration className="w-full h-auto max-h-[220px] drop-shadow-xs" />
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 my-6 flex-wrap text-xs font-semibold text-[var(--text-secondary)]"
        >
          <div className="flex items-center gap-1">
            <ShieldCheck className="size-4 text-[var(--primary-500)]" />
            <span>ID Verified</span>
          </div>
          <span className="text-[var(--border)]">•</span>
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-[var(--accent-400)] text-[var(--accent-400)]" />
            <span>4.9★ Rating</span>
          </div>
          <span className="text-[var(--border)]">•</span>
          <div className="flex items-center gap-1">
            <Users className="size-4 text-[var(--primary-500)]" />
            <span>1000+ Maids</span>
          </div>
        </motion.div>

        {/* Primary CTA Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full space-y-3.5 max-w-xs mx-auto"
        >
          <Link href="/home" className="block w-full">
            <Button size="lg" className="w-full text-base font-extrabold shadow-md gap-2 h-12">
              Get Started
              <ArrowRight className="size-5" />
            </Button>
          </Link>

          <div className="text-xs text-[var(--text-secondary)] pt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--primary-500)] font-extrabold hover:underline">
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Subtle Footer Link for Maids */}
      <footer className="w-full py-4 px-5 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border)] bg-white">
        Are you a maid looking for work?{' '}
        <Link href="/maid/register" className="text-[var(--primary-500)] font-bold hover:underline">
          Register as Maid →
        </Link>
      </footer>
    </div>
  );
}
