import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] touch-manipulation min-h-[44px]';

  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 border border-brand-400/30 focus:ring-brand-500',
    secondary: 'backdrop-blur-xl bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-900/10 dark:border-white/10 focus:ring-slate-400',
    outline: 'backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-800 dark:text-slate-200 focus:ring-brand-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 focus:ring-rose-500',
    ghost: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl min-h-[36px]',
    md: 'px-5 py-2.5 text-sm rounded-2xl min-h-[44px]',
    lg: 'px-7 py-3.5 text-base rounded-3xl min-h-[52px]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};
