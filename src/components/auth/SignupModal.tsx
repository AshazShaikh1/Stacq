'use client';

import { Modal } from '@/components/ui/Modal';
import { SignupFormContent } from './SignupFormContent';
import { useToast } from '@/contexts/ToastContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const { showSuccess, showInfo } = useToast();
  
  const handleClose = () => {
    onClose();
  };

  const handleSuccess = () => {
    showSuccess('Account created! Please check your email to confirm your account before signing in.');
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <SignupFormContent
        onSuccess={handleSuccess}
        onSwitchToLogin={onSwitchToLogin}
        showLogo={true}
        isFullPage={false}
      />
    </Modal>
  );
}
