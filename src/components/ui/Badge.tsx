import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) => {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-full tracking-wide transition-colors';

  const variants = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
    neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
    brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse-subtle" />
      {children}
    </span>
  );
};
