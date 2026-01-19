'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';

interface RelatedCollection {
  id: string;
  title: string;
  cover_image_url?: string;
  owner?: {
    display_name: string;
  };
}

interface RelatedCollectionsInputProps {
  initialCollections?: RelatedCollection[];
  onChange: (collections: string[]) => void; // Returns array of IDs
}

export function RelatedCollectionsInput({ initialCollections = [], onChange }: RelatedCollectionsInputProps) {
  const [selectedCollections, setSelectedCollections] = useState<RelatedCollection[]>(initialCollections);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelatedCollection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Notify parent of changes
    onChange(selectedCollections.map(c => c.id));
  }, [selectedCollections]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=collections&limit=5`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected ones
          const filtered = (data.collections || []).filter((c: any) => 
            !selectedCollections.some(selected => selected.id === c.id)
          );
          setResults(filtered);
          setIsOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery, selectedCollections]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCollection = (collection: RelatedCollection) => {
    setSelectedCollections(prev => [...prev, collection]);
    setQuery('');
    setIsOpen(false);
  };

  const removeCollection = (id: string) => {
    setSelectedCollections(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <label className="block text-body font-medium text-jet-dark">
        Related Collections (optional)
      </label>
      
      {/* Selected List */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCollections.map(collection => (
          <div key={collection.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg pl-1 pr-2 py-1">
             <div className="w-6 h-6 relative rounded overflow-hidden flex-shrink-0 bg-gray-200">
               {collection.cover_image_url ? (
                 <Image src={collection.cover_image_url} alt="" fill className="object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-[10px]">📚</div>
               )}
             </div>
             <div className="flex flex-col text-xs max-w-[120px]">
               <span className="font-medium truncate">{collection.title}</span>
             </div>
             <button 
                type="button"
                onClick={() => removeCollection(collection.id)}
                className="text-gray-400 hover:text-red-500 ml-1"
             >
               ×
             </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search collections to link..."
          className="w-full px-4 py-2 rounded-lg border border-gray-light text-body focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        
        {/* Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-light max-h-60 overflow-y-auto z-10">
            {isLoading ? (
              <div className="p-3 text-center text-gray-muted text-sm">Loading...</div>
            ) : results.length > 0 ? (
              results.map(collection => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => addCollection(collection)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 relative rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                    {collection.cover_image_url ? (
                      <Image src={collection.cover_image_url} alt="" fill className="object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-xs">📚</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-jet-dark truncate">{collection.title}</div>
                    <div className="text-xs text-gray-muted truncate">by {collection.owner?.display_name || 'Unknown'}</div>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">+ Add</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-muted text-sm">No collections found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
