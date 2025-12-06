/**
 * Accessibility utilities and helpers
 */

/**
 * Generate ARIA label for actions
 */
export function getAriaLabel(action: string, item?: string): string {
  if (item) {
    return `${action} ${item}`;
  }
  return action;
}

/**
 * Keyboard event handlers for common interactions
 */
export const keyboardHandlers = {
  /**
   * Handle Enter/Space key for button-like elements
   */
  handleButtonKeyDown: (e: React.KeyboardEvent, onClick: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  },

  /**
   * Handle Escape key to close modals/dropdowns
   */
  handleEscape: (e: React.KeyboardEvent, onClose: () => void) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  },

  /**
   * Handle Arrow keys for navigation
   */
  handleArrowKeys: (
    e: React.KeyboardEvent,
    onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavigate('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavigate('right');
    }
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within a container (for modals)
   */
  trapFocus: (container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Only focus first element if nothing is currently focused within the container
    // This prevents stealing focus from inputs the user is typing in
    if (!container.contains(document.activeElement)) {
      firstElement?.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  },
};

/**
 * Screen reader announcements
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

