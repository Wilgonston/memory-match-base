/**
 * PauseButton Component
 * 
 * Renders a pause button with icon for pausing the game.
 * 
 * Requirements: 11.2
 */

import React from 'react';
import './PauseButton.css';

export interface PauseButtonProps {
  /** Callback when pause button is clicked */
  onPause: () => void;
}

/**
 * PauseButton component for pausing the game
 */
export const PauseButton: React.FC<PauseButtonProps> = ({ onPause }) => {
  return (
    <button
      className="pause-button"
      onClick={onPause}
      aria-label="Pause game"
      type="button"
    >
      <svg
        className="pause-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
      <span className="button-text">Pause</span>
    </button>
  );
};
