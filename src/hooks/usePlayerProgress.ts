/**
 * usePlayerProgress Hook
 * 
 * Custom hook for fetching player progress from the smart contract.
 * Uses wagmi's useReadContract with caching for efficient data fetching.
 * 
 * Requirements: 18.2, 18.6
 */

import { useReadContract, useAccount } from 'wagmi';
import { useMemo } from 'react';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type OnChainProgress 
} from '../types/blockchain';

/**
 * Hook return type
 */
export interface UsePlayerProgressResult {
  /** On-chain progress data */
  progress: OnChainProgress | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refetch function to manually refresh data */
  refetch: () => void;
}

/**
 * Custom hook for fetching player progress from blockchain
 * 
 * Features:
 * - Fetches total stars and last update timestamp
 * - Fetches individual level stars for completed levels
 * - Caches data for 30 seconds to reduce RPC calls
 * - Automatically refetches when wallet changes
 * - Returns null when no wallet is connected
 * 
 * @returns Object containing progress data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { progress, isLoading, error, refetch } = usePlayerProgress();
 * 
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!progress) return <div>Connect wallet to see progress</div>;
 * 
 * return <div>Total Stars: {progress.total}</div>;
 * ```
 */
export function usePlayerProgress(): UsePlayerProgressResult {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  // Fetch total stars
  const {
    data: totalStars,
    isLoading: isLoadingTotal,
    error: errorTotal,
    refetch: refetchTotal,
  } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getTotal',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      staleTime: 10_000, // Cache for 10 seconds (shorter for better sync)
      gcTime: 30_000, // Keep in cache for 30 seconds
    },
  });

  // Fetch last updated timestamp
  const {
    data: updated,
    isLoading: isLoadingUpdated,
    error: errorUpdated,
    refetch: refetchUpdated,
  } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getUpdated',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      staleTime: 10_000, // Cache for 10 seconds
      gcTime: 30_000, // Keep in cache for 30 seconds
    },
  });

  // Combine data into OnChainProgress format
  const progress = useMemo((): OnChainProgress | null => {
    if (!isConnected || !address) {
      return null;
    }

    // If data is still loading, return null
    if (totalStars === undefined || updated === undefined) {
      return null;
    }

    // For new users with no progress, return null to use local progress
    // This prevents overwriting local progress with empty blockchain data
    if (totalStars === 0n && updated === 0n) {
      return null;
    }

    return {
      total: Number(totalStars),
      updated: Number(updated),
      levelStars: new Map(), // Will be populated by individual level queries if needed
    };
  }, [isConnected, address, totalStars, updated]);

  // Combined loading state
  const isLoading = isLoadingTotal || isLoadingUpdated;

  // Combined error state
  const error = errorTotal || errorUpdated;

  // Combined refetch function
  const refetch = () => {
    refetchTotal();
    refetchUpdated();
  };

  return {
    progress,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching stars for a specific level
 * 
 * @param level - Level number (1-100)
 * @returns Object containing stars, loading state, and error
 * 
 * @example
 * ```tsx
 * const { stars, isLoading } = useLevelStars(5);
 * return <div>Level 5: {stars} stars</div>;
 * ```
 */
export function useLevelStars(level: number) {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  const {
    data: stars,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getStars',
    args: address && level >= 1 && level <= 100 ? [address, level] : undefined,
    query: {
      enabled: isConnected && !!address && level >= 1 && level <= 100,
      staleTime: 30_000, // Cache for 30 seconds
      gcTime: 60_000, // Keep in cache for 1 minute
    },
  });

  return {
    stars: stars !== undefined ? Number(stars) : 0,
    isLoading,
    error,
    refetch,
  };
}
