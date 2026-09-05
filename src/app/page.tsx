'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { HeroImageCarousel } from '@/components/ui/HeroImageCarousel';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'admin') router.push('/admin');
      else if (role === 'maid') router.push('/maid/dashboard');
      else router.push('/home');
    }
  }, [isAuthenticated, role, router]);

  return (
    <>
      {/* 1. LIGHT MODE INTRO SPLASH OVERLAY */}
      {!splashFinished && <SplashScreen onComplete={() => setSplashFinished(true)} durationMs={1600} />}

      <div className="min-h-dvh bg-[#FAFAFC] text-[var(--text-primary)] flex flex-col justify-between overflow-x-hidden select-none">
        {/* Top Header Navigation */}
        <header className="w-full px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-200/60 bg-white sticky top-0 z-30">
          <BrandLogo size="md" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold text-xs sm:text-sm px-2.5 sm:px-3 text-[var(--text-primary)] hover:bg-gray-100">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-extrabold text-xs sm:text-sm px-3 sm:px-4 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white shadow-xs">
                Get Started
              </Button>
            </Link>
          </div>
        </header>

        {/* HERO SECTION — Clean 2 Column Desktop / 1 Column Mobile */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-20 grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-14">
          {/* Left Column: Headline, Short Subtext, Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5 sm:space-y-6 text-center md:text-left flex flex-col items-center md:items-start"
          >
            <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl font-black text-[var(--text-primary)] leading-[1.12] tracking-tight">
              Trusted Help <br />
              For Your Home
            </h1>

            <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-md">
              Book reliable, background-checked household professionals near you.
            </p>

            {/* Primary Action Button */}
            <div className="w-full max-w-xs sm:max-w-sm pt-2">
              <Link href="/home" className="block w-full">
                <Button size="lg" className="w-full text-base font-extrabold bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white shadow-xs gap-2 h-12">
                  Find a Maid
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: MOVING PHOTOGRAPHY IMAGE CAROUSEL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full flex items-center justify-center"
          >
            <HeroImageCarousel className="w-full" />
          </motion.div>
        </main>

        {/* Minimal Footer */}
        <footer className="w-full py-4 px-6 text-center text-xs text-[var(--text-secondary)] border-t border-gray-200/60 bg-white">
          Are you a maid looking for work?{' '}
          <Link href="/maid/register" className="text-[var(--primary-600)] font-extrabold hover:underline">
            Register as Maid Partner →
          </Link>
        </footer>
      </div>
    </>
  );
}
