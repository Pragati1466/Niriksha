import React from 'react'
import { cn } from '../../lib/utils'

const Badge = React.forwardRef(({ className, variant = 'secondary', ...props }, ref) => {
  const variants = {
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-primary/10 text-primary border border-primary/20',
  }

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = 'Badge'

export default Badge
