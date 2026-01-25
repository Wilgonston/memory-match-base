/**
 * GameBoard Component
 * 
 * Main game screen that orchestrates all game components and logic.
 * Manages card flipping, match checking, timer countdown, and game flow.
 * 
 * Requirements: 1.1, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.6, 11.1, 11.2, 11.3
 */

import React, { useEffect, useCallback } from 'react';
import { GameState } from '../types/game';
import { Header } from './Header';
import { Grid } from './Grid';
import { PauseButton } from './PauseButton';
import { RestartButton } from './RestartButton';
import { PauseOverlay } from './PauseOverlay';
import { ResultScreen } from './ResultScreen';
import { calculateStars } from '../utils/scoring';
import { getLevelConfig } from '../utils/levelConfig';
import './GameBoard.css';

export interface GameBoardProps {
  /** Current game state */
  gameState: GameState;
  /** Callback to dispatch game actions */
  onAction: (action: any) => void;
  /** Callback when returning to level select */
  onLevelSelect: () => void;
  /** Optional callback for logout */
  onLogout?: () => void;
}

/**
 * GameBoard component - main game interface
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onAction,
  onLevelSelect,
  onLogout,
}) => {
  const { 
    level, 
    cards, 
    flippedCards, 
    moves, 
    timeRemaining, 
    isPlaying, 
    isPaused, 
    gameStatus 
  } = gameState;

  // Timer countdown effect (Requirement 4.1)
  useEffect(() => {
    if (!isPlaying || isPaused || gameStatus !== 'playing') {
      return;
    }

    const timerId = setInterval(() => {
      onAction({ type: 'TICK_TIMER' });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPlaying, isPaused, gameStatus, onAction]);

  // Match checking effect (Requirements 3.1, 3.2, 3.3)
  useEffect(() => {
    // Only check for matches when exactly 2 cards are flipped
    if (flippedCards.length !== 2) {
      return;
    }

    const [cardId1, cardId2] = flippedCards;
    const card1 = cards.find(c => c.id === cardId1);
    const card2 = cards.find(c => c.id === cardId2);

    if (!card1 || !card2) {
      return;
    }

    // Check if cards match (same imageId)
    const isMatch = card1.imageId === card2.imageId;

    if (isMatch) {
      // Cards match - mark them as matched immediately (Requirement 3.2)
      onAction({ type: 'MATCH_FOUND', cardIds: [cardId1, cardId2] });
    } else {
      // Cards don't match - flip them back after 1 second (Requirement 3.3)
      const timeoutId = setTimeout(() => {
        onAction({ type: 'NO_MATCH', cardIds: [cardId1, cardId2] });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [flippedCards, cards, onAction]);

  // Handle card click (Requirement 2.1)
  const handleCardClick = useCallback((cardId: string) => {
    onAction({ type: 'FLIP_CARD', cardId });
  }, [onAction]);

  // Handle pause button click (Requirement 11.2)
  const handlePause = useCallback(() => {
    onAction({ type: 'PAUSE_GAME' });
  }, [onAction]);

  // Handle resume button click
  const handleResume = useCallback(() => {
    onAction({ type: 'RESUME_GAME' });
  }, [onAction]);

  // Handle restart button click (Requirement 11.3)
  const handleRestart = useCallback(() => {
    onAction({ type: 'RESTART_LEVEL' });
  }, [onAction]);

  // Handle next level button click
  const handleNextLevel = useCallback(() => {
    onAction({ type: 'START_LEVEL', level: level + 1 });
  }, [onAction, level]);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    onAction({ type: 'RESTART_LEVEL' });
  }, [onAction]);

  // Calculate stars for result screen
  const config = getLevelConfig(level);
  const stars = calculateStars(moves, config);
  const timeElapsed = config.timeLimit - timeRemaining;

  // Determine if cards should be disabled (prevent clicks during match check)
  const cardsDisabled = flippedCards.length >= 2 || isPaused || !isPlaying;

  return (
    <div className="game-board" role="main" id="main-content">
      {/* Header with game info (Requirement 11.1) */}
      <Header 
        level={level} 
        moves={moves} 
        timeRemaining={timeRemaining}
        onLogout={onLogout}
      />

      {/* Main game area */}
      <div className="game-content">
        {/* Card grid */}
        <Grid 
          cards={cards} 
          onCardClick={handleCardClick}
          disabled={cardsDisabled}
        />

        {/* Control buttons */}
        <div className="game-controls">
          <button 
            className="back-to-menu-btn"
            onClick={onLevelSelect}
            aria-label="Back to level select"
            type="button"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="back-icon"
            >
              <path 
                d="M19 12H5M5 12L12 19M5 12L12 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Menu
          </button>
          <PauseButton onPause={handlePause} />
          <RestartButton onRestart={handleRestart} />
        </div>
      </div>

      {/* Pause overlay (Requirement 11.5) */}
      <PauseOverlay 
        isPaused={isPaused} 
        onResume={handleResume} 
      />

      {/* Result screen (Requirement 11.6) */}
      {gameStatus === 'won' && (
        <ResultScreen
          level={level}
          moves={moves}
          timeElapsed={timeElapsed}
          stars={stars}
          onNextLevel={handleNextLevel}
          onRetry={handleRetry}
          onLevelSelect={onLevelSelect}
        />
      )}

      {/* Failure screen (time ran out) */}
      {gameStatus === 'lost' && (
        <div className="failure-screen">
          <div className="failure-content">
            <h2 className="failure-title">Time's Up!</h2>
            <p className="failure-message">Don't give up! Try again.</p>
            <div className="failure-buttons">
              <button
                className="action-button primary-button"
                onClick={handleRetry}
                aria-label="Retry level"
                type="button"
                autoFocus
              >
                <span className="button-text">Retry</span>
              </button>
              <button
                className="action-button secondary-button"
                onClick={onLevelSelect}
                aria-label="Return to level selection"
                type="button"
              >
                <span className="button-text">Level Select</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
