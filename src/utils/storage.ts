/**
 * Storage manager for LocalStorage operations
 * Handles saving and loading game progress with graceful error handling
 */

import type { ProgressData } from '../types/game';

/**
 * StorageManager class for managing game progress persistence
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export class StorageManager {
  private static readonly STORAGE_KEY = 'memory-match-base-progress';

  /**
   * Save progress to LocalStorage
   * Handles errors gracefully by logging and continuing
   * 
   * @param progress - The progress data to save
   * 
   * Validates: Requirements 7.1, 7.2, 7.4, 7.5
   */
  static saveProgress(progress: ProgressData): void {
    try {
      // Serialize Sets and Maps to arrays for JSON storage
      const serialized = {
        completedLevels: Array.from(progress.completedLevels),
        levelStars: Array.from(progress.levelStars.entries()),
        highestUnlockedLevel: progress.highestUnlockedLevel,
        soundEnabled: progress.soundEnabled,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      // Gracefully handle LocalStorage errors (quota exceeded, private browsing, etc.)
      console.error('Failed to save progress:', error);
      // Application continues with in-memory storage
    }
  }

  /**
   * Load progress from LocalStorage
   * Returns default progress if storage is unavailable or data is corrupted
   * 
   * @returns The loaded progress data or default progress
   * 
   * Validates: Requirements 7.3, 7.4, 7.6
   */
  static loadProgress(): ProgressData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultProgress();
      }

      const parsed = JSON.parse(stored);
      
      // Deserialize arrays back to Sets and Maps
      return {
        completedLevels: new Set(parsed.completedLevels),
        levelStars: new Map(parsed.levelStars),
        highestUnlockedLevel: parsed.highestUnlockedLevel,
        soundEnabled: parsed.soundEnabled ?? true, // Default to true if not present
      };
    } catch (error) {
      // Gracefully handle LocalStorage errors or corrupted data
      console.error('Failed to load progress:', error);
      return this.getDefaultProgress();
    }
  }

  /**
   * Get default progress data for new players
   * 
   * @returns Default progress data with level 1 unlocked
   * 
   * @private
   */
  private static getDefaultProgress(): ProgressData {
    return {
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
      soundEnabled: true,
    };
  }
}
