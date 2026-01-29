/**
 * useSyncManager Hook - REWRITTEN FROM SCRATCH
 * 
 * Simple synchronization manager without state management.
 * Only provides functions to sync and merge progress.
 */

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useLoadBlockchainProgress } from './useLoadBlockchainProgress';
import { useBatchUpdateLevels } from './useBatchUpdateLevels';
import { 
  mergeProgress, 
  extractBatchUpdateData, 
  hasCompletedLevels 
} from '../utils/progressSync';
import type { ProgressData } from '../types/game';

export interface UseSyncManagerResult {
  syncToBlockchain: (localProgress: ProgressData) => Promise<void>;
  mergeFromBlockchain: (localProgress: ProgressData) => Promise<ProgressData>;
}

export function useSyncManager(): UseSyncManagerResult {
  const { address, isConnected } = useAccount();
  const { progress: onChainProgress } = useLoadBlockchainProgress();
  const { batchUpdate } = useBatchUpdateLevels();

  const syncToBlockchain = useCallback(
    async (localProgress: ProgressData): Promise<void> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      if (!hasCompletedLevels(localProgress)) {
        return;
      }

      const { levels, stars } = extractBatchUpdateData(localProgress);
      
      if (levels.length > 0) {
        await batchUpdate(levels, stars);
      }
    },
    [isConnected, address, batchUpdate]
  );

  const mergeFromBlockchain = useCallback(
    async (localProgress: ProgressData): Promise<ProgressData> => {
      if (!isConnected || !address || !onChainProgress) {
        return localProgress;
      }

      try {
        return mergeProgress(localProgress, onChainProgress);
      } catch (error) {
        console.error('[useSyncManager] Merge error:', error);
        return localProgress;
      }
    },
    [isConnected, address, onChainProgress]
  );

  return {
    syncToBlockchain,
    mergeFromBlockchain,
  };
}
