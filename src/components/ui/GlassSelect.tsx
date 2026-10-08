import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              'w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-sm appearance-none pr-10 cursor-pointer',
              error && 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
