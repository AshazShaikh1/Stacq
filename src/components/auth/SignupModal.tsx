'use client';

import { Modal } from '@/components/ui/Modal';
import { SignupFormContent } from './SignupFormContent';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <SignupFormContent
        onSuccess={handleClose}
        onSwitchToLogin={onSwitchToLogin}
        showLogo={true}
        isFullPage={false}
      />
    </Modal>
  );
}
