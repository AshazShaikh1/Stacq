'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  children?: React.ReactNode;
  className?: string;
}

export function Dropdown({ items, children, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="p-2 rounded-md hover:bg-gray-light transition-colors focus:outline-none focus:ring-2 focus:ring-jet focus:ring-offset-2"
        aria-label="More options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {children || (
          <svg
            className="w-5 h-5 text-jet-dark"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-light z-20 py-1"
            role="menu"
            aria-orientation="vertical"
          >
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  handleItemClick(item, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item, e as any);
                  } else if (e.key === 'ArrowDown' && index < items.length - 1) {
                    e.preventDefault();
                    const nextButton = e.currentTarget.parentElement?.children[index + 1] as HTMLElement;
                    nextButton?.focus();
                  } else if (e.key === 'ArrowUp' && index > 0) {
                    e.preventDefault();
                    const prevButton = e.currentTarget.parentElement?.children[index - 1] as HTMLElement;
                    prevButton?.focus();
                  }
                }}
                className={`w-full text-left px-4 py-2 text-body flex items-center gap-2 hover:bg-gray-light transition-colors focus:outline-none focus:bg-gray-light ${
                  item.variant === 'danger' ? 'text-red-600 hover:text-red-700' : 'text-jet-dark'
                }`}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

