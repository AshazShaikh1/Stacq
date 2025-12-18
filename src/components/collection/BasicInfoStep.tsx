'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface BasicInfoStepProps {
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  error: string;
  isLoading: boolean;
  onCancel: () => void;
  onNext: () => void;
}

export function BasicInfoStep({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  tags,
  onTagsChange,
  error,
  isLoading,
  onCancel,
  onNext,
}: BasicInfoStepProps) {
  const [tagInput, setTagInput] = useState('');

  const colorForTag = (tag: string) => {
    const palette = [
      { bg: 'bg-emerald/15', text: 'text-emerald' },
      { bg: 'bg-sky-100', text: 'text-sky-700' },
    ];
    const hash = tag.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  const addTag = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    if (tags.includes(clean)) return;
    onTagsChange([...tags, clean]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <Input
        type="text"
        label="Title"
        placeholder="My Awesome Collection"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        required
        disabled={isLoading}
      />

      <div>
        <label className="block text-body font-medium text-jet-dark mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe what this collection is about..."
          className="w-full px-4 py-3 rounded-input border border-gray-light text-body text-jet-dark placeholder:text-gray-muted focus:outline-none focus:ring-2 focus:ring-jet focus:border-transparent disabled:bg-gray-light disabled:cursor-not-allowed resize-none"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-body font-medium text-jet-dark">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 bg-white border border-gray-light rounded-input p-2 min-h-[48px]">
          {tags.map((tag) => {
            const colors = colorForTag(tag);
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}
              >
                {tag}
                <button
                  type="button"
                  className="text-xs hover:opacity-80"
                  onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            );
          })}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Press Enter to add"
            className="flex-1 min-w-[120px] px-2 py-1 text-body text-jet-dark outline-none"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-gray-muted">Press Enter to add tags.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-input text-small text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onNext}
          disabled={isLoading || !title.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

