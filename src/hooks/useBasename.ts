/**
 * useBasename Hook
 * 
 * Custom hook for resolving and displaying Basenames and addresses.
 * Uses OnchainKit's useName hook for Basename resolution with caching.
 * 
 * Requirements: 16.1, 16.2, 28.1
 */

import { useName } from '@coinbase/onchainkit/identity';
import { useMemo } from 'react';
import { base } from 'wagmi/chains';

/**
 * Cache for Basename resolutions
 * Key: address, Value: { basename: string | null, timestamp: number }
 */
const basenameCache = new Map<string, { basename: string | null; timestamp: number }>();

/**
 * Cache duration: 5 minutes
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Truncate an Ethereum address to format: 0x1234...5678
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Hook return type
 */
export interface UseBasenameResult {
  basename: string | null;
  displayName: string;
  isLoading: boolean;
}

/**
 * Custom hook for Basename resolution with caching
 * 
 * @param address - Ethereum address to resolve
 * @returns Object containing basename, displayName, and loading state
 * 
 * @example
 * ```tsx
 * const { basename, displayName, isLoading } = useBasename(address);
 * 
 * if (isLoading) return <div>Loading...</div>;
 * return <div>{displayName}</div>; // Shows "alice.base.eth" or "0x1234...5678"
 * ```
 */
export function useBasename(address: `0x${string}` | undefined): UseBasenameResult {
  // Check cache first
  const cachedResult = useMemo(() => {
    if (!address) return null;
    
    const cached = basenameCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.basename;
    }
    return null;
  }, [address]);

  // Use OnchainKit's useName hook for Basename resolution
  const { data: basename, isLoading } = useName({
    address: address,
    chain: base,
  });

  // Update cache when basename is resolved
  useMemo(() => {
    if (address && basename !== undefined && !isLoading) {
      basenameCache.set(address, {
        basename: basename || null,
        timestamp: Date.now(),
      });
    }
  }, [address, basename, isLoading]);

  // Determine display name
  const displayName = useMemo(() => {
    if (!address) return '';
    
    // Use cached result if available
    if (cachedResult !== null) {
      return cachedResult || truncateAddress(address);
    }
    
    // Use resolved basename or truncated address
    if (basename) {
      return basename;
    }
    
    return truncateAddress(address);
  }, [address, basename, cachedResult]);

  return {
    basename: cachedResult !== null ? cachedResult : (basename || null),
    displayName,
    isLoading: cachedResult !== null ? false : isLoading,
  };
}

/**
 * Clear the Basename cache
 * Useful for testing or when you want to force a refresh
 */
export function clearBasenameCache(): void {
  basenameCache.clear();
}
