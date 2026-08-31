'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export function SplashScreen({ onComplete, durationMs = 1700 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  // Motion transitions adjusted for accessibility
  const baseTransition = shouldReduceMotion
    ? { duration: 0.2 }
    : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white text-slate-900 select-none overflow-hidden py-12 px-6"
        >
          {/* Top spacer for vertical balance */}
          <div className="w-full max-w-xs h-8" />

          {/* Center Brand Identity */}
          <div className="flex flex-col items-center text-center space-y-5 max-w-xs sm:max-w-sm w-full">
            {/* Logo Icon Badge */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={baseTransition}
              className="size-16 sm:size-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/15 border border-blue-700/10 shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-9 sm:size-11 stroke-current stroke-[2.4]"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
                <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </motion.div>

            {/* Brand Title & Tagline */}
            <div className="space-y-1.5 pt-1">
              <motion.h1
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  delay: shouldReduceMotion ? 0.05 : 0.18,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none"
              >
                Maid<span className="text-blue-600">Easy</span>
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  delay: shouldReduceMotion ? 0.1 : 0.32,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide"
              >
                Trusted help for your home
              </motion.p>
            </div>
          </div>

          {/* Bottom Security / Trust Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0.2 : 0.5, duration: 0.4 }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 select-none tracking-wide"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5 stroke-current stroke-2 text-slate-400"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Verified Household Services</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

