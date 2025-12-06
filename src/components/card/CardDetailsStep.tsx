'use client';

import { memo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUploadZone } from './FileUploadZone';
import type { CardType } from '@/types';

interface CardDetailsStepProps {
  cardType: CardType;
  url: string;
  onUrlChange: (url: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  imageFile: File | null;
  imagePreview: string | null;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  isDraggingImage: boolean;
  onImageDragOver: (e: React.DragEvent) => void;
  onImageDragLeave: (e: React.DragEvent) => void;
  onImageDrop: (e: React.DragEvent) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  docsFile: File | null;
  isDraggingDocs: boolean;
  onDocsDragOver: (e: React.DragEvent) => void;
  onDocsDragLeave: (e: React.DragEvent) => void;
  onDocsDrop: (e: React.DragEvent) => void;
  onDocsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isFetchingMetadata: boolean;
  error: string;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const CardDetailsStep = memo(function CardDetailsStep({
  cardType,
  url,
  onUrlChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  imageFile,
  imagePreview,
  imageUrl,
  onImageUrlChange,
  isDraggingImage,
  onImageDragOver,
  onImageDragLeave,
  onImageDrop,
  onImageChange,
  docsFile,
  isDraggingDocs,
  onDocsDragOver,
  onDocsDragLeave,
  onDocsDrop,
  onDocsChange,
  isFetchingMetadata,
  error,
  isLoading,
  onBack,
  onNext,
}: CardDetailsStepProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const focusedInputIdRef = useRef<string | null>(null);
  const cursorPositionRef = useRef<number>(0);

  // Restore focus after re-render if an input was focused
  useEffect(() => {
    if (focusedInputIdRef.current) {
      const inputRef = focusedInputIdRef.current === 'card-title-input' 
        ? titleInputRef 
        : descriptionInputRef;
      
      if (inputRef.current && document.activeElement !== inputRef.current) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // Restore cursor position
            if (cursorPositionRef.current > 0) {
              inputRef.current.setSelectionRange(
                cursorPositionRef.current, 
                cursorPositionRef.current
              );
            }
          }
        });
      }
    }
  }, [title, description]);

  const handleTitleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedInputIdRef.current = 'card-title-input';
    cursorPositionRef.current = e.target.selectionStart || 0;
  };

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedInputIdRef.current = 'card-description-input';
    cursorPositionRef.current = e.target.selectionStart || 0;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cursorPositionRef.current = e.target.selectionStart || e.target.value.length;
    onTitleChange(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cursorPositionRef.current = e.target.selectionStart || e.target.value.length;
    onDescriptionChange(e.target.value);
  };

  const handleTitleBlur = () => {
    if (document.activeElement?.id !== 'card-title-input') {
      focusedInputIdRef.current = null;
    }
  };

  const handleDescriptionBlur = () => {
    if (document.activeElement?.id !== 'card-description-input') {
      focusedInputIdRef.current = null;
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="p-6 space-y-4 max-w-sm mx-auto">
      <h2 className="text-h1 font-bold text-jet-dark mb-6">Card Details</h2>

      {/* Link Input */}
      {cardType === 'link' && (
        <Input
          key="card-url-input"
          id="card-url-input"
          type="url"
          label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          required
          disabled={isLoading || isFetchingMetadata}
        />
      )}

      {/* Image Input */}
      {cardType === 'image' && (
        <FileUploadZone
          type="image"
          file={imageFile}
          preview={imagePreview}
          isDragging={isDraggingImage}
          onDragOver={onImageDragOver}
          onDragLeave={onImageDragLeave}
          onDrop={onImageDrop}
          onFileChange={onImageChange}
          disabled={isLoading}
          imageUrl={imageUrl}
          onImageUrlChange={onImageUrlChange}
        />
      )}

      {/* Docs Input */}
      {cardType === 'docs' && (
        <FileUploadZone
          type="docs"
          file={docsFile}
          preview={null}
          isDragging={isDraggingDocs}
          onDragOver={onDocsDragOver}
          onDragLeave={onDocsDragLeave}
          onDrop={onDocsDrop}
          onFileChange={onDocsChange}
          disabled={isLoading}
        />
      )}

      {isFetchingMetadata && (
        <div className="flex items-center gap-2 text-small text-gray-muted">
          <div className="w-4 h-4 border-2 border-jet border-t-transparent rounded-full animate-spin" />
          Fetching metadata...
        </div>
      )}

      <Input
        key="card-title-input"
        id="card-title-input"
        type="text"
        label="Title"
        placeholder="Card title"
        value={title}
        onChange={handleTitleChange}
        onFocus={handleTitleFocus}
        onBlur={handleTitleBlur}
        ref={titleInputRef}
        required
        disabled={isLoading}
      />

      <Input
        key="card-description-input"
        id="card-description-input"
        type="text"
        label="Description"
        placeholder="Card description (optional)"
        value={description}
        onChange={handleDescriptionChange}
        onFocus={handleDescriptionFocus}
        onBlur={handleDescriptionBlur}
        ref={descriptionInputRef}
        disabled={isLoading}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-small text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isLoading}
        >
          Continue
        </Button>
      </div>
    </form>
  );
});

