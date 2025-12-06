'use client';

import { useState } from 'react';
import { EmptyCardsState } from '@/components/ui/EmptyState';
import { AddCardModal } from './AddCardModal';

interface EmptyCardsWithAddProps {
  collectionId?: string;
  stackId?: string; // Legacy support
}

export function EmptyCardsWithAdd({ collectionId, stackId }: EmptyCardsWithAddProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <EmptyCardsState onAddCard={() => setIsModalOpen(true)} />
      <AddCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionId={collectionId}
        stackId={stackId}
      />
    </>
  );
}
