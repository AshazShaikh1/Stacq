'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
}

export function CreateSectionModal({ isOpen, onClose, collectionId }: CreateSectionModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error: dbError } = await supabase
        .from('sections')
        .insert({
          collection_id: collectionId,
          title: title.trim(),
          order: 999 
        });

      if (dbError) throw dbError;

      setTitle('');
      setIsLoading(false);
      onClose();
      router.refresh();
      // Optional: Dispatch event to notify listeners
       window.dispatchEvent(new CustomEvent('section-added', { detail: { collectionId } }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create section');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Section" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Section Title"
          placeholder="e.g. Podcasts, Articles, Videos"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
          autoFocus
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-small text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Create Section
          </Button>
        </div>
      </form>
    </Modal>
  );
}
