'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  {
    src: '/images/hero_maid_professional.jpg',
    alt: 'Verified Maid Professional',
  },
  {
    src: '/images/hero_maid_service.jpg',
    alt: 'Professional Kitchen & Home Cleaning',
  },
  {
    src: '/images/hero_maid_customer.jpg',
    alt: 'Trusted Customer Service Experience',
  },
];

interface HeroImageCarouselProps {
  className?: string;
  autoPlayIntervalMs?: number;
}

export function HeroImageCarousel({ className = '', autoPlayIntervalMs = 3200 }: HeroImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, autoPlayIntervalMs);

    return () => clearInterval(timer);
  }, [isPaused, autoPlayIntervalMs]);

  const current = HERO_IMAGES[currentIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm bg-white select-none ${className}`}
    >
      {/* Moving Carousel Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle Bottom Dots Indicator */}
      <div className="absolute bottom-3 inset-x-0 z-10 flex justify-center items-center gap-1.5">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-4 h-1.5 bg-white shadow-xs'
                : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
