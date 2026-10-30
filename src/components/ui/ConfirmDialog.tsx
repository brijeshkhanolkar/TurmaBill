import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  // Legacy names retained so all pages work seamlessly.
  onClose?: () => void;
  confirmText?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
  isLoading = false,
  onClose,
  confirmText,
  variant
}: ConfirmDialogProps) {
  const close = onClose ?? onCancel ?? (() => {});
  const label = confirmText ?? confirmLabel;
  const dangerous = variant === 'danger' || isDanger;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button 
            variant={dangerous ? 'danger' : 'primary'} 
            size="sm"
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {label}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-xl ${dangerous ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
          {dangerous ? <AlertTriangle size={20} /> : <Info size={20} />}
        </div>
        <div className="pt-0.5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}

