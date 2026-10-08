import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              'w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-sm',
              icon && 'pl-10',
              rightElement && 'pr-12',
              error && 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500',
              className
            )}
            {...props}
          />
          {rightElement && <div className="absolute right-3">{rightElement}</div>}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
