/**
 * Accessibility Utilities
 * 
 * Provides helper functions for managing focus, keyboard navigation,
 * and screen reader announcements.
 */

/**
 * Trap focus within a container element (for modals/dialogs)
 * @param container - The container element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce a message to screen readers using ARIA live region
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create live region
  let liveRegion = document.getElementById('aria-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Update the live region
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 1000);
}

/**
 * Store the currently focused element to restore later
 * @returns Function to restore focus to the stored element
 */
export function storeFocus(): () => void {
  const activeElement = document.activeElement as HTMLElement;
  
  return () => {
    if (activeElement && typeof activeElement.focus === 'function') {
      activeElement.focus();
    }
  };
}

/**
 * Check if an element is visible and focusable
 * @param element - The element to check
 * @returns True if element is visible and focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const isVisible = style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
  
  const tabIndex = element.getAttribute('tabindex');
  const isTabIndexValid = tabIndex === null || parseInt(tabIndex) >= 0;
  
  return isVisible && isTabIndexValid && !element.hasAttribute('disabled');
}

/**
 * Get all focusable elements within a container
 * @param container - The container to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 
    'button:not([disabled]), ' +
    '[href]:not([disabled]), ' +
    'input:not([disabled]), ' +
    'select:not([disabled]), ' +
    'textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]):not([disabled])';
  
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
  return elements.filter(isFocusable);
}
