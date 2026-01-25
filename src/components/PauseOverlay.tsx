/**
 * PauseOverlay Component
 * 
 * Displays an overlay when the game is paused.
 * Prevents interaction with the game board and provides a resume button.
 * Implements focus trapping and keyboard navigation (Escape to resume).
 * 
 * Requirements: 11.5
 */

import React, { useEffect, useRef } from 'react';
import { trapFocus, storeFocus, announceToScreenReader } from '../utils/accessibility';
import './PauseOverlay.css';

export interface PauseOverlayProps {
  /** Whether the game is currently paused */
  isPaused: boolean;
  /** Callback when resume button is clicked */
  onResume: () => void;
}

/**
 * PauseOverlay component for pausing the game
 */
export const PauseOverlay: React.FC<PauseOverlayProps> = ({ isPaused, onResume }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  // Handle Escape key to resume
  useEffect(() => {
    if (!isPaused) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onResume();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPaused, onResume]);

  // Trap focus within the overlay and announce to screen readers
  useEffect(() => {
    if (!isPaused || !contentRef.current) return;

    // Store current focus to restore later
    restoreFocusRef.current = storeFocus();

    // Announce pause to screen readers
    announceToScreenReader('Game paused. Press Escape or click Resume to continue.', 'polite');

    // Trap focus within the overlay
    const cleanup = trapFocus(contentRef.current);

    return () => {
      cleanup();
      // Restore focus when overlay closes
      if (restoreFocusRef.current) {
        restoreFocusRef.current();
        restoreFocusRef.current = null;
      }
    };
  }, [isPaused]);

  if (!isPaused) {
    return null;
  }

  return (
    <div 
      className="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      aria-describedby="pause-description"
    >
      <div className="pause-content" ref={contentRef}>
        <h2 id="pause-title" className="pause-title">Game Paused</h2>
        <p id="pause-description" className="pause-message">
          Take a break! Press Escape or click Resume when you're ready to continue.
        </p>
        
        <button
          className="resume-button"
          onClick={onResume}
          aria-label="Resume game (or press Escape)"
          type="button"
          autoFocus
        >
          <svg
            className="resume-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 5.14v13.72L19 12L8 5.14z"
              fill="currentColor"
            />
          </svg>
          <span className="button-text">Resume</span>
        </button>
      </div>
    </div>
  );
};
