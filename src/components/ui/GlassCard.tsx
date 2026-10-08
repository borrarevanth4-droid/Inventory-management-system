import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 shadow-xl shadow-slate-950/5 rounded-3xl p-6 transition-all duration-300',
        hoverEffect && 'hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-2xl hover:border-brand-500/30 dark:hover:border-brand-500/30',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
