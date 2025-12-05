'use client';

import { useState, lazy, Suspense } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load modals for better code splitting
const CreateCollectionModal = lazy(() => import('@/components/collection/CreateCollectionModal').then(m => ({ default: m.CreateCollectionModal })));
const CreateCardModal = lazy(() => import('@/components/card/CreateCardModal').then(m => ({ default: m.CreateCardModal })));

interface CreateOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOptionsModal({ isOpen, onClose }: CreateOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'collection' | 'card' | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const handleOptionSelect = (option: 'collection' | 'card') => {
    setSelectedOption(option);
    onClose();
    
    if (option === 'collection') {
      setIsCollectionModalOpen(true);
    } else if (option === 'card') {
      setIsCardModalOpen(true);
    }
  };

  const handleCollectionModalClose = () => {
    setIsCollectionModalOpen(false);
    setSelectedOption(null);
  };

  const handleCollectionCreated = () => {
    setIsCollectionModalOpen(false);
    setSelectedOption(null);
  };

  const handleCardModalClose = () => {
    setIsCardModalOpen(false);
    setSelectedOption(null);
  };

  const ModalFallback = () => (
    <div className="p-6">
      <Skeleton variant="rectangular" height={200} className="w-full mb-4" />
      <Skeleton variant="text" height={40} width="60%" />
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <div className="p-6">
          <h2 className="text-h1 font-bold text-jet-dark mb-6">Create</h2>
          
          <div className="space-y-3">
            {/* Collection Option */}
            <button
              onClick={() => handleOptionSelect('collection')}
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
                  <h3 className="text-h2 font-semibold text-jet-dark mb-1">Collection</h3>
                  <p className="text-body text-gray-muted">
                    Organise a collection of your favourite resources by creating a collection
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
                    Add a resource link to an existing collection or create a new one
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {isCollectionModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <CreateCollectionModal 
            isOpen={isCollectionModalOpen} 
            onClose={handleCollectionModalClose}
            onCollectionCreated={handleCollectionCreated}
          />
        </Suspense>
      )}

      {isCardModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <CreateCardModal isOpen={isCardModalOpen} onClose={handleCardModalClose} />
        </Suspense>
      )}
    </>
  );
}

