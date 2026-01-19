"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  rightElement?: React.ReactNode;
}

export function Accordion({ 
  title, 
  defaultOpen = true, 
  children, 
  className = "",
  rightElement
}: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <ChevronDown 
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} 
          />
          {title}
        </div>
        <div>
           {rightElement}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
