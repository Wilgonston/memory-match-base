/**
 * App Component
 * 
 * Root component that manages the overall application state and navigation.
 * Handles transitions between level selection, gameplay, and result screens.
 * Integrates progress persistence and game state management.
 * 
 * Requirements: All
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Wallet } from '@coinbase/onchainkit/wallet';
import { LoginScreen } from './components/LoginScreen';
import { LevelSelect } from './components/LevelSelect';
import { GameBoard } from './components/GameBoard';
import { Web3ErrorBoundary } from './components/Web3ErrorBoundary';
import { LoadingIndicator } from './components/LoadingIndicator';
import { useProgress } from './hooks/useProgress';
import { useGameState } from './hooks/useGameState';
import { useSyncManager } from './hooks/useSyncManager';
import { calculateStars } from './utils/scoring';
import { getLevelConfig } from './utils/levelConfig';
import { initializeSounds } from './utils/soundManager';
import { getAuthentication, clearAuthentication, isAuthenticatedForAddress } from './utils/auth';
import { validateAppConfig, logValidationResults } from './config/validation';
import './index.css';

/**
 * Screen types for app navigation
 */
type Screen = 'login' | 'menu' | 'level-select' | 'game';

/**
 * Main App component
 */
function App() {
  const { address, isConnected } = useAccount();
  
  // Progress management hook
  const { progress, completeLevel, updateProgress } = useProgress();

  // Sync manager for blockchain synchronization
  const { syncToBlockchain, mergeFromBlockchain, syncStatus } = useSyncManager();

  // Game state management hook
  const { state: gameState, dispatch } = useGameState();

  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLoadedBlockchainProgress, setHasLoadedBlockchainProgress] = useState(false);
  const [isLoadingBlockchainProgress, setIsLoadingBlockchainProgress] = useState(false);

  /**
   * Validate configuration on mount
   */
  useEffect(() => {
    const validationResult = validateAppConfig();
    logValidationResults(validationResult);
  }, []);

  /**
   * Initialize sound manager on mount
   */
  useEffect(() => {
    initializeSounds().catch((error) => {
      console.error('Failed to initialize sounds:', error);
    });
  }, []);

  /**
   * Load progress from blockchain when wallet connects
   */
  useEffect(() => {
    const loadBlockchainProgress = async () => {
      if (isConnected && address && isAuthenticated && !hasLoadedBlockchainProgress) {
        try {
          console.log('Loading progress from blockchain...');
          setIsLoadingBlockchainProgress(true);
          const mergedProgress = await mergeFromBlockchain(progress);
          updateProgress(() => mergedProgress);
          setHasLoadedBlockchainProgress(true);
          console.log('Progress loaded from blockchain successfully');
        } catch (error) {
          console.error('Failed to load blockchain progress:', error);
          // Continue with local progress on error
        } finally {
          setIsLoadingBlockchainProgress(false);
        }
      }
    };

    loadBlockchainProgress();
  }, [isConnected, address, isAuthenticated, hasLoadedBlockchainProgress, mergeFromBlockchain, progress, updateProgress]);

  /**
   * Reset blockchain progress loaded flag when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected || !address) {
      setHasLoadedBlockchainProgress(false);
    }
  }, [isConnected, address]);

  /**
   * Check authentication status on mount and wallet change
   */
  useEffect(() => {
    if (isConnected && isAuthenticatedForAddress(address)) {
      setIsAuthenticated(true);
      setCurrentScreen('level-select');
    } else {
      setIsAuthenticated(false);
      setCurrentScreen('login');
      clearAuthentication();
    }
  }, [address, isConnected]);

  /**
   * Handle successful authentication
   */
  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
    setCurrentScreen('level-select');
  }, []);

  /**
   * Handle back to main menu (logout)
   */
  const handleBackToMenu = useCallback(() => {
    clearAuthentication();
    setIsAuthenticated(false);
    setCurrentScreen('login');
  }, []);

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
   * Also automatically sync to blockchain if wallet is connected
   */
  useEffect(() => {
    if (gameState.gameStatus === 'won' && gameState.isPlaying === false) {
      // Calculate stars based on moves
      const config = getLevelConfig(gameState.level);
      const stars = calculateStars(gameState.moves, config);
      
      // Save level completion to progress (local storage)
      completeLevel(gameState.level, stars);

      // Automatically sync to blockchain if wallet is connected
      if (isConnected && address && syncStatus.mode === 'blockchain') {
        console.log(`Auto-syncing level ${gameState.level} to blockchain...`);
        
        // Create updated progress with the new level
        const updatedProgress = {
          ...progress,
          completedLevels: new Set([...progress.completedLevels, gameState.level]),
          levelStars: new Map([...progress.levelStars, [gameState.level, stars]]),
          highestUnlockedLevel: gameState.level === progress.highestUnlockedLevel
            ? Math.min(gameState.level + 1, 100)
            : progress.highestUnlockedLevel,
        };

        // Sync to blockchain (fire and forget, don't block UI)
        syncToBlockchain(updatedProgress).catch((error) => {
          console.error('Auto-sync to blockchain failed:', error);
          // User can manually sync later via SaveProgressButton
        });
      }
    }
  }, [gameState.gameStatus, gameState.isPlaying, gameState.level, gameState.moves, completeLevel, isConnected, address, syncStatus.mode, syncToBlockchain, progress]);

  return (
    <Web3ErrorBoundary>
      <Wallet>
        <div className="app">
          {/* Skip link for keyboard navigation */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

        {/* Loading blockchain progress */}
        {isLoadingBlockchainProgress && (
          <LoadingIndicator
            operation="Loading progress from blockchain"
            estimatedTime={3}
          />
        )}

        {!isLoadingBlockchainProgress && currentScreen === 'login' && (
          <LoginScreen onAuthenticated={handleAuthenticated} />
        )}

        {!isLoadingBlockchainProgress && currentScreen === 'level-select' && isAuthenticated && (
          <LevelSelect
            progressData={progress}
            onLevelSelect={handleLevelSelect}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {!isLoadingBlockchainProgress && currentScreen === 'game' && isAuthenticated && (
          <GameBoard
            gameState={gameState}
            onAction={handleGameAction}
            onLevelSelect={handleBackToLevelSelect}
            onLogout={handleBackToMenu}
          />
        )}
        </div>
      </Wallet>
    </Web3ErrorBoundary>
  );
}

export default App;
