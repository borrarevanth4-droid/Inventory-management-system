import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md',
        className
      )}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};
