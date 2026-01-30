/**
 * Utilities for detecting unsaved progress
 * 
 * Compares local progress with blockchain progress to determine
 * which levels need to be saved.
 */

import type { ProgressData } from '../types/game';
import type { OnChainProgress } from '../types/blockchain';

/**
 * Get levels that need to be saved to blockchain
 * 
 * Returns levels where:
 * - Level exists locally but not on blockchain
 * - Level has more stars locally than on blockchain
 * 
 * @param local - Local progress data
 * @param onChain - Blockchain progress data (null if no blockchain data)
 * @returns Object with unsaved levels and stars arrays
 */
export function getUnsavedLevels(
  local: ProgressData,
  onChain: OnChainProgress | null
): {
  levels: number[];
  stars: number[];
  count: number;
} {
  const unsavedLevels: number[] = [];
  const unsavedStars: number[] = [];

  // If no blockchain data, all local progress is unsaved
  if (!onChain) {
    const sortedLevels = Array.from(local.levelStars.keys()).sort((a, b) => a - b);
    sortedLevels.forEach(level => {
      const stars = local.levelStars.get(level);
      if (stars && stars >= 1 && stars <= 3) {
        unsavedLevels.push(level);
        unsavedStars.push(stars);
      }
    });
    
    return {
      levels: unsavedLevels,
      stars: unsavedStars,
      count: unsavedLevels.length,
    };
  }

  // Compare local and blockchain progress
  const sortedLevels = Array.from(local.levelStars.keys()).sort((a, b) => a - b);
  
  sortedLevels.forEach(level => {
    const localStars = local.levelStars.get(level) || 0;
    const blockchainStars = onChain.levelStars.get(level) || 0;
    
    // Level needs saving if:
    // 1. It has more stars locally than on blockchain
    // 2. It exists locally but not on blockchain
    if (localStars > blockchainStars) {
      unsavedLevels.push(level);
      unsavedStars.push(localStars);
    }
  });

  return {
    levels: unsavedLevels,
    stars: unsavedStars,
    count: unsavedLevels.length,
  };
}

/**
 * Check if blockchain has more progress than local
 * 
 * Returns true if there are levels on blockchain that:
 * - Don't exist locally
 * - Have more stars on blockchain than locally
 * 
 * @param local - Local progress data
 * @param onChain - Blockchain progress data (null if no blockchain data)
 * @returns True if blockchain has more progress
 */
export function hasMoreProgressOnBlockchain(
  local: ProgressData,
  onChain: OnChainProgress | null
): boolean {
  if (!onChain) return false;

  // Check if any level on blockchain has more stars than local
  for (const [level, blockchainStars] of onChain.levelStars.entries()) {
    const localStars = local.levelStars.get(level) || 0;
    if (blockchainStars > localStars) {
      return true;
    }
  }

  return false;
}

/**
 * Check if there is any unsaved progress
 * 
 * @param local - Local progress data
 * @param onChain - Blockchain progress data (null if no blockchain data)
 * @returns True if there are unsaved levels
 */
export function hasUnsavedProgress(
  local: ProgressData,
  onChain: OnChainProgress | null
): boolean {
  const { count } = getUnsavedLevels(local, onChain);
  return count > 0;
}
