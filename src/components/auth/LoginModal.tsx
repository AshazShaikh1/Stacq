'use client';

import { Modal } from '@/components/ui/Modal';
import { LoginFormContent } from './LoginFormContent';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <LoginFormContent
        onSuccess={handleClose}
        onSwitchToSignup={onSwitchToSignup}
        showLogo={true}
        isFullPage={false}
      />
    </Modal>
  );
}

