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
  const { showSuccess } = useToast();
  
  const handleSuccess = () => {
    showSuccess('Welcome to Stacq!');
    onClose();
    // Force reload to refresh session
    window.location.href = '/';
  };

  return (
    // title="" hides the default modal header text but keeps the close button
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title=""> 
      <div className="bg-white rounded-lg shadow-card p-6 sm:p-8">
        <SignupFormContent
          onSuccess={handleSuccess}
          onSwitchToLogin={onSwitchToLogin}
          showLogo={true}
          isFullPage={false}
        />
      </div>
    </Modal>
  );
}