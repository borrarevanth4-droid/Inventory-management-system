import React from 'react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { LucideIcon, PackagePlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackagePlus,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <GlassCard className={`text-center py-12 px-6 max-w-md mx-auto my-8 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-16 h-16 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20"
      >
        <Icon className="w-8 h-8" />
      </motion.div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <GlassButton variant="primary" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </GlassCard>
  );
};
