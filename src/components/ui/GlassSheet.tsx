import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const GlassSheet: React.FC<GlassSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="relative w-full backdrop-blur-3xl bg-white/95 dark:bg-slate-900/95 border-t border-white/60 dark:border-slate-800 rounded-t-3xl p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
