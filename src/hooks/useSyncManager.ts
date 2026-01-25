/**
 * useSyncManager Hook
 * 
 * Manages synchronization between local storage and blockchain progress.
 * Handles auto-sync on wallet connection, manual sync, and merge logic.
 * 
 * Requirements: 18.2, 18.3, 18.4, 18.7
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePlayerProgress } from './usePlayerProgress';
import { useBatchUpdateLevels } from './useBatchUpdateLevels';
import { 
  mergeProgress, 
  extractBatchUpdateData, 
  hasCompletedLevels 
} from '../utils/progressSync';
import type { ProgressData } from '../types/game';
import type { SyncStatus } from '../types/blockchain';

/**
 * Hook return type
 */
export interface UseSyncManagerResult {
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Sync local progress to blockchain */
  syncToBlockchain: (localProgress: ProgressData) => Promise<void>;
  /** Merge blockchain progress with local */
  mergeFromBlockchain: (localProgress: ProgressData) => Promise<ProgressData>;
  /** Manually trigger sync */
  manualSync: (localProgress: ProgressData) => Promise<ProgressData>;
}

/**
 * Custom hook for managing progress synchronization
 * 
 * Features:
 * - Auto-syncs on wallet connection
 * - Merges local and blockchain progress (keeps maximum stars)
 * - Provides manual sync function
 * - Tracks sync status and errors
 * - Falls back to local-only mode on errors
 * 
 * @returns Object containing sync functions and status
 * 
 * @example
 * ```tsx
 * const { syncStatus, syncToBlockchain, mergeFromBlockchain } = useSyncManager();
 * 
 * // Sync local progress to blockchain
 * await syncToBlockchain(localProgress);
 * 
 * // Merge blockchain progress with local
 * const merged = await mergeFromBlockchain(localProgress);
 * ```
 */
export function useSyncManager(): UseSyncManagerResult {
  const { address, isConnected } = useAccount();
  const { progress: onChainProgress } = usePlayerProgress();
  const { batchUpdate, isPending: isSyncing } = useBatchUpdateLevels();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    mode: 'local',
  });

  // Update sync mode based on wallet connection
  useEffect(() => {
    if (isConnected && address) {
      setSyncStatus(prev => ({ ...prev, mode: 'blockchain' }));
    } else {
      setSyncStatus(prev => ({ ...prev, mode: 'local' }));
    }
  }, [isConnected, address]);

  // Update syncing state
  useEffect(() => {
    setSyncStatus(prev => ({ ...prev, isSyncing }));
  }, [isSyncing]);

  /**
   * Sync local progress to blockchain
   */
  const syncToBlockchain = useCallback(
    async (localProgress: ProgressData): Promise<void> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      if (!hasCompletedLevels(localProgress)) {
        // Nothing to sync
        return;
      }

      try {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: true, 
          syncError: undefined 
        }));

        const { levels, stars } = extractBatchUpdateData(localProgress);
        
        if (levels.length > 0) {
          await batchUpdate(levels, stars);
          
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: Date.now(),
          }));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Sync failed';
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          syncError: errorMsg,
        }));
        throw error;
      }
    },
    [isConnected, address, batchUpdate]
  );

  /**
   * Merge blockchain progress with local
   */
  const mergeFromBlockchain = useCallback(
    async (localProgress: ProgressData): Promise<ProgressData> => {
      if (!isConnected || !address || !onChainProgress) {
        // Return local progress if not connected
        return localProgress;
      }

      try {
        const merged = mergeProgress(localProgress, onChainProgress);
        
        return merged;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Merge failed';
        setSyncStatus(prev => ({
          ...prev,
          syncError: errorMsg,
        }));
        // Return local progress on error
        return localProgress;
      }
    },
    [isConnected, address, onChainProgress]
  );

  /**
   * Manual sync: merge from blockchain, then sync to blockchain
   */
  const manualSync = useCallback(
    async (localProgress: ProgressData): Promise<ProgressData> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      try {
        // First, merge from blockchain
        const merged = await mergeFromBlockchain(localProgress);
        
        // Then, sync merged progress to blockchain
        await syncToBlockchain(merged);
        
        return merged;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Manual sync failed';
        setSyncStatus(prev => ({
          ...prev,
          syncError: errorMsg,
        }));
        throw error;
      }
    },
    [isConnected, address, mergeFromBlockchain, syncToBlockchain]
  );

  return {
    syncStatus,
    syncToBlockchain,
    mergeFromBlockchain,
    manualSync,
  };
}
