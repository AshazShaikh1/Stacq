'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function PaywallModal({ isOpen, onClose, featureName }: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    // Redirect to checkout or pricing page
    // For now, we'll assume a checkout endpoint exists or redirect to a settings/billing page
    window.location.href = '/settings/billing'; 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Pro Analytics" size="md">
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto text-3xl">
          💎
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-jet-dark">
            Upgrade to Stacq Pro
          </h3>
          <p className="text-gray-muted max-w-sm mx-auto">
            The <strong>{featureName}</strong> feature is available exclusively to Pro members. Unlock advanced insights to grow your audience faster.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-emerald">✓</span>
            <span className="text-sm text-jet-dark">Extended 1-year history</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald">✓</span>
            <span className="text-sm text-jet-dark">Conversion & CTR analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald">✓</span>
            <span className="text-sm text-jet-dark">Export data to CSV/PDF</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald">✓</span>
            <span className="text-sm text-jet-dark">Growth velocity metrics</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleUpgrade} className="w-full justify-center text-lg py-6 shadow-emerald/20 shadow-lg">
            Upgrade for $9/mo
          </Button>
          <button 
            onClick={onClose}
            className="text-sm text-gray-muted hover:text-jet-dark transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}