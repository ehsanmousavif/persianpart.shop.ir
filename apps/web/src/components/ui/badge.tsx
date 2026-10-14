import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'default'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-default/15 text-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/25',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    outline: 'bg-transparent text-foreground border-border',
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl border transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
