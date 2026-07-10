import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'size-4 border-2',
  md: 'size-8 border-2',
  lg: 'size-12 border-4',
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className,
      )}
    />
  )
}
