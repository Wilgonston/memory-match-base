/**
 * App Component
 * 
 * Root component that manages the overall application state and navigation.
 * Handles transitions between level selection, gameplay, and result screens.
 * Integrates progress persistence and game state management.
 * 
 * Requirements: All
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Wallet } from '@coinbase/onchainkit/wallet';
import { LoginScreen } from './components/LoginScreen';
import { LevelSelect } from './components/LevelSelect';
import { GameBoard } from './components/GameBoard';
import { Web3ErrorBoundary } from './components/Web3ErrorBoundary';
import { LoadingIndicator } from './components/LoadingIndicator';
import { NetworkBlocker } from './components/NetworkBlocker';
import { useProgress } from './hooks/useProgress';
import { useGameState } from './hooks/useGameState';
import { useSyncManager } from './hooks/useSyncManager';
import { useLoadBlockchainProgress } from './hooks/useLoadBlockchainProgress';
import { calculateStars } from './utils/scoring';
import { getLevelConfig } from './utils/levelConfig';
import { initializeSounds } from './utils/soundManager';
import { clearAuthentication, isAuthenticatedForAddress } from './utils/auth';
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
  const { mergeFromBlockchain } = useSyncManager();

  // Get loading progress from blockchain hook (don't auto-load, wait for authentication)
  const { loadingProgress, isLoading: isLoadingBlockchain, refetch: refetchBlockchainProgress, progress: blockchainProgress } = useLoadBlockchainProgress({ autoLoad: false });

  // Debug: Log when loading state changes
  useEffect(() => {
    console.log('[App] isLoadingBlockchain changed:', isLoadingBlockchain, 'progress:', loadingProgress);
  }, [isLoadingBlockchain, loadingProgress]);

  // Game state management hook
  const { state: gameState, dispatch } = useGameState();

  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLoadedBlockchainProgress, setHasLoadedBlockchainProgress] = useState(false);
  
  // Ref to prevent duplicate loading calls
  const isLoadingRef = useRef(false);

  /**
   * Check if user has seen welcome screen before
   */
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      // Auto-set as seen for now
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

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
   * Wait for blockchain data to finish loading before merging
   * REMOVED: Now handled in handleAuthenticated callback
   */
  // useEffect removed - blockchain sync moved to handleAuthenticated

  /**
   * Reset blockchain progress loaded flag when wallet disconnects or authentication is cleared
   */
  useEffect(() => {
    if (!isConnected || !address || !isAuthenticated) {
      setHasLoadedBlockchainProgress(false);
    }
  }, [isConnected, address, isAuthenticated]);

  /**
   * Check authentication status on mount and wallet change
   * If already authenticated, load blockchain progress automatically
   * This only runs ONCE on initial mount/reconnect, not after manual refetch
   */
  useEffect(() => {
    if (isConnected && isAuthenticatedForAddress(address)) {
      setIsAuthenticated(true);
      setCurrentScreen('level-select');
      
      // Auto-load blockchain progress if already authenticated and not currently loading
      // hasLoadedBlockchainProgress prevents re-loading after manual refetch (e.g., after save)
      // isLoadingRef prevents duplicate calls during React re-renders
      if (!hasLoadedBlockchainProgress && !isLoadingBlockchain && !isLoadingRef.current) {
        console.log('[App] User already authenticated, auto-loading blockchain progress...');
        isLoadingRef.current = true;
        refetchBlockchainProgress().finally(() => {
          isLoadingRef.current = false;
        });
      } else if (hasLoadedBlockchainProgress) {
        console.log('[App] Blockchain progress already loaded, skipping auto-load');
      } else if (isLoadingBlockchain || isLoadingRef.current) {
        console.log('[App] Blockchain loading in progress, skipping auto-load');
      }
    } else {
      setIsAuthenticated(false);
      setCurrentScreen('login');
      clearAuthentication();
    }
  }, [address, isConnected, hasLoadedBlockchainProgress, isLoadingBlockchain, refetchBlockchainProgress]);

  /**
   * Handle successful authentication
   * Load blockchain progress after authentication
   */
  const handleAuthenticated = useCallback(async () => {
    setIsAuthenticated(true);
    setCurrentScreen('level-select');
    
    // Trigger blockchain loading after authentication
    if (isConnected && address && !hasLoadedBlockchainProgress && !isLoadingRef.current) {
      console.log('[App] Authentication successful, triggering blockchain progress load...');
      isLoadingRef.current = true;
      refetchBlockchainProgress().finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [isConnected, address, hasLoadedBlockchainProgress, refetchBlockchainProgress]);

  /**
   * Apply blockchain progress when it becomes available
   * This runs both on initial load and after refetch
   */
  useEffect(() => {
    // Run when blockchain progress is loaded and user is authenticated
    if (blockchainProgress && isAuthenticated) {
      const applyBlockchainProgress = async () => {
        try {
          console.log('[App] Blockchain progress loaded, merging with local progress...');
          console.log('[App] Current local progress:', {
            completedLevels: Array.from(progress.completedLevels),
            highestUnlockedLevel: progress.highestUnlockedLevel,
            levelStarsCount: progress.levelStars.size,
          });
          console.log('[App] Blockchain progress:', {
            total: blockchainProgress.total,
            updated: blockchainProgress.updated,
            levelsWithStars: blockchainProgress.levelStars.size,
          });

          const mergedProgress = await mergeFromBlockchain(progress, blockchainProgress);
          console.log('[App] Merged progress:', {
            completedLevels: Array.from(mergedProgress.completedLevels),
            highestUnlockedLevel: mergedProgress.highestUnlockedLevel,
            levelStarsCount: mergedProgress.levelStars.size,
          });

          // Only update if merge actually changed something
          if (mergedProgress.levelStars.size !== progress.levelStars.size ||
              Array.from(mergedProgress.levelStars.entries()).some(([level, stars]) => 
                progress.levelStars.get(level) !== stars
              )) {
            console.log('[App] Progress changed, updating UI...');
            updateProgress(() => mergedProgress);
          } else {
            console.log('[App] No changes in progress, skipping update');
          }

          // Mark as loaded on first load
          if (!hasLoadedBlockchainProgress) {
            setHasLoadedBlockchainProgress(true);
          }
          console.log('[App] ✅ Progress applied from blockchain successfully');
        } catch (error) {
          console.error('Failed to apply blockchain progress:', error);
          if (!hasLoadedBlockchainProgress) {
            setHasLoadedBlockchainProgress(true);
          }
        }
      };

      applyBlockchainProgress();
    }
  }, [blockchainProgress, isAuthenticated, progress, mergeFromBlockchain, updateProgress, hasLoadedBlockchainProgress]);

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

        {/* Loading blockchain progress after authentication */}
        {isLoadingBlockchain && (
          <>
            {console.log('[App] Rendering LoadingIndicator with progress:', loadingProgress)}
            <LoadingIndicator
              operation="Loading progress from blockchain"
              progress={loadingProgress.percentage}
              progressDetails={`Loading ${loadingProgress.current}/${loadingProgress.total} levels`}
            />
          </>
        )}

        {!isLoadingBlockchain && currentScreen === 'login' && (
          <LoginScreen onAuthenticated={handleAuthenticated} />
        )}

        {!isLoadingBlockchain && currentScreen === 'level-select' && isAuthenticated && (
          <Wallet>
            <LevelSelect
              progressData={progress}
              blockchainProgress={blockchainProgress}
              onRefetchBlockchain={refetchBlockchainProgress}
              onLevelSelect={handleLevelSelect}
              onBackToMenu={handleBackToMenu}
            />
          </Wallet>
        )}

        {!isLoadingBlockchain && currentScreen === 'game' && isAuthenticated && (
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
