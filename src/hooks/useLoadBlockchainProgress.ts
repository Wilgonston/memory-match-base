/**
 * useLoadBlockchainProgress Hook
 * 
 * Loads complete progress from blockchain by reading all 100 levels.
 * Uses sequential loading with delays to avoid rate limits.
 */

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type OnChainProgress 
} from '../types/blockchain';

export interface UseLoadBlockchainProgressResult {
  progress: OnChainProgress | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  loadingProgress: {
    current: number;
    total: number;
    percentage: number;
  };
}

/**
 * Load complete progress from blockchain
 * Reads stars for all 100 levels sequentially with delays to avoid rate limits
 */
export function useLoadBlockchainProgress(): UseLoadBlockchainProgressResult {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  const [progress, setProgress] = useState<OnChainProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 100, percentage: 0 });
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Read total stars
  const { data: totalData } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getTotal',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && shouldLoad,
    },
  });

  // Read updated timestamp
  const { data: updatedData } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getUpdated',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && shouldLoad,
    },
  });

  // Load all levels sequentially with delays
  const loadAllLevels = useCallback(async () => {
    if (!address || !isConnected || isLoading) {
      console.log('[useLoadBlockchainProgress] Skipping load - already loading or no address');
      return;
    }

    setIsLoading(true);
    setHasAttemptedLoad(true);
    setError(null);
    setLoadingProgress({ current: 0, total: 100, percentage: 0 });

    try {
      console.log('[useLoadBlockchainProgress] Starting to load progress from blockchain...');
      
      const total = totalData ? Number(totalData) : 0;
      const updated = updatedData ? Number(updatedData) : 0;

      console.log('[useLoadBlockchainProgress] Total stars:', total, 'Updated:', updated);

      // If no progress on blockchain, return null
      if (total === 0 && updated === 0) {
        console.log('[useLoadBlockchainProgress] No progress on blockchain');
        setProgress(null);
        setIsLoading(false);
        setShouldLoad(false); // Prevent re-loading
        return;
      }

      const levelStars = new Map<number, number>();
      
      // Load levels in batches with delays to avoid rate limits
      // Reduced batch size and increased delay to prevent 429 errors
      const BATCH_SIZE = 3; // Reduced from 5 to 3
      const DELAY_BETWEEN_BATCHES = 800; // Increased from 300ms to 800ms

      for (let batchStart = 1; batchStart <= 100; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 100);
        
        console.log(`[useLoadBlockchainProgress] Loading levels ${batchStart}-${batchEnd}...`);

        // Load batch in parallel using wagmi's readContract
        const batchPromises = [];
        for (let level = batchStart; level <= batchEnd; level++) {
          const promise = (async () => {
            try {
              // Use wagmi's readContract which handles RPC properly
              const { readContract } = await import('@wagmi/core');
              const { wagmiConfig } = await import('../config/wagmi');
              
              // Retry logic for rate limit errors
              let retries = 0;
              const maxRetries = 3;
              
              while (retries < maxRetries) {
                try {
                  const stars = await readContract(wagmiConfig, {
                    address: contractAddress,
                    abi: MEMORY_MATCH_PROGRESS_ABI,
                    functionName: 'getStars',
                    args: [address, level],
                  });
                  
                  const starsNumber = Number(stars);
                  if (starsNumber > 0) {
                    levelStars.set(level, starsNumber);
                  }
                  break; // Success, exit retry loop
                } catch (retryErr: any) {
                  // Check if it's a rate limit error
                  const isRateLimit = retryErr?.cause?.status === 429 || 
                                     retryErr?.message?.includes('rate limit') ||
                                     retryErr?.message?.includes('429');
                  
                  if (isRateLimit && retries < maxRetries - 1) {
                    retries++;
                    const delay = 1000 * retries; // 1s, 2s, 3s
                    console.log(`[useLoadBlockchainProgress] Rate limit for level ${level}, retry ${retries}/${maxRetries} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  } else {
                    throw retryErr; // Not rate limit or max retries reached
                  }
                }
              }
            } catch (err) {
              // Only log non-rate-limit errors
              const isRateLimit = (err as any)?.cause?.status === 429;
              if (!isRateLimit) {
                console.error(`[useLoadBlockchainProgress] Error loading level ${level}:`, err);
              }
            }
          })();

          batchPromises.push(promise);
        }

        // Wait for batch to complete
        await Promise.all(batchPromises);

        // Update progress
        setLoadingProgress({
          current: batchEnd,
          total: 100,
          percentage: Math.round((batchEnd / 100) * 100)
        });

        // Delay before next batch (except for last batch)
        if (batchEnd < 100) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      console.log('[useLoadBlockchainProgress] Loaded from blockchain:', {
        total,
        updated,
        levelsWithStars: levelStars.size,
        levels: Array.from(levelStars.keys()),
      });

      setProgress({
        total,
        updated,
        levelStars,
      });
      setIsLoading(false);
      setShouldLoad(false); // Prevent re-loading
    } catch (err) {
      console.error('[useLoadBlockchainProgress] Error loading progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to load progress'));
      setIsLoading(false);
      setShouldLoad(false); // Prevent re-loading on error
    }
  }, [address, isConnected, contractAddress, totalData, updatedData, isLoading]);

  // Trigger load when enabled (only if not already loading)
  useEffect(() => {
    if (shouldLoad && address && isConnected && totalData !== undefined && updatedData !== undefined && !isLoading) {
      loadAllLevels();
    }
  }, [shouldLoad, address, isConnected, totalData, updatedData, loadAllLevels, isLoading]);

  // Auto-load on mount (only once)
  useEffect(() => {
    if (address && isConnected && !shouldLoad && !isLoading && !hasAttemptedLoad) {
      console.log('[useLoadBlockchainProgress] Auto-triggering initial load');
      setShouldLoad(true);
    }
  }, [address, isConnected, shouldLoad, isLoading, hasAttemptedLoad]);

  const refetch = useCallback(() => {
    console.log('[useLoadBlockchainProgress] Manual refetch triggered');
    setHasAttemptedLoad(false);
    setShouldLoad(false);
    setTimeout(() => setShouldLoad(true), 100);
  }, []);

  return {
    progress,
    isLoading,
    error,
    refetch,
    loadingProgress,
  };
}
