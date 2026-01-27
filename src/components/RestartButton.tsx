/**
 * RestartButton Component
 * 
 * Renders a restart button with icon for restarting the current level.
 * 
 * Requirements: 11.3, 15.7
 */

import React from 'react';
import { hapticButtonPress } from '../utils/haptics';
import './RestartButton.css';

export interface RestartButtonProps {
  /** Callback when restart button is clicked */
  onRestart: () => void;
}

/**
 * RestartButton component for restarting the current level
 */
export const RestartButton: React.FC<RestartButtonProps> = ({ onRestart }) => {
  const handleClick = () => {
    hapticButtonPress();
    onRestart();
  };

  return (
    <button
      className="restart-button"
      onClick={handleClick}
      aria-label="Restart level"
      type="button"
    >
      <svg
        className="restart-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 12C4 7.58172 7.58172 4 12 4C14.5264 4 16.7792 5.17108 18.2454 7M20 12C20 16.4183 16.4183 20 12 20C9.47362 20 7.22082 18.8289 5.75463 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18 3V7H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 21V17H10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="button-text">Restart</span>
    </button>
  );
};
