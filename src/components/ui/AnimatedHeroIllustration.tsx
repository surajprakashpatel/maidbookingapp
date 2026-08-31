'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, CalendarCheck } from 'lucide-react';

interface AnimatedHeroIllustrationProps {
  className?: string;
}

export function AnimatedHeroIllustration({ className = '' }: AnimatedHeroIllustrationProps) {
  return (
    <div className={`relative w-full max-w-lg aspect-[4/3] flex items-center justify-center select-none overflow-visible ${className}`}>
      {/* Background Soft Aura Glow */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-4 rounded-full bg-gradient-to-tr from-[var(--primary-100)] via-[var(--primary-50)] to-[#FCE7F3] blur-2xl pointer-events-none"
      />

      {/* Floating Sparkle Particles */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div
          animate={{ y: [-4, 4, -4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] left-[12%] text-[var(--accent-400)] text-base font-bold"
        >
          ✦
        </motion.div>
        <motion.div
          animate={{ y: [4, -4, 4], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-[15%] right-[15%] text-[var(--primary-500)] text-sm font-bold"
        >
          ✦
        </motion.div>
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[20%] left-[8%] text-[var(--accent-400)] text-xs font-bold"
        >
          ✦
        </motion.div>
      </div>

      {/* MAIN SVG ANIMATED SCENE */}
      <svg
        viewBox="0 0 440 330"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-md relative z-0"
      >
        {/* 1. MODERN HOME BACKDROP & WINDOW */}
        {/* Floor Line */}
        <rect x="20" y="270" width="400" height="4" rx="2" fill="var(--border)" opacity="0.6" />
        
        {/* Floor Gleam / Shine Strip */}
        <motion.rect
          x="100"
          y="270"
          width="240"
          height="4"
          rx="2"
          fill="url(#floorGleam)"
          animate={{ x: [80, 160, 80] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Home Window Frame */}
        <rect x="80" y="40" width="280" height="210" rx="28" fill="#FFFFFF" stroke="var(--border)" strokeWidth="3" />
        <line x1="220" y1="40" x2="220" y2="250" stroke="var(--primary-100)" strokeWidth="2" strokeDasharray="6 6" />
        <line x1="80" y1="145" x2="360" y2="145" stroke="var(--primary-100)" strokeWidth="2" strokeDasharray="6 6" />

        {/* 2. SWAYING HOUSE PLANT (LEFT SIDE) */}
        <g transform="translate(60, 180)">
          {/* Pot */}
          <path d="M15 60 L25 90 L45 90 L55 60 Z" fill="#E2E8F0" stroke="var(--border)" strokeWidth="2" />
          {/* Plant Leaves Swaying */}
          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '35px 60px' }}
          >
            <path d="M35 60 Q20 30 10 35 Q25 50 35 60 Z" fill="#34D399" />
            <path d="M35 60 Q35 20 45 15 Q45 40 35 60 Z" fill="#10B981" />
            <path d="M35 60 Q50 30 60 40 Q45 55 35 60 Z" fill="#059669" />
          </motion.g>
        </g>

        {/* 3. ANIMATED MAID CHARACTER */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Maid Legs */}
          <rect x="202" y="210" width="14" height="60" rx="7" fill="#1E293B" />
          <rect x="224" y="210" width="14" height="60" rx="7" fill="#1E293B" />
          {/* Shoes */}
          <rect x="196" y="264" width="22" height="10" rx="5" fill="#64748B" />
          <rect x="224" y="264" width="22" height="10" rx="5" fill="#64748B" />

          {/* Torso & Uniform Dress */}
          <path d="M185 130 C185 115 255 115 255 130 L260 215 L180 215 Z" fill="var(--primary-600)" />

          {/* White Apron */}
          <path d="M198 135 C198 135 242 135 242 135 L238 215 L202 215 Z" fill="#FFFFFF" />

          {/* Apron Pocket */}
          <rect x="208" y="175" width="24" height="22" rx="4" fill="var(--primary-50)" stroke="var(--primary-200)" strokeWidth="1.5" />

          {/* Maid Head & Hair (Gentle Head Tilt) */}
          <motion.g
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '220px 105px' }}
          >
            {/* Hair Bun */}
            <circle cx="220" cy="65" r="16" fill="#1E1035" />
            <circle cx="220" cy="65" r="12" fill="var(--primary-900)" />

            {/* Face Base */}
            <ellipse cx="220" cy="92" rx="18" ry="20" fill="#FCE7F3" />

            {/* Hair Bangs */}
            <path d="M202 90 C202 75 238 75 238 90 C234 80 206 80 202 90 Z" fill="#1E1035" />

            {/* Eyes & Blinking */}
            <motion.g
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.95, 1] }}
              style={{ transformOrigin: '220px 90px' }}
            >
              <circle cx="213" cy="90" r="2.2" fill="#1E1035" />
              <circle cx="227" cy="90" r="2.2" fill="#1E1035" />
            </motion.g>

            {/* Rosy Cheeks */}
            <circle cx="209" cy="96" r="3" fill="#F472B6" opacity="0.4" />
            <circle cx="231" cy="96" r="3" fill="#F472B6" opacity="0.4" />

            {/* Friendly Smile */}
            <path d="M214 98 Q220 103 226 98" stroke="#1E1035" strokeWidth="2" strokeLinecap="round" fill="none" />
          </motion.g>

          {/* 4. CLEANING ARM & MOP MOTION (SWEEPING LEFT <-> RIGHT) */}
          <motion.g
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '245px 135px' }}
          >
            {/* Arm */}
            <path d="M245 135 Q265 155 255 175" stroke="#FCE7F3" strokeWidth="9" strokeLinecap="round" />
            {/* Mop Stick */}
            <line x1="255" y1="170" x2="295" y2="265" stroke="var(--primary-700)" strokeWidth="4" strokeLinecap="round" />
            {/* Mop Head */}
            <path d="M280 265 L310 265 L315 272 L275 272 Z" fill="#E2E8F0" stroke="var(--primary-400)" strokeWidth="1.5" />
          </motion.g>
        </motion.g>

        {/* SVG Gradients */}
        <defs>
          <linearGradient id="floorGleam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent-400)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* FLOATING GLASSMORPHISM UI CARDS */}

      {/* Card 1: Verified Badge (Top Left) */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[8%] -left-[2%] sm:left-[2%] z-20 bg-white/90 backdrop-blur-md p-2.5 px-3.5 rounded-2xl border border-[var(--primary-100)] shadow-lg flex items-center gap-2.5 text-xs font-extrabold text-[var(--text-primary)]"
      >
        <div className="size-7 rounded-xl bg-[var(--primary-50)] text-[var(--primary-600)] flex items-center justify-center shrink-0">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <div className="text-[11px] leading-tight">100% Verified</div>
          <div className="text-[9px] font-semibold text-[var(--text-secondary)]">Background Checked</div>
        </div>
      </motion.div>

      {/* Card 2: Rating (Top Right) */}
      <motion.div
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute top-[18%] -right-[2%] sm:right-[2%] z-20 bg-white/90 backdrop-blur-md p-2.5 px-3.5 rounded-2xl border border-amber-100 shadow-lg flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]"
      >
        <Star className="size-4 fill-amber-400 text-amber-400 shrink-0" />
        <div>
          <div className="text-[11px] leading-tight">4.9 ★ Rating</div>
          <div className="text-[9px] font-semibold text-[var(--text-secondary)]">1,200+ Reviews</div>
        </div>
      </motion.div>

      {/* Card 3: Availability (Bottom Right) */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute bottom-[8%] right-[4%] z-20 bg-white/90 backdrop-blur-md p-2.5 px-3.5 rounded-2xl border border-emerald-100 shadow-lg flex items-center gap-2 text-xs font-extrabold text-emerald-800"
      >
        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
        <CalendarCheck className="size-4 text-emerald-600 shrink-0" />
        <span className="text-[10px] font-bold">Maids Available Today</span>
      </motion.div>
    </div>
  );
}
