'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
    // Don't close immediately if loading, let parent handle close after success
    if (!isLoading) {
       // logic relies on parent controlling isOpen, but often onConfirm is async. 
       // If isLoading is passed, we assume parent handles closing.
       // However, if we don't close here, we might break existing sync usages?
       // Let's assume onConfirm returns Promise? No, type is void.
       // Standard pattern: if isLoading is passed, we rely on parent to close.
       // But to be safe for existing sync usage:
       // The issue is types. 
       // Let's just pass isLoading to Button. Parent responsible for closing logic.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-body text-gray-muted text-center">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'primary' : 'primary'}
            size="sm"
            className={`w-full sm:w-auto ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

