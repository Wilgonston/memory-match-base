/**
 * App Component
 * 
 * Root component that manages the overall application state and navigation.
 * Handles transitions between level selection, gameplay, and result screens.
 * Integrates progress persistence and game state management.
 * 
 * Requirements: All
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LevelSelect } from './components/LevelSelect';
import { GameBoard } from './components/GameBoard';
import { useProgress } from './hooks/useProgress';
import { useGameState } from './hooks/useGameState';
import { calculateStars } from './utils/scoring';
import { getLevelConfig } from './utils/levelConfig';
import './index.css';

/**
 * Screen types for app navigation
 */
type Screen = 'level-select' | 'game';

/**
 * Main App component
 */
function App() {
  // Progress management hook
  const { progress, completeLevel } = useProgress();

  // Game state management hook
  const { state: gameState, dispatch } = useGameState();

  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('level-select');

  /**
   * Handle level selection from LevelSelect screen
   * Starts the selected level and transitions to game screen
   */
  const handleLevelSelect = useCallback((level: number) => {
    // Start the selected level
    dispatch({ type: 'START_LEVEL', level });
    // Transition to game screen
    setCurrentScreen('game');
  }, [dispatch]);

  /**
   * Handle returning to level select screen
   */
  const handleBackToLevelSelect = useCallback(() => {
    setCurrentScreen('level-select');
  }, []);

  /**
   * Handle game actions from GameBoard
   * This is passed to GameBoard to dispatch actions
   */
  const handleGameAction = useCallback((action: any) => {
    dispatch(action);
  }, [dispatch]);

  /**
   * Effect to handle level completion
   * When a level is won, save progress and update completion status
   */
  useEffect(() => {
    if (gameState.gameStatus === 'won' && gameState.isPlaying === false) {
      // Calculate stars based on moves
      const config = getLevelConfig(gameState.level);
      const stars = calculateStars(gameState.moves, config);
      
      // Save level completion to progress
      completeLevel(gameState.level, stars);
    }
  }, [gameState.gameStatus, gameState.isPlaying, gameState.level, gameState.moves, completeLevel]);

  return (
    <div className="app">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {currentScreen === 'level-select' && (
        <LevelSelect
          progressData={progress}
          onLevelSelect={handleLevelSelect}
        />
      )}

      {currentScreen === 'game' && (
        <GameBoard
          gameState={gameState}
          onAction={handleGameAction}
          onLevelSelect={handleBackToLevelSelect}
        />
      )}
    </div>
  );
}

export default App;
