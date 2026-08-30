import * as React from 'react';

interface IllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function HomeServiceIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Background Soft Glow Aura */}
      <circle cx="200" cy="150" r="120" fill="var(--primary-50)" opacity="0.8" />
      <circle cx="200" cy="150" r="90" fill="#FFFFFF" opacity="0.9" />

      {/* Decorative Sparkles & Dots */}
      <circle cx="90" cy="80" r="4" fill="var(--primary-400)" />
      <circle cx="310" cy="70" r="6" fill="var(--accent-400)" opacity="0.8" />
      <circle cx="330" cy="210" r="5" fill="var(--primary-300)" />
      <circle cx="70" cy="200" r="3" fill="var(--accent-400)" />

      {/* Sparkle Stars */}
      <path d="M110 50 L113 58 L121 61 L113 64 L110 72 L107 64 L99 61 L107 58 Z" fill="var(--accent-400)" />
      <path d="M290 120 L292 125 L297 127 L292 129 L290 134 L288 129 L283 127 L288 125 Z" fill="var(--primary-500)" />

      {/* Modern Home Backdrop Shield / Window */}
      <rect x="110" y="70" width="180" height="170" rx="24" fill="#FFFFFF" stroke="var(--border)" strokeWidth="3" />
      <path d="M110 120 L290 120" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />

      {/* House Silhouette Roof */}
      <path d="M150 70 L200 35 L250 70" stroke="var(--primary-500)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Friendly Maid / Service Provider Character (Vector Art) */}
      {/* Person Hair/Head */}
      <ellipse cx="200" cy="115" rx="20" ry="22" fill="var(--text-primary)" />
      <circle cx="200" cy="120" r="17" fill="#FCE7F3" />
      {/* Hair Top */}
      <path d="M182 115 C182 100 218 100 218 115 C215 106 185 106 182 115 Z" fill="var(--text-primary)" />

      {/* Smile & Eyes */}
      <circle cx="193" cy="118" r="2" fill="var(--text-primary)" />
      <circle cx="207" cy="118" r="2" fill="var(--text-primary)" />
      <path d="M194 125 Q200 130 206 125" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />

      {/* Professional Uniform Body */}
      <path d="M170 150 C170 140 230 140 230 150 L235 210 L165 210 Z" fill="var(--primary-500)" />
      {/* White Apron Accent */}
      <path d="M182 155 C182 155 218 155 218 155 L214 210 L186 210 Z" fill="#FFFFFF" />

      {/* Verified Shield Badge on Chest */}
      <circle cx="200" cy="170" r="10" fill="var(--accent-400)" />
      <path d="M196 170 L199 173 L205 167" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Cleaning Wand / Magic Spark Spray in Hand */}
      <path d="M230 170 L260 140" stroke="var(--primary-600)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="264" cy="136" r="10" fill="var(--primary-50)" />
      <path d="M264 128 L264 144 M256 136 L272 136" stroke="var(--primary-500)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Floating Trust Metric Badges */}
      {/* Rating Tag Left */}
      <g transform="translate(65, 140)">
        <rect x="0" y="0" width="85" height="34" rx="10" fill="#FFFFFF" stroke="var(--border)" strokeWidth="2" />
        <path d="M14 17 L16 11 L21 11 L17 15 L19 21 L14 17.5 L9 21 L11 15 L7 11 L12 11 Z" fill="var(--accent-400)" />
        <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="800" fontFamily="sans-serif">4.9 ★</text>
      </g>

      {/* Verified Tag Right */}
      <g transform="translate(250, 180)">
        <rect x="0" y="0" width="95" height="34" rx="10" fill="#FFFFFF" stroke="var(--border)" strokeWidth="2" />
        <circle cx="16" cy="17" r="7" fill="var(--success-500)" />
        <path d="M13 17 L15 19 L19 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <text x="28" y="21" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="sans-serif">100% Verified</text>
      </g>
    </svg>
  );
}
