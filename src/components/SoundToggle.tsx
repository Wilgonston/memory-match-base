/**
 * SoundToggle Component
 * 
 * Button to toggle sound effects on/off.
 * Displays current mute state and persists preference.
 * 
 * Requirements: 16.5, 16.6
 */

import { useState, useEffect } from 'react';
import { toggleSound, isSoundMuted } from '../utils/soundManager';
import './SoundToggle.css';

export function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const handleToggle = () => {
    const newMutedState = toggleSound();
    setMuted(newMutedState);
  };

  return (
    <button
      onClick={handleToggle}
      className="sound-toggle"
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
