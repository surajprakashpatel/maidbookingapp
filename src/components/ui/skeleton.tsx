import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[var(--gray-200)]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
