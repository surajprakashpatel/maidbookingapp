import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  showText?: boolean;
}

export function BrandLogo({
  size = 'md',
  href = '/',
  className,
  showText = true,
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: 'size-7 text-xs rounded-lg', text: 'text-base', gap: 'gap-2' },
    md: { icon: 'size-9 text-sm rounded-xl', text: 'text-lg', gap: 'gap-2.5' },
    lg: { icon: 'size-11 text-base rounded-2xl', text: 'text-xl', gap: 'gap-3' },
  };

  const currentSize = sizeMap[size];

  const logoContent = (
    <div className={cn('inline-flex items-center no-underline cursor-pointer select-none', currentSize.gap, className)}>
      {/* Icon Badge */}
      <div className={cn(
        'bg-[var(--primary-500)] text-white font-extrabold flex items-center justify-center shadow-xs shrink-0 transition-transform hover:scale-105',
        currentSize.icon
      )}>
        <svg viewBox="0 0 24 24" fill="none" className="size-[60%] stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-black tracking-tight text-[var(--text-primary)]', currentSize.text)}>
            Maid<span className="text-[var(--primary-500)]">Easy</span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
