import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--primary-50)] text-[var(--primary-700)] border-[var(--primary-100)]',
        secondary:
          'border-transparent bg-[var(--gray-100)] text-[var(--gray-700)]',
        success:
          'border-transparent bg-[var(--success-50)] text-[var(--success-700)] border-[var(--success-100)]',
        destructive:
          'border-transparent bg-[var(--error-50)] text-[var(--error-700)] border-[var(--error-100)]',
        accent:
          'border-transparent bg-[var(--accent-50)] text-[var(--accent-700)] border-[var(--accent-100)]',
        outline: 'text-[var(--text-primary)] border-[var(--border)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
