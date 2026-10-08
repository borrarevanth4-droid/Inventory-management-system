import React from 'react';
import { GlassModal } from './GlassModal';
import { GlassButton } from './GlassButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 pt-4 justify-center">
          <GlassButton variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </GlassButton>
          <GlassButton variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};
