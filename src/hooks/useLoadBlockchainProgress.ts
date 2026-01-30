/**
 * useLoadBlockchainProgress Hook
 * 
 * Loads complete progress from blockchain by reading all 100 levels.
 * Uses sequential loading with delays to avoid rate limits.
 */

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type OnChainProgress 
} from '../types/blockchain';

export interface UseLoadBlockchainProgressResult {
  progress: OnChainProgress | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadingProgress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export interface UseLoadBlockchainProgressOptions {
  /** Whether to auto-load on mount. Default: false */
  autoLoad?: boolean;
}

/**
 * Load complete progress from blockchain
 * Reads stars for all 100 levels sequentially with delays to avoid rate limits
 */
export function useLoadBlockchainProgress(options: UseLoadBlockchainProgressOptions = {}): UseLoadBlockchainProgressResult {
  const { autoLoad = false } = options;
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  const [progress, setProgress] = useState<OnChainProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 100, percentage: 0 });
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Use ref to track loading state for refetch promise
  const isLoadingRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

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
      
      // Track if we found an empty level (optimization: stop loading after first empty)
      let foundEmptyLevel = false;
      let lastLevelChecked = 0;

      for (let batchStart = 1; batchStart <= 100; batchStart += BATCH_SIZE) {
        // Stop if we already found an empty level
        if (foundEmptyLevel) {
          console.log(`[useLoadBlockchainProgress] Stopping at level ${batchStart} - no more progress beyond this point`);
          break;
        }
        
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 100);
        lastLevelChecked = batchEnd;
        
        console.log(`[useLoadBlockchainProgress] Loading levels ${batchStart}-${batchEnd}...`);

        // Load batch in parallel using wagmi's readContract
        const batchPromises = [];
        const batchResults: Array<{ level: number; stars: number }> = [];
        
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
                  batchResults.push({ level, stars: starsNumber });
                  
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
              // Add empty result on error
              batchResults.push({ level, stars: 0 });
            }
          })();

          batchPromises.push(promise);
        }

        // Wait for batch to complete
        await Promise.all(batchPromises);
        
        // Check if all levels in this batch are empty
        const allEmpty = batchResults.every(r => r.stars === 0);
        if (allEmpty && batchResults.length > 0) {
          foundEmptyLevel = true;
          console.log(`[useLoadBlockchainProgress] Found empty batch at levels ${batchStart}-${batchEnd}, stopping early`);
        }

        // Update progress
        const currentLevel = Math.min(batchEnd, 100);
        setLoadingProgress({
          current: currentLevel,
          total: 100,
          percentage: Math.round((currentLevel / 100) * 100)
        });

        // Delay before next batch (except for last batch or if stopping early)
        if (batchEnd < 100 && !foundEmptyLevel) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      console.log('[useLoadBlockchainProgress] Loaded from blockchain:', {
        total,
        updated,
        levelsWithStars: levelStars.size,
        levels: Array.from(levelStars.entries()).sort((a, b) => a[0] - b[0]),
        stoppedEarly: foundEmptyLevel,
        lastLevelChecked,
      });
      
      console.log(`✅ Blockchain sync complete! Found ${levelStars.size} levels with progress (${total} total stars)`);

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

  // Auto-load on mount (only once) - only if autoLoad is enabled
  useEffect(() => {
    if (autoLoad && address && isConnected && !shouldLoad && !isLoading && !hasAttemptedLoad) {
      console.log('[useLoadBlockchainProgress] Auto-triggering initial load');
      setShouldLoad(true);
    }
  }, [autoLoad, address, isConnected, shouldLoad, isLoading, hasAttemptedLoad]);

  const refetch = useCallback(() => {
    console.log('[useLoadBlockchainProgress] Manual refetch triggered');
    setHasAttemptedLoad(false);
    setProgress(null); // Clear old progress
    setError(null);
    setLoadingProgress({ current: 0, total: 100, percentage: 0 });
    
    // Return a promise that resolves when loading is complete
    return new Promise<void>((resolve) => {
      let checkCount = 0;
      const maxChecks = 300; // 30 seconds (100ms * 300)
      
      // Trigger the load
      setShouldLoad(true);
      
      // Wait a bit for state to update
      setTimeout(() => {
        // Poll until loading completes using ref
        const checkInterval = setInterval(() => {
          checkCount++;
          
          // Check if loading is complete using ref
          if (!isLoadingRef.current) {
            console.log('[useLoadBlockchainProgress] Refetch completed');
            clearInterval(checkInterval);
            resolve();
            return;
          }
          
          // Check if we've exceeded max checks
          if (checkCount >= maxChecks) {
            console.warn('[useLoadBlockchainProgress] Refetch timeout after 30 seconds');
            clearInterval(checkInterval);
            resolve();
            return;
          }
        }, 100);
      }, 50);
    });
  }, []);

  return {
    progress,
    isLoading,
    error,
    refetch,
    loadingProgress,
  };
}
