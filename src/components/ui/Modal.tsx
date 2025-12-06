'use client';

import React, { useEffect, useState, useRef } from 'react';
import { focusManagement } from '@/lib/accessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      // Small delay to ensure DOM is ready, then trigger animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
        // Restore focus to previous element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      }, 200); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen && modalRef.current) {
      document.addEventListener('keydown', handleEscape);
      // Trap focus within modal - delay to avoid interfering with typing
      let cleanup: (() => void) | undefined;
      const timer = setTimeout(() => {
        cleanup = focusManagement.trapFocus(modalRef.current);
      }, 100);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        clearTimeout(timer);
        if (cleanup) cleanup();
      };
    }
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
        style={{ display: shouldRender ? 'block' : 'none' }}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        style={{ display: shouldRender ? 'flex' : 'none' }}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-modal w-full ${sizeStyles[size]}
            max-h-[90vh] overflow-y-auto pointer-events-auto
            transition-all duration-200
            ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-light">
            <h2 id="modal-title" className="text-h2 font-semibold text-jet-dark">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="ml-auto text-gray-muted hover:text-jet-dark transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {!title && (
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-muted hover:text-jet-dark transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
};

