/**
 * useLoadBlockchainProgress Hook
 * 
 * Loads complete progress from blockchain by reading all 100 levels.
 * Uses multicall pattern for efficiency.
 */

import { useAccount, useReadContracts } from 'wagmi';
import { useMemo } from 'react';
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
}

/**
 * Load complete progress from blockchain
 * Reads stars for all 100 levels using multicall for efficiency
 */
export function useLoadBlockchainProgress(): UseLoadBlockchainProgressResult {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  // Create array of contracts to read (all 100 levels + total + updated)
  const contracts = useMemo(() => {
    if (!address || !isConnected) return [];

    const levelContracts = Array.from({ length: 100 }, (_, i) => ({
      address: contractAddress,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'getStars' as const,
      args: [address, (i + 1) as number],
    }));

    return [
      // First get total to check if user has any progress
      {
        address: contractAddress,
        abi: MEMORY_MATCH_PROGRESS_ABI,
        functionName: 'getTotal' as const,
        args: [address],
      },
      // Then get updated timestamp
      {
        address: contractAddress,
        abi: MEMORY_MATCH_PROGRESS_ABI,
        functionName: 'getUpdated' as const,
        args: [address],
      },
      // Then all level stars
      ...levelContracts,
    ];
  }, [address, isConnected, contractAddress]);

  // Use multicall to read all data at once
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: isConnected && !!address && contracts.length > 0,
      staleTime: 10_000, // Cache for 10 seconds
      gcTime: 30_000,
    },
  });

  // Parse results into OnChainProgress
  const progress = useMemo((): OnChainProgress | null => {
    if (!data || data.length < 2) return null;

    const totalResult = data[0];
    const updatedResult = data[1];

    // Check if results are valid
    if (totalResult.status !== 'success' || updatedResult.status !== 'success') {
      return null;
    }

    const total = Number(totalResult.result);
    const updated = Number(updatedResult.result);

    // If no progress on blockchain, return null
    if (total === 0 && updated === 0) {
      return null;
    }

    // Parse level stars from remaining results
    const levelStars = new Map<number, number>();
    for (let i = 0; i < 100; i++) {
      const levelResult = data[i + 2]; // Skip first 2 (total and updated)
      if (levelResult && levelResult.status === 'success') {
        const stars = Number(levelResult.result);
        if (stars > 0) {
          levelStars.set(i + 1, stars);
        }
      }
    }

    console.log('[useLoadBlockchainProgress] Loaded from blockchain:', {
      total,
      updated,
      levelsWithStars: levelStars.size,
      levels: Array.from(levelStars.keys()),
    });

    return {
      total,
      updated,
      levelStars,
    };
  }, [data]);

  return {
    progress,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
