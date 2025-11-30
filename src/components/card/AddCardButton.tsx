'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AddCardModal } from './AddCardModal';

interface AddCardButtonProps {
  stackId: string;
}

export function AddCardButton({ stackId }: AddCardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        stackId={stackId}
      />
    </>
  );
}

