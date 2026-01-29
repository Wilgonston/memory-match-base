/**
 * useLoadBlockchainProgress Hook
 * 
 * Optimized blockchain progress loading:
 * 1. First checks getTotal to see if user has any progress
 * 2. Only loads individual levels if total > 0
 * 3. Uses multicall for efficiency when loading levels
 */

import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useMemo, useState, useEffect } from 'react';
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
 * Optimized to check total first, then only load levels if needed
 */
export function useLoadBlockchainProgress(): UseLoadBlockchainProgressResult {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();
  const [shouldLoadLevels, setShouldLoadLevels] = useState(false);

  console.log('[useLoadBlockchainProgress] 🚀 Hook called:', {
    address,
    isConnected,
    contractAddress,
  });

  // Step 1: Check total stars first
  const { 
    data: totalData, 
    isLoading: isLoadingTotal, 
    error: totalError,
    refetch: refetchTotal 
  } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getTotal',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      staleTime: 10 * 60_000, // Cache for 10 minutes
      gcTime: 30 * 60_000, // Keep in cache for 30 minutes
    },
  });

  // Debug logging for total
  useEffect(() => {
    console.log('[useLoadBlockchainProgress] 🔍 Total check:', {
      address,
      isConnected,
      contractAddress,
      totalData,
      isLoadingTotal,
      totalError: totalError?.message,
    });
  }, [address, isConnected, contractAddress, totalData, isLoadingTotal, totalError]);

  // Step 2: Get updated timestamp
  const { 
    data: updatedData, 
    isLoading: isLoadingUpdated,
    error: updatedError 
  } = useReadContract({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'getUpdated',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && shouldLoadLevels,
      staleTime: 10 * 60_000,
      gcTime: 30 * 60_000,
    },
  });

  // Determine if we should load individual levels
  useEffect(() => {
    if (totalData !== undefined) {
      const total = Number(totalData);
      console.log('[useLoadBlockchainProgress] 📊 Total stars on blockchain:', total);
      console.log('[useLoadBlockchainProgress] Should load levels:', total > 0);
      setShouldLoadLevels(total > 0);
    }
  }, [totalData]);

  // Step 3: Only load individual levels if total > 0
  const levelContracts = useMemo(() => {
    if (!address || !isConnected || !shouldLoadLevels) return [];

    return Array.from({ length: 100 }, (_, i) => ({
      address: contractAddress,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'getStars' as const,
      args: [address, (i + 1) as number],
    }));
  }, [address, isConnected, contractAddress, shouldLoadLevels]);

  const { 
    data: levelsData, 
    isLoading: isLoadingLevels, 
    error: levelsError 
  } = useReadContracts({
    contracts: levelContracts,
    query: {
      enabled: shouldLoadLevels && levelContracts.length > 0,
      staleTime: 10 * 60_000,
      gcTime: 30 * 60_000,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  });

  // Combine loading states
  const isLoading = isLoadingTotal || (shouldLoadLevels && (isLoadingUpdated || isLoadingLevels));
  const error = totalError || updatedError || levelsError;

  // Parse results into OnChainProgress
  const progress = useMemo((): OnChainProgress | null => {
    console.log('[useLoadBlockchainProgress] 🔄 Parsing progress:', {
      totalData,
      updatedData,
      levelsDataLength: levelsData?.length,
      shouldLoadLevels,
    });

    if (totalData === undefined) {
      console.log('[useLoadBlockchainProgress] ❌ No totalData');
      return null;
    }

    const total = Number(totalData);

    // If no progress on blockchain, return null immediately
    if (total === 0) {
      console.log('[useLoadBlockchainProgress] ℹ️ No progress on blockchain (total = 0)');
      return null;
    }

    // If we haven't loaded levels yet, return null
    if (!levelsData || !updatedData) {
      console.log('[useLoadBlockchainProgress] ⏳ Waiting for levels data...', {
        hasLevelsData: !!levelsData,
        hasUpdatedData: !!updatedData,
      });
      return null;
    }

    const updated = Number(updatedData);

    // Parse level stars from results
    const levelStars = new Map<number, number>();
    for (let i = 0; i < levelsData.length; i++) {
      const levelResult = levelsData[i];
      if (levelResult && levelResult.status === 'success') {
        const stars = Number(levelResult.result);
        if (stars > 0) {
          levelStars.set(i + 1, stars);
          console.log(`[useLoadBlockchainProgress] ⭐ Level ${i + 1}: ${stars} stars`);
        }
      }
    }

    console.log('[useLoadBlockchainProgress] ✅ Loaded from blockchain:', {
      total,
      updated,
      levelsWithStars: levelStars.size,
      levels: Array.from(levelStars.keys()),
      allLevelStars: Array.from(levelStars.entries()),
    });

    return {
      total,
      updated,
      levelStars,
    };
  }, [totalData, updatedData, levelsData, shouldLoadLevels]);

  // Refetch function
  const refetch = () => {
    refetchTotal();
  };

  return {
    progress,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
