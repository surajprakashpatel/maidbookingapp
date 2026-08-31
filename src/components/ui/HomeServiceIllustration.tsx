import * as React from 'react';
import Image from 'next/image';

interface IllustrationProps {
  className?: string;
}

export function HomeServiceIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center ${className || ''}`}>
      <Image
        src="/illustrations/hero_maid_booking.jpg"
        alt="Trusted Maid Booking Platform"
        width={480}
        height={360}
        priority
        className="w-full h-auto max-h-[300px] object-contain rounded-2xl drop-shadow-md transition-all hover:scale-[1.02]"
      />
    </div>
  );
}
