"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CreateCollectionForm } from "./forms/CreateCollectionForm";
import { CreateCardForm } from "./forms/CreateCardForm";

interface GlobalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Context allows us to skip the "What do you want to create?" step
  initialContext?: {
    type?: "card" | "collection";
    collectionId?: string; // If creating a card inside a collection
    url?: string; // For bookmarklet/save page
    fileData?: any; // If dropping a file
  };
  onCardCreated?: () => void;
}

import { BecomeStackerModal } from "@/components/auth/BecomeStackerModal";
import { createClient } from "@/lib/supabase/client";

export function GlobalCreateModal({
  isOpen,
  onClose,
  initialContext,
  onCardCreated,
}: GlobalCreateModalProps) {
  const [step, setStep] = useState<"choice" | "collection" | "card">("choice");
  const [showBecomeStacqer, setShowBecomeStacqer] = useState(false);
  const [isStacqer, setIsStacqer] = useState(false);
  const [needsProfileCheck, setNeedsProfileCheck] = useState(true);

  // Check Stacqer Status
  useEffect(() => {
    if (isOpen && needsProfileCheck) {
       const checkRole = async () => {
         const supabase = createClient();
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
           const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
           if (data && (data.role === 'stacker' || data.role === 'admin')) {
             setIsStacqer(true);
           } else {
             setIsStacqer(false);
           }
         }
         setNeedsProfileCheck(false);
       };
       checkRole();
    }
  }, [isOpen, needsProfileCheck]);

  // Effect: Decide initial step based on context
  useEffect(() => {
    if (isOpen) {
      if (initialContext?.type === "collection") {
        setStep("collection");
      } else if (initialContext?.type === "card") {
        setStep("card");
      } else {
        setStep("choice");
      }
    } else {
      // Reset after animation
      const t = setTimeout(() => {
        setStep("choice");
        setShowBecomeStacqer(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, initialContext]);

  // State for flow management
  const [pendingCardContext, setPendingCardContext] = useState<{ url?: string; fileData?: any; title?: string } | null>(null);

  // Choice Step Component
  const ChoiceStep = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
      <button
        onClick={() => setStep("collection")}
        className="group relative p-6 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/10 text-left transition-all duration-200 active:scale-98"
      >
        <div className="w-12 h-12 mb-4 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700">
          Collection
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Group resources into a themed stack. Perfect for curating topics.
        </p>
      </button>

      <button
        onClick={() => setStep("card")}
        className="group relative p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/10 text-left transition-all duration-200 active:scale-98"
      >
        <div className="w-12 h-12 mb-4 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700">
          Resource Card
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Save a single link, article, or tool to your library.
        </p>
      </button>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case "choice": return "Create New";
      case "collection": return "New Collection";
      case "card": return "New Card";
    }
  };

  const handleCollectionCreated = (newCollectionId: string) => {
    if (pendingCardContext) {
      // If we were creating a card, go back to it with the new collection selected
      // We need to update the initialContext essentially
      const updatedContext = { ...initialContext, collectionId: newCollectionId };
      // But props are read-only, we rely on the form re-initializing or state
      // Since GlobalCreateModal controls steps, we can just switch back
      setStep("card");
      // BUT, we need to tell CreateCardForm about the new ID.
    } else {
      onClose();
    }
  };

  // We need a way to pass dynamic context to CreateCardForm
  // Let's use a local state that overrides initialContext if present
  const [activeCollectionId, setActiveCollectionId] = useState<string | undefined>(initialContext?.collectionId);

  useEffect(() => {
     setActiveCollectionId(initialContext?.collectionId);
  }, [initialContext?.collectionId]);

  return (
    <>
      <Modal
        isOpen={isOpen && !showBecomeStacqer}
        onClose={onClose}
        title={getTitle()}
        size={step === "choice" ? "md" : "lg"}
      >
        <div className="min-h-[300px]">
          {step === "choice" && <ChoiceStep />}
          
          {step === "collection" && (
            <CreateCollectionForm 
              onSuccess={(id) => {
                if (pendingCardContext) {
                   setActiveCollectionId(id);
                   setStep("card");
                   setPendingCardContext(null);
                } else {
                   onClose();
                }
              }}
              onCancel={() => {
                if (pendingCardContext) {
                  setStep("card");
                  setPendingCardContext(null);
                } else {
                  setStep("choice");
                }
              }}
              isStacqer={isStacqer}
              onBecomeStacqer={() => setShowBecomeStacqer(true)}
            />
          )}

          {step === "card" && (
            <CreateCardForm 
              initialCollectionId={activeCollectionId}
              initialUrl={initialContext?.url}
              onSuccess={(id) => {
                onCardCreated?.();
                onClose();
              }}
              onCancel={() => setStep("choice")}
              onCreateCollection={() => {
                setPendingCardContext({ url: initialContext?.url }); // Preserve context if needed
                setStep("collection");
              }}
              isStacqer={isStacqer}
              onBecomeStacqer={() => setShowBecomeStacqer(true)}
            />
          )}
        </div>
      </Modal>

      <BecomeStackerModal 
        isOpen={showBecomeStacqer} 
        onClose={() => setShowBecomeStacqer(false)}
        onSuccess={() => {
          setIsStacqer(true);
          setShowBecomeStacqer(false);
          // Don't close parent modal, just let them adhere to the flow
        }}
      />
    </>
  );
}
