'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreateSectionModal } from './CreateSectionModal';

export function ClientAddSectionButton({ collectionId }: { collectionId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        + Add Section
      </Button>
      <CreateSectionModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        collectionId={collectionId} 
      />
    </>
  );
}
