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
import { SyncIndicator } from './components/SyncIndicator';
import { NetworkBlocker } from './components/NetworkBlocker';
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
          console.log('[App] Loading progress from blockchain...');
          console.log('[App] Current local progress:', {
            completedLevels: Array.from(progress.completedLevels),
            highestUnlockedLevel: progress.highestUnlockedLevel,
            levelStarsCount: progress.levelStars.size,
          });
          setIsLoadingBlockchainProgress(true);
          
          // Try to merge with blockchain progress
          const mergedProgress = await mergeFromBlockchain(progress);
          console.log('[App] Merged progress:', {
            completedLevels: Array.from(mergedProgress.completedLevels),
            highestUnlockedLevel: mergedProgress.highestUnlockedLevel,
            levelStarsCount: mergedProgress.levelStars.size,
          });
          
          updateProgress(() => mergedProgress);
          setHasLoadedBlockchainProgress(true);
          
          console.log('[App] Progress loaded from blockchain successfully');
          console.log('[App] Use "Save to Blockchain" button to sync local progress to blockchain');
        } catch (error) {
          console.error('Failed to load blockchain progress:', error);
          // Continue with local progress on error
        } finally {
          setIsLoadingBlockchainProgress(false);
        }
      }
    };

    loadBlockchainProgress();
  }, [isConnected, address, isAuthenticated, hasLoadedBlockchainProgress, mergeFromBlockchain, progress, updateProgress, syncToBlockchain]);

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
   * When a level is won, save progress locally
   * User can manually sync to blockchain via SaveProgressButton
   */
  useEffect(() => {
    if (gameState.gameStatus === 'won' && gameState.isPlaying === false) {
      // Calculate stars based on moves
      const config = getLevelConfig(gameState.level);
      const stars = calculateStars(gameState.moves, config);
      
      // Save level completion to progress (local storage only)
      completeLevel(gameState.level, stars);
      
      console.log(`[App] Level ${gameState.level} completed! Saved locally. Use "Save to Blockchain" button to sync.`);
    }
  }, [gameState.gameStatus, gameState.isPlaying, gameState.level, gameState.moves, completeLevel]);

  return (
    <Web3ErrorBoundary>
      <div className="app">
        {/* Skip link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Network blocker - blocks UI if on wrong network */}
        <NetworkBlocker />

        {/* Sync indicator */}
        <SyncIndicator />

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
          <Wallet>
            <LevelSelect
              progressData={progress}
              onLevelSelect={handleLevelSelect}
              onBackToMenu={handleBackToMenu}
            />
          </Wallet>
        )}

        {!isLoadingBlockchainProgress && currentScreen === 'game' && isAuthenticated && (
          <Wallet>
            <GameBoard
              gameState={gameState}
              onAction={handleGameAction}
              onLevelSelect={handleBackToLevelSelect}
              onLogout={handleBackToMenu}
            />
          </Wallet>
        )}
      </div>
    </Web3ErrorBoundary>
  );
}

export default App;
