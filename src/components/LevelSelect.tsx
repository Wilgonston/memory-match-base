/**
 * LevelSelect Component
 * 
 * Displays a grid of level buttons (1-100) with locked/unlocked states.
 * Shows star ratings for completed levels.
 * Provides level selection functionality.
 */

import React, { useEffect, useState } from 'react';
import { useDisconnect } from 'wagmi';
import { ProgressData } from '../types';
import { type OnChainProgress } from '../types/blockchain';
import { hapticButtonPress } from '../utils/haptics';
import { SaveAllProgressButton } from './SaveAllProgressButton';
import { ResetProgressButton } from './ResetProgressButton';
import './LevelSelect.css';

export interface LevelSelectProps {
  /** Player's progress data */
  progressData: ProgressData;
  /** Blockchain progress data (optional) */
  blockchainProgress?: OnChainProgress | null;
  /** Callback to refetch blockchain progress */
  onRefetchBlockchain?: () => Promise<void>;
  /** Callback to reset local progress */
  onResetProgress?: () => void;
  /** Callback when a level is selected */
  onLevelSelect: (level: number) => void;
  /** Callback when back to menu is clicked (logout) */
  onBackToMenu?: () => void;
}

/**
 * LevelSelect component for choosing a level to play
 */
export const LevelSelect: React.FC<LevelSelectProps> = ({
  progressData,
  blockchainProgress,
  onRefetchBlockchain,
  onResetProgress,
  onLevelSelect,
  onBackToMenu,
}) => {
  const { completedLevels, levelStars, highestUnlockedLevel } = progressData;
  const { disconnect } = useDisconnect();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Check if a level is unlocked
   */
  const isLevelUnlocked = (level: number): boolean => {
    return level <= highestUnlockedLevel;
  };

  /**
   * Get star rating for a level (0 if not completed)
   */
  const getLevelStars = (level: number): number => {
    return levelStars.get(level) || 0;
  };

  /**
   * Check if a level is completed
   */
  const isLevelCompleted = (level: number): boolean => {
    return completedLevels.has(level);
  };

  /**
   * Handle level button click
   */
  const handleLevelClick = (level: number) => {
    if (isLevelUnlocked(level)) {
      hapticButtonPress();
      onLevelSelect(level);
    }
  };

  /**
   * Render star icons for a level
   */
  const renderStars = (stars: number) => {
    if (stars === 0) return null;

    return (
      <div className="level-stars" role="img" aria-label={`${stars} out of 3 stars`}>
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
              fill={starIndex <= stars ? '#FFD700' : 'transparent'}
              stroke={starIndex <= stars ? '#FFA500' : 'rgba(255, 255, 255, 0.3)'}
              strokeWidth="1"
            />
          </svg>
        ))}
      </div>
    );
  };

  /**
   * Render a single level button
   */
  const renderLevelButton = (level: number) => {
    const unlocked = isLevelUnlocked(level);
    const completed = isLevelCompleted(level);
    const stars = getLevelStars(level);

    return (
      <button
        key={level}
        className={`level-button ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`}
        onClick={() => handleLevelClick(level)}
        disabled={!unlocked}
        aria-label={
          unlocked
            ? completed
              ? `Level ${level}, completed with ${stars} stars`
              : `Level ${level}, unlocked`
            : `Level ${level}, locked`
        }
        type="button"
      >
        {unlocked ? (
          <>
            <span className="level-number">{level}</span>
            {completed && renderStars(stars)}
          </>
        ) : (
          <svg
            className="lock-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    );
  };

  // Generate array of level numbers (1-100)
  const levels = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="level-select" role="main" id="main-content">
      <div className="level-select-header">
        {onBackToMenu && (
          <button 
            className="back-to-menu-button"
            onClick={() => {
              hapticButtonPress();
              onBackToMenu();
            }}
            aria-label="Logout and return to login screen"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="back-icon"
            >
              <path 
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </button>
        )}
        
        <h1 className="level-select-title">Select Level</h1>
        
        {/* Error message display */}
        {errorMessage && (
          <div className="level-select-error">
            ⚠️ {errorMessage}
          </div>
        )}
        
        <div className="progress-summary">
          <span className="progress-text">
            Progress: {completedLevels.size}/100 levels completed
          </span>
          <span className="progress-text">
            Total Stars: {Array.from(levelStars.values()).reduce((sum, stars) => sum + stars, 0)}/300
          </span>
        </div>

        {/* Save all progress to blockchain button */}
        <SaveAllProgressButton 
          progressData={progressData}
          blockchainProgress={blockchainProgress}
          onRefetchBlockchain={onRefetchBlockchain}
          onSuccess={() => {
            console.log('[LevelSelect] All progress saved to blockchain successfully!');
            setErrorMessage(null);
          }}
          onError={(error) => {
            console.error('[LevelSelect] Failed to save progress:', error);
            // Error is already shown in SaveAllProgressButton component
            // No need to show alert here
          }}
        />

        {/* Reset all progress button */}
        <ResetProgressButton
          onResetLocal={() => {
            console.log('[LevelSelect] Resetting local progress...');
            onResetProgress?.();
          }}
          onRefetchBlockchain={onRefetchBlockchain}
          onSuccess={() => {
            console.log('[LevelSelect] Progress reset successfully!');
            setErrorMessage(null);
          }}
          onError={(error) => {
            console.error('[LevelSelect] Failed to reset progress:', error);
          }}
        />
      </div>

      <div className="level-grid" role="grid" aria-label="Level selection grid">
        {levels.map((level) => renderLevelButton(level))}
      </div>
    </div>
  );
};
