'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CreateStackModal } from '@/components/stack/CreateStackModal';
import { CreateCardModal } from '@/components/card/CreateCardModal';

interface CreateOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOptionsModal({ isOpen, onClose }: CreateOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'stack' | 'card' | null>(null);
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const handleOptionSelect = (option: 'stack' | 'card') => {
    setSelectedOption(option);
    onClose();
    
    if (option === 'stack') {
      setIsStackModalOpen(true);
    } else if (option === 'card') {
      setIsCardModalOpen(true);
    }
  };

  const handleStackModalClose = () => {
    setIsStackModalOpen(false);
    setSelectedOption(null);
  };

  const handleCardModalClose = () => {
    setIsCardModalOpen(false);
    setSelectedOption(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <div className="p-6">
          <h2 className="text-h1 font-bold text-jet-dark mb-6">Create</h2>
          
          <div className="space-y-3">
            {/* Stack Option */}
            <button
              onClick={() => handleOptionSelect('stack')}
              className="w-full p-4 rounded-lg border-2 border-gray-light hover:border-jet transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-light flex items-center justify-center flex-shrink-0 group-hover:bg-jet/10 transition-colors">
                  <svg
                    className="w-6 h-6 text-jet-dark"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-h2 font-semibold text-jet-dark mb-1">Stack</h3>
                  <p className="text-body text-gray-muted">
                    Organise a collection of your favourite resources by creating a stack
                  </p>
                </div>
              </div>
            </button>

            {/* Card Option */}
            <button
              onClick={() => handleOptionSelect('card')}
              className="w-full p-4 rounded-lg border-2 border-gray-light hover:border-jet transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-light flex items-center justify-center flex-shrink-0 group-hover:bg-jet/10 transition-colors">
                  <svg
                    className="w-6 h-6 text-jet-dark"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-h2 font-semibold text-jet-dark mb-1">Card</h3>
                  <p className="text-body text-gray-muted">
                    Add a resource link to an existing stack or create a new one
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      <CreateStackModal isOpen={isStackModalOpen} onClose={handleStackModalClose} />
      <CreateCardModal isOpen={isCardModalOpen} onClose={handleCardModalClose} />
    </>
  );
}

