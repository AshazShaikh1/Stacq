'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CreateCollectionModal } from '@/components/collection/CreateCollectionModal';
import { CardTypeSelector } from './CardTypeSelector';
import { CardDetailsStep } from './CardDetailsStep';
import { StackSelector } from './StackSelector';
import { trackEvent } from '@/lib/analytics';
import type { CardType, FileData } from '@/types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialFileData?: FileData;
}

type Step = 'type' | 'details' | 'stack';

export function CreateCardModal({ isOpen, onClose, initialUrl, initialFileData }: CreateCardModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type');
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [docsFile, setDocsFile] = useState<File | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  // Legacy support
  const [stacks, setStacks] = useState<any[]>([]);
  const [selectedStackId, setSelectedStackId] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const titleRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const metadataFetchUrlRef = useRef<string>('');

  // Handle initial URL from extension
  useEffect(() => {
    if (isOpen && initialUrl) {
      setUrl(initialUrl);
      setCardType('link');
      setStep('details');
      titleRef.current = '';
      descriptionRef.current = '';
      fetchMetadata(initialUrl);
    }
  }, [isOpen, initialUrl]);

  // Handle initial file data from extension
  useEffect(() => {
    if (isOpen && initialFileData) {
      setCardType(initialFileData.cardType);
      setStep('details');
      
      if (initialFileData.imageUrl) {
        setImageUrl(initialFileData.imageUrl);
        setImagePreview(initialFileData.imageUrl);
      } else if (initialFileData.data) {
        const dataUrl = initialFileData.data;
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], initialFileData!.name, { type: initialFileData!.type });
            if (initialFileData.cardType === 'image') {
              setImageFile(file);
              setImagePreview(dataUrl);
            } else {
              setDocsFile(file);
            }
          })
          .catch(err => console.error('Error converting file:', err));
      }

      if (initialFileData.title) {
        setTitle(initialFileData.title);
        titleRef.current = initialFileData.title;
      }
      if (initialFileData.description) {
        setDescription(initialFileData.description);
        descriptionRef.current = initialFileData.description;
      }
    }
  }, [isOpen, initialFileData]);

  // Fetch user's collections when modal opens
  useEffect(() => {
    if (isOpen && step === 'stack') {
      fetchCollections();
    }
  }, [isOpen, step]);

  // Refresh collections when create collection modal closes
  useEffect(() => {
    if (!isCreateCollectionModalOpen && step === 'stack') {
      fetchCollections();
    }
  }, [isCreateCollectionModalOpen, step]);

  const fetchMetadata = async (urlToFetch: string) => {
    try {
      new URL(urlToFetch);
    } catch {
      return;
    }

    // Store the URL we're fetching metadata for
    metadataFetchUrlRef.current = urlToFetch;
    // Store current values to check if user typed while fetching
    const titleAtFetchStart = titleRef.current;
    const descriptionAtFetchStart = descriptionRef.current;

    setIsFetchingMetadata(true);
    try {
      const response = await fetch('/api/cards/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });

      if (response.ok) {
        const data = await response.json();
        // Only auto-fill if:
        // 1. The URL hasn't changed (user didn't change URL while fetching)
        // 2. The field was empty when we started fetching
        // 3. The field is still empty (user hasn't typed while we were fetching)
        if (metadataFetchUrlRef.current === urlToFetch) {
          // Check current ref values (they update immediately when user types)
          const currentTitle = titleRef.current;
          const currentDescription = descriptionRef.current;
          
          if (data.title && !titleAtFetchStart && !currentTitle.trim()) {
            setTitle(data.title);
            titleRef.current = data.title;
          }
          if (data.description && !descriptionAtFetchStart && !currentDescription.trim()) {
            setDescription(data.description);
            descriptionRef.current = data.description;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: userCollections, error } = await supabase
        .from('collections')
        .select('id, title, description, cover_image_url')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
      } else {
        setCollections(userCollections || []);
        // Legacy support
        setStacks(userCollections || []);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  const handleCardTypeSelect = useCallback((type: CardType) => {
    setCardType(type);
    setStep('details');
    setIsDraggingImage(false);
    setIsDraggingDocs(false);
  }, []);

  const handleFileSelect = (file: File, type: 'image' | 'docs') => {
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        setError('Please select a valid document file (PDF, DOC, DOCX, or TXT)');
        return;
      }
      setDocsFile(file);
    }
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file, 'image');
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file, 'docs');
  };

  const handleDragOver = (e: React.DragEvent, type: 'image' | 'docs') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setIsDraggingImage(true);
    else setIsDraggingDocs(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'image' | 'docs') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setIsDraggingImage(false);
    else setIsDraggingDocs(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'docs') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setIsDraggingImage(false);
    else setIsDraggingDocs(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file, type);
  };

  const handleUrlChange = useCallback(async (newUrl: string) => {
    setUrl(newUrl);
    
    if (!newUrl.trim()) {
      setTitle('');
      setDescription('');
      titleRef.current = '';
      descriptionRef.current = '';
      return;
    }

    await fetchMetadata(newUrl);
  }, []);

  const handleDetailsNext = () => {
    if (cardType === 'link' && !url.trim()) {
      setError('Please enter a URL');
      return;
    }
    if (cardType === 'image' && !imageFile && !imageUrl) {
      setError('Please select an image or enter an image URL');
      return;
    }
    if (cardType === 'docs' && !docsFile) {
      setError('Please select a document');
      return;
    }
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    // Allow skipping stack selection - user can create standalone card
    setStep('stack');
  };

  const handleSubmit = async () => {
    // Stack is optional - allow standalone cards
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to add cards');
        setIsLoading(false);
        return;
      }

      let cardUrl = url;
      let thumbnailUrl = '';

      // Handle image upload or URL
      if (cardType === 'image') {
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `cards/${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(fileName, imageFile);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('thumbnails')
              .getPublicUrl(fileName);
            cardUrl = publicUrl;
            thumbnailUrl = publicUrl;
          }
        } else if (imageUrl) {
          cardUrl = imageUrl;
          thumbnailUrl = imageUrl;
        }
      }

      // Handle docs upload
      if (cardType === 'docs' && docsFile) {
        const fileExt = docsFile.name.split('.').pop();
        const fileName = `docs/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(fileName, docsFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(fileName);
          cardUrl = publicUrl;
        }
      }

      // Determine source
      const isFromExtension = !!(initialUrl || initialFileData);
      const id = selectedCollectionId || selectedStackId;
      const cardSource = isFromExtension 
        ? 'extension' 
        : (id ? 'collection' : 'manual');

      // Create card (standalone or with collection)
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cardUrl,
          title: title.trim(),
          description: description.trim() || undefined,
          thumbnail_url: thumbnailUrl || undefined,
          collection_id: selectedCollectionId || undefined,
          stack_id: selectedStackId || undefined, // Legacy support
          is_public: true, // Standalone cards are public by default
          source: cardSource,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add card');
        setIsLoading(false);
        return;
      }

      const cardData = await response.json();
      
      // Track analytics
      if (cardData.card) {
        // Check if this is from extension (has initialUrl or initialFileData)
        const isFromExtension = !!(initialUrl || initialFileData);
        const id = selectedCollectionId || selectedStackId || '';
        if (isFromExtension) {
          trackEvent.extensionSave(user.id, cardData.card.id, id, cardType || 'link');
        } else {
          trackEvent.addCard(user.id, cardData.card.id, id, cardType || 'link');
        }
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('type');
    setCardType(null);
    setUrl('');
    setTitle('');
    setDescription('');
    titleRef.current = '';
    descriptionRef.current = '';
    metadataFetchUrlRef.current = '';
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    setDocsFile(null);
    setSelectedStackId('');
    setError('');
    setIsLoading(false);
    setIsDraggingImage(false);
    setIsDraggingDocs(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 'stack') {
      setStep('details');
    } else if (step === 'details') {
      setStep('type');
      setCardType(null);
    }
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="relative overflow-hidden">
        {/* Step 1: Card Type Selection */}
        {step === 'type' && (
          <div className="transition-transform duration-300 ease-in-out">
            <CardTypeSelector onSelect={handleCardTypeSelect} />
          </div>
        )}

        {/* Step 2: Card Details */}
        {step === 'details' && cardType && (
          <div key={`card-details-wrapper-${cardType}`} className="transition-transform duration-300 ease-in-out">
            <CardDetailsStep
              key={`card-details-${cardType}`}
              cardType={cardType}
              url={url}
              onUrlChange={handleUrlChange}
              title={title}
              onTitleChange={(value) => {
                setTitle(value);
                titleRef.current = value;
              }}
              description={description}
              onDescriptionChange={(value) => {
                setDescription(value);
                descriptionRef.current = value;
              }}
              imageFile={imageFile}
              imagePreview={imagePreview}
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              isDraggingImage={isDraggingImage}
              onImageDragOver={(e) => handleDragOver(e, 'image')}
              onImageDragLeave={(e) => handleDragLeave(e, 'image')}
              onImageDrop={(e) => handleDrop(e, 'image')}
              onImageChange={handleImageChange}
              docsFile={docsFile}
              isDraggingDocs={isDraggingDocs}
              onDocsDragOver={(e) => handleDragOver(e, 'docs')}
              onDocsDragLeave={(e) => handleDragLeave(e, 'docs')}
              onDocsDrop={(e) => handleDrop(e, 'docs')}
              onDocsChange={handleDocsChange}
              isFetchingMetadata={isFetchingMetadata}
              error={error}
              isLoading={isLoading}
              onBack={handleBack}
              onNext={handleDetailsNext}
            />
          </div>
        )}

        {/* Step 3: Stack Selection */}
        {step === 'stack' && (
          <div className="transition-transform duration-300 ease-in-out">
            <StackSelector
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              selectedStackId={selectedStackId}
              onSelect={(id) => {
                setSelectedCollectionId(id);
                setSelectedStackId(id); // Legacy support
              }}
              onCreateNew={() => setIsCreateCollectionModalOpen(true)}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        fromCardCreation={true}
        onCollectionCreated={(collectionId) => {
          setSelectedCollectionId(collectionId);
          setSelectedStackId(collectionId); // Legacy support
          setIsCreateCollectionModalOpen(false);
          setTimeout(() => {
            handleSubmit();
          }, 100);
        }}
      />
    </Modal>
  );
}
