import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] shadow-xs active:bg-[var(--primary-700)]',
        accent: 'bg-[var(--accent-400)] text-white hover:bg-[var(--accent-500)] shadow-xs',
        destructive: 'bg-[var(--error-500)] text-white hover:bg-[var(--error-600)] shadow-xs',
        outline: 'border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-500)]',
        secondary: 'bg-[var(--primary-50)] text-[var(--primary-500)] hover:bg-[var(--primary-100)]',
        ghost: 'hover:bg-[var(--gray-100)] text-[var(--text-primary)] hover:text-[var(--primary-500)]',
        link: 'text-[var(--accent-400)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5 text-sm',
        sm: 'h-9 rounded-[8px] px-3 text-xs',
        lg: 'h-12 rounded-[12px] px-6 text-base font-bold',
        icon: 'h-10 w-10 p-0 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableMotion?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableMotion = true, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    if (enableMotion) {
      return (
        <motion.button
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as HTMLMotionProps<'button'>)}
        >
          {children}
        </motion.button>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
