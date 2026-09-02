import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  // Legacy names retained so list pages can use the same dialog safely.
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
  const close = onClose ?? onCancel;
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
          <Button variant="secondary" onClick={close} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button 
            variant={dangerous ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {label}
          </Button>
        </>
      }
    >
      <div className="flex items-start">
        <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${dangerous ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} mr-4`}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
