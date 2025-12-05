'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AddCardModal } from './AddCardModal';

interface AddCardButtonProps {
  stackId?: string; // Legacy support
  collectionId?: string;
}

export function AddCardButton({ stackId, collectionId }: AddCardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const id = collectionId || stackId;

  if (!id) {
    console.error('AddCardButton: Either collectionId or stackId must be provided');
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
      >
        Add Card
      </Button>
      <AddCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionId={collectionId}
        stackId={stackId}
      />
    </>
  );
}

