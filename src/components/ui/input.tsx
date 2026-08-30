import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-white px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-50)] disabled:cursor-not-allowed disabled:bg-[var(--gray-100)] disabled:opacity-70',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[90px] w-full rounded-[10px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-50)] disabled:cursor-not-allowed disabled:bg-[var(--gray-100)] disabled:opacity-70',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Input, Textarea };
