'use client';

import { Modal } from '@/components/ui/Modal';
import { LoginFormContent } from './LoginFormContent';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
      <div className="bg-white rounded-lg shadow-card p-6 sm:p-8">
        <LoginFormContent
          onSuccess={onClose}
          onSwitchToSignup={onSwitchToSignup}
          showLogo={true}
          isFullPage={false}
        />
      </div>
    </Modal>
  );
}