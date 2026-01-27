/**
 * Progress Synchronization Utilities
 * 
 * Utilities for converting between local and on-chain progress data formats.
 * Handles data transformation and merging logic.
 * 
 * Requirements: 18.1, 18.2, 18.3
 */

import type { ProgressData } from '../types/game';
import type { OnChainProgress } from '../types/blockchain';

/**
 * Convert local ProgressData to OnChainProgress format
 * 
 * Transforms the local storage format to the format expected by the smart contract.
 * 
 * @param localProgress - Progress data from local storage
 * @returns On-chain progress format ready for blockchain submission
 * 
 * @example
 * ```ts
 * const local = { completedLevels: new Set([1, 2]), levelStars: new Map([[1, 3], [2, 2]]) };
 * const onChain = localToOnChain(local);
 * // onChain = { total: 5, updated: 0, levelStars: Map { 1 => 3, 2 => 2 } }
 * ```
 */
export function localToOnChain(localProgress: ProgressData): OnChainProgress {
  // Calculate total stars
  let total = 0;
  const levelStars = new Map<number, number>();

  // Convert levelStars Map to on-chain format
  localProgress.levelStars.forEach((stars, level) => {
    if (stars >= 1 && stars <= 3 && level >= 1 && level <= 100) {
      levelStars.set(level, stars);
      total += stars;
    }
  });

  return {
    total,
    updated: 0, // Will be set by contract
    levelStars,
  };
}

/**
 * Convert OnChainProgress to local ProgressData format
 * 
 * Transforms blockchain data to the format used by local storage.
 * 
 * @param onChainProgress - Progress data from blockchain
 * @returns Local progress format for storage
 * 
 * @example
 * ```ts
 * const onChain = { total: 5, updated: 1234567890, levelStars: new Map([[1, 3], [2, 2]]) };
 * const local = onChainToLocal(onChain);
 * // local = { completedLevels: Set { 1, 2 }, levelStars: Map { 1 => 3, 2 => 2 }, ... }
 * ```
 */
export function onChainToLocal(onChainProgress: OnChainProgress): ProgressData {
  const completedLevels = new Set<number>();
  const levelStars = new Map<number, number>();

  // Convert on-chain levelStars to local format
  onChainProgress.levelStars.forEach((stars, level) => {
    if (stars >= 1 && stars <= 3 && level >= 1 && level <= 100) {
      completedLevels.add(level);
      levelStars.set(level, stars);
    }
  });

  // Calculate highest unlocked level
  // If no levels completed, level 1 should be unlocked
  // Otherwise, unlock the next level after the highest completed
  const highestUnlockedLevel = completedLevels.size > 0 
    ? Math.min(Math.max(...Array.from(completedLevels)) + 1, 100)
    : 1;

  return {
    completedLevels,
    levelStars,
    highestUnlockedLevel,
    soundEnabled: true, // Default value, will be overridden by local storage if exists
  };
}

/**
 * Merge local and on-chain progress data
 * 
 * Combines progress from two sources, keeping the maximum stars for each level.
 * This ensures no progress is lost when syncing between local and blockchain.
 * 
 * @param local - Progress data from local storage
 * @param onChain - Progress data from blockchain
 * @returns Merged progress with maximum stars for each level
 * 
 * @example
 * ```ts
 * const local = { levelStars: new Map([[1, 2], [2, 3]]) };
 * const onChain = { levelStars: new Map([[1, 3], [3, 2]]) };
 * const merged = mergeProgress(local, onChain);
 * // merged.levelStars = Map { 1 => 3, 2 => 3, 3 => 2 }
 * ```
 */
export function mergeProgress(
  local: ProgressData,
  onChain: OnChainProgress
): ProgressData {
  const completedLevels = new Set<number>();
  const levelStars = new Map<number, number>();

  // Merge level stars, keeping maximum for each level
  const allLevels = new Set([
    ...Array.from(local.levelStars.keys()),
    ...Array.from(onChain.levelStars.keys()),
  ]);

  allLevels.forEach(level => {
    const localStars = local.levelStars.get(level) || 0;
    const onChainStars = onChain.levelStars.get(level) || 0;
    const maxStars = Math.max(localStars, onChainStars);

    if (maxStars > 0) {
      completedLevels.add(level);
      levelStars.set(level, maxStars);
    }
  });

  // Calculate total stars and highest unlocked level
  let totalStars = 0;
  levelStars.forEach(stars => {
    totalStars += stars;
  });

  // If no levels completed, level 1 should be unlocked
  // Otherwise, unlock the next level after the highest completed
  const highestUnlockedLevel = completedLevels.size > 0
    ? Math.min(Math.max(...Array.from(completedLevels)) + 1, 100)
    : 1;

  return {
    completedLevels,
    levelStars,
    highestUnlockedLevel,
    soundEnabled: local.soundEnabled, // Preserve local preference
  };
}

/**
 * Extract levels and stars arrays for batch update
 * 
 * Converts ProgressData to the format needed for smart contract batch update.
 * 
 * @param progress - Progress data to convert
 * @returns Object with levels and stars arrays
 * 
 * @example
 * ```ts
 * const progress = { levelStars: new Map([[1, 3], [2, 2], [5, 1]]) };
 * const { levels, stars } = extractBatchUpdateData(progress);
 * // levels = [1, 2, 5]
 * // stars = [3, 2, 1]
 * ```
 */
export function extractBatchUpdateData(progress: ProgressData): {
  levels: number[];
  stars: number[];
} {
  const levels: number[] = [];
  const stars: number[] = [];

  // Sort levels for consistent ordering
  const sortedLevels = Array.from(progress.levelStars.keys()).sort((a, b) => a - b);

  sortedLevels.forEach(level => {
    const star = progress.levelStars.get(level);
    if (star && star >= 1 && star <= 3 && level >= 1 && level <= 100) {
      levels.push(level);
      stars.push(star);
    }
  });

  return { levels, stars };
}

/**
 * Check if progress data has any completed levels
 * 
 * @param progress - Progress data to check
 * @returns True if any levels are completed
 */
export function hasCompletedLevels(progress: ProgressData): boolean {
  return progress.completedLevels.size > 0;
}

/**
 * Check if two progress states are equivalent
 * 
 * Compares level stars to determine if progress is the same.
 * 
 * @param a - First progress data
 * @param b - Second progress data
 * @returns True if progress is equivalent
 */
export function isProgressEquivalent(a: ProgressData, b: ProgressData): boolean {
  if (a.levelStars.size !== b.levelStars.size) {
    return false;
  }

  for (const [level, stars] of a.levelStars) {
    if (b.levelStars.get(level) !== stars) {
      return false;
    }
  }

  return true;
}
