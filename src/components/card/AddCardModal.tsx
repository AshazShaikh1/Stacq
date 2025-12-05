'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stackId?: string; // Legacy support
  collectionId?: string;
}

export function AddCardModal({ isOpen, onClose, stackId, collectionId }: AddCardModalProps) {
  const id = collectionId || stackId;
  
  if (!id) {
    console.error('AddCardModal: Either collectionId or stackId must be provided');
    return null;
  }
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);
    
    if (!newUrl.trim()) {
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      return; // Invalid URL, don't fetch
    }

    setIsFetchingMetadata(true);
    setError('');

    try {
      // Call API to fetch metadata
      const response = await fetch('/api/cards/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setTitle(data.title || '');
        setDescription(data.description || '');
        setThumbnailUrl(data.thumbnail_url || '');
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
      // Continue anyway - user can fill manually
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to add cards');
        setIsLoading(false);
        return;
      }

      // Create or find card
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: title || undefined,
          description: description || undefined,
          thumbnail_url: thumbnailUrl || undefined,
          collection_id: collectionId,
          stack_id: stackId, // Legacy support
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add card');
        setIsLoading(false);
        return;
      }

      // Reset form and close
      setUrl('');
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      onClose();
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Card" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <Input
          type="url"
          label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Loading State */}
        {isFetchingMetadata && (
          <div className="flex items-center gap-2 text-small text-gray-muted">
            <div className="w-4 h-4 border-2 border-jet border-t-transparent rounded-full animate-spin" />
            Fetching metadata...
          </div>
        )}

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="relative w-full h-48 rounded-input overflow-hidden bg-gray-light">
            <img
              src={thumbnailUrl}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title */}
        <Input
          type="text"
          label="Title"
          placeholder="Card title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />

        {/* Description */}
        <div>
          <label className="block text-body font-medium text-jet-dark mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Card description"
            className="w-full px-4 py-3 rounded-input border border-gray-light text-body text-jet-dark placeholder:text-gray-muted focus:outline-none focus:ring-2 focus:ring-jet focus:border-transparent disabled:bg-gray-light disabled:cursor-not-allowed resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Thumbnail URL Override */}
        <Input
          type="url"
          label="Thumbnail URL (optional)"
          placeholder="https://example.com/image.jpg"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          helperText="Override the auto-detected thumbnail"
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-input text-small text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Add Card
          </Button>
        </div>
      </form>
    </Modal>
  );
}

