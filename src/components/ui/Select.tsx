"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  isAction?: boolean; // For "Create New" style
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg 
          border bg-white text-sm transition-all duration-200
          ${disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" 
            : isOpen
              ? "border-emerald-500 ring-1 ring-emerald-500 z-10"
              : "border-gray-200 hover:border-gray-300"
          }
        `}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400" : "text-gray-900"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Options List */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100 origin-top">
          {options.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
              No options available
            </div>
          ) : (
            options.map((option, index) => {
              // Divider separator logic if needed, but for now we rely on explicit Action styling
              // or we can hack a divider if value is generic divider value
              
              if (option.disabled && option.label?.startsWith("──")) {
                 return <div key={index} className="h-px bg-gray-100 my-1 mx-2" />;
              }

              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    relative cursor-pointer select-none py-2.5 pl-3 pr-9 
                    ${option.disabled ? "text-gray-400 cursor-not-allowed opacity-50" : "text-gray-900"}
                    ${!option.disabled && "hover:bg-gray-50"}
                    ${option.isAction ? "text-emerald-600 font-medium hover:bg-emerald-50" : ""}
                    ${value === option.value && !option.isAction ? "bg-emerald-50/50 text-emerald-900" : ""}
                  `}
                >
                  <div className="flex items-center">
                    {option.icon && <span className="mr-2 flex-shrink-0">{option.icon}</span>}
                    <span className={`block truncate ${value === option.value ? "font-medium" : "font-normal"}`}>
                      {option.label}
                    </span>
                  </div>

                  {value === option.value && !option.isAction && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
