/**
 * useSyncManager Hook - COMPLETELY REWRITTEN
 * 
 * NO automatic syncing, NO state management, NO useEffect.
 * Only provides functions to manually sync when user clicks a button.
 */

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useBatchUpdateLevels } from './useBatchUpdateLevels';
import { 
  extractBatchUpdateData, 
  hasCompletedLevels 
} from '../utils/progressSync';
import type { ProgressData } from '../types/game';

export interface UseSyncManagerResult {
  syncToBlockchain: (localProgress: ProgressData) => Promise<void>;
}

export function useSyncManager(): UseSyncManagerResult {
  const { address, isConnected } = useAccount();
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

  return {
    syncToBlockchain,
  };
}
