/**
 * Custom hook for progress management
 * 
 * This hook provides a clean interface for managing player progress throughout
 * the application. It handles loading progress from LocalStorage on mount,
 * saving progress on updates, and provides functions to update progress data.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @example
 * ```typescript
 * function App() {
 *   const { progress, completeLevel, updateProgress } = useProgress();
 *   
 *   const handleLevelComplete = (level: number, stars: number) => {
 *     completeLevel(level, stars);
 *   };
 *   
 *   return (
 *     <div>
 *       Highest Level: {progress.highestUnlockedLevel}
 *       Total Stars: {Array.from(progress.levelStars.values()).reduce((a, b) => a + b, 0)}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageManager } from '../utils/storage';
import type { ProgressData } from '../types/game';

/**
 * Return type for useProgress hook
 */
export interface UseProgressReturn {
  /** Current progress data */
  progress: ProgressData;
  /** Function to mark a level as complete with star rating */
  completeLevel: (level: number, stars: number) => void;
  /** Function to update progress data directly */
  updateProgress: (updater: (prev: ProgressData) => ProgressData) => void;
  /** Function to reset all progress */
  resetProgress: () => void;
}

/**
 * Custom hook for managing player progress
 * 
 * This hook:
 * - Loads progress from LocalStorage on mount (Requirement 7.3)
 * - Saves progress to LocalStorage whenever it changes (Requirements 7.1, 7.2)
 * - Provides helper functions to update progress (Requirement 7.4)
 * - Handles errors gracefully by falling back to in-memory storage
 * 
 * @returns Object containing progress data and update functions
 * 
 * @example
 * ```typescript
 * const { progress, completeLevel, updateProgress, resetProgress } = useProgress();
 * 
 * // Complete a level with 3 stars
 * completeLevel(5, 3);
 * 
 * // Update progress directly
 * updateProgress(prev => ({
 *   ...prev,
 *   soundEnabled: !prev.soundEnabled
 * }));
 * 
 * // Reset all progress
 * resetProgress();
 * 
 * // Check if a level is unlocked
 * const isLevelUnlocked = (level: number) => {
 *   return level <= progress.highestUnlockedLevel;
 * };
 * 
 * // Get stars for a level
 * const stars = progress.levelStars.get(5) ?? 0;
 * 
 * // Check if a level is completed
 * const isCompleted = progress.completedLevels.has(5);
 * ```
 */
export function useProgress(): UseProgressReturn {
  // Load progress from LocalStorage on mount
  const [progress, setProgress] = useState<ProgressData>(() => {
    return StorageManager.loadProgress();
  });

  // Save progress to LocalStorage whenever it changes
  useEffect(() => {
    StorageManager.saveProgress(progress);
  }, [progress]);

  /**
   * Mark a level as complete with a star rating
   * 
   * This function:
   * - Adds the level to completedLevels set
   * - Updates the star rating for the level (only if better than previous)
   * - Unlocks the next level if this level was the highest unlocked
   * 
   * @param level - The level number that was completed
   * @param stars - The star rating earned (1-3)
   * 
   * Validates: Requirements 7.1, 7.2, 7.4
   */
  const completeLevel = useCallback((level: number, stars: number) => {
    setProgress(prev => {
      const newCompletedLevels = new Set(prev.completedLevels);
      newCompletedLevels.add(level);

      const newLevelStars = new Map(prev.levelStars);
      // Only update stars if this is better than previous rating
      const previousStars = newLevelStars.get(level) ?? 0;
      if (stars > previousStars) {
        newLevelStars.set(level, stars);
      }

      // Unlock next level if this was the highest unlocked level
      const newHighestUnlockedLevel = level === prev.highestUnlockedLevel
        ? Math.min(level + 1, 100) // Cap at level 100
        : prev.highestUnlockedLevel;

      return {
        ...prev,
        completedLevels: newCompletedLevels,
        levelStars: newLevelStars,
        highestUnlockedLevel: newHighestUnlockedLevel,
      };
    });
  }, []);

  /**
   * Update progress data using an updater function
   * 
   * This provides a flexible way to update any part of the progress data.
   * 
   * @param updater - Function that receives previous progress and returns new progress
   * 
   * Validates: Requirement 7.4
   */
  const updateProgress = useCallback((updater: (prev: ProgressData) => ProgressData) => {
    setProgress(updater);
  }, []);

  /**
   * Reset all progress to default state
   * 
   * This clears all completed levels, stars, and resets to level 1.
   * Useful for testing or if player wants to start over.
   */
  const resetProgress = useCallback(() => {
    setProgress({
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
      soundEnabled: true,
    });
  }, []);

  return {
    progress,
    completeLevel,
    updateProgress,
    resetProgress,
  };
}
