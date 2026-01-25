/**
 * ResultScreen Component
 * 
 * Displays level completion statistics and star rating.
 * Provides navigation options: Next Level, Retry, Level Select.
 * Shows celebration animation on level completion.
 * Implements focus trapping and keyboard navigation.
 * 
 * Requirements: 5.2, 6.2, 6.3, 9.4, 11.6
 */

import React, { useEffect, useRef } from 'react';
import { formatTime } from '../utils/timeFormat';
import { trapFocus, storeFocus, announceToScreenReader } from '../utils/accessibility';
import { SaveProgressButton } from './SaveProgressButton';
import './ResultScreen.css';

export interface ResultScreenProps {
  /** Completed level number */
  level: number;
  /** Number of moves made */
  moves: number;
  /** Time elapsed in seconds */
  timeElapsed: number;
  /** Star rating (1-3) */
  stars: number;
  /** Callback when Next Level button is clicked */
  onNextLevel: () => void;
  /** Callback when Retry button is clicked */
  onRetry: () => void;
  /** Callback when Level Select button is clicked */
  onLevelSelect: () => void;
}

/**
 * ResultScreen component for displaying level completion results
 */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  level,
  moves,
  timeElapsed,
  stars,
  onNextLevel,
  onRetry,
  onLevelSelect,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  // Check if this is the final level
  const isFinalLevel = level === 100;

  // Trap focus within the result screen and announce to screen readers
  useEffect(() => {
    if (!contentRef.current) return;

    // Store current focus to restore later
    restoreFocusRef.current = storeFocus();

    // Announce result to screen readers
    const message = isFinalLevel
      ? `Congratulations! You've completed all 100 levels! You earned ${stars} out of 3 stars with ${moves} moves in ${formatTime(timeElapsed)}.`
      : `Level ${level} complete! You earned ${stars} out of 3 stars with ${moves} moves in ${formatTime(timeElapsed)}.`;
    
    announceToScreenReader(message, 'polite');

    // Trap focus within the result screen
    const cleanup = trapFocus(contentRef.current);

    return () => {
      cleanup();
      // Restore focus when result screen closes
      if (restoreFocusRef.current) {
        restoreFocusRef.current();
        restoreFocusRef.current = null;
      }
    };
  }, [level, stars, moves, timeElapsed, isFinalLevel]);

  return (
    <div 
      className="result-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      aria-describedby="result-stats"
    >
      <div className="result-content" ref={contentRef}>
        {/* Celebration Animation */}
        <div className="celebration-animation" aria-hidden="true">
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
        </div>

        {/* Title */}
        <h2 id="result-title" className="result-title">
          {isFinalLevel ? '🎉 Congratulations! 🎉' : 'Level Complete!'}
        </h2>

        {/* Level Number */}
        <div className="level-badge">
          <span className="level-label">Level</span>
          <span className="level-number" aria-label={`Level ${level}`}>{level}</span>
        </div>

        {/* Star Rating */}
        <div className="star-rating" role="img" aria-label={`${stars} out of 3 stars earned`}>
          {[1, 2, 3].map((starIndex) => (
            <svg
              key={starIndex}
              className={`star ${starIndex <= stars ? 'filled' : 'empty'}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill={starIndex <= stars ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}
                stroke={starIndex <= stars ? '#FFA500' : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth="1"
              />
            </svg>
          ))}
        </div>

        {/* Statistics */}
        <div id="result-stats" className="statistics">
          <div className="stat-item">
            <span className="stat-label">Moves</span>
            <span className="stat-value" aria-label={`${moves} moves`}>{moves}</span>
          </div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value" aria-label={`Time: ${formatTime(timeElapsed)}`}>
              {formatTime(timeElapsed)}
            </span>
          </div>
        </div>

        {/* Save to Blockchain Button */}
        <SaveProgressButton
          level={level}
          stars={stars}
          onSuccess={() => announceToScreenReader('Progress saved to blockchain!', 'polite')}
          onError={(error) => announceToScreenReader(`Failed to save: ${error}`, 'assertive')}
        />

        {/* Action Buttons */}
        <div className="action-buttons" role="group" aria-label="Level completion actions">
          {!isFinalLevel && (
            <button
              className="action-button primary-button"
              onClick={onNextLevel}
              aria-label="Continue to next level"
              type="button"
              autoFocus
            >
              <svg
                className="button-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="button-text">Next Level</span>
            </button>
          )}

          <button
            className="action-button secondary-button"
            onClick={onRetry}
            aria-label="Retry current level"
            type="button"
            autoFocus={isFinalLevel}
          >
            <svg
              className="button-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 4v6h6M23 20v-6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="button-text">Retry</span>
          </button>

          <button
            className="action-button secondary-button"
            onClick={onLevelSelect}
            aria-label="Return to level selection"
            type="button"
          >
            <svg
              className="button-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 22V12h6v10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="button-text">Level Select</span>
          </button>
        </div>

        {/* Final Level Message */}
        {isFinalLevel && (
          <p className="final-message">
            You've completed all 100 levels! You're a Memory Match master! 🏆
          </p>
        )}
      </div>
    </div>
  );
};
