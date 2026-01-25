/**
 * Unit tests for StorageManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from './storage';
import type { ProgressData } from '../types/game';

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveProgress', () => {
    it('should save progress to localStorage', () => {
      const progress: ProgressData = {
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [3, 1],
        ]),
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };

      StorageManager.saveProgress(progress);

      const stored = localStorage.getItem('memory-match-base-progress');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.completedLevels).toEqual([1, 2, 3]);
      expect(parsed.levelStars).toEqual([
        [1, 3],
        [2, 2],
        [3, 1],
      ]);
      expect(parsed.highestUnlockedLevel).toBe(4);
      expect(parsed.soundEnabled).toBe(true);
    });

    it('should handle empty progress data', () => {
      const progress: ProgressData = {
        completedLevels: new Set(),
        levelStars: new Map(),
        highestUnlockedLevel: 1,
        soundEnabled: false,
      };

      StorageManager.saveProgress(progress);

      const stored = localStorage.getItem('memory-match-base-progress');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.completedLevels).toEqual([]);
      expect(parsed.levelStars).toEqual([]);
      expect(parsed.highestUnlockedLevel).toBe(1);
      expect(parsed.soundEnabled).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const progress: ProgressData = {
        completedLevels: new Set([1]),
        levelStars: new Map([[1, 3]]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };

      // Should not throw
      expect(() => StorageManager.saveProgress(progress)).not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save progress:',
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadProgress', () => {
    it('should load progress from localStorage', () => {
      const data = {
        completedLevels: [1, 2, 3],
        levelStars: [
          [1, 3],
          [2, 2],
          [3, 1],
        ],
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };

      localStorage.setItem('memory-match-base-progress', JSON.stringify(data));

      const progress = StorageManager.loadProgress();

      expect(progress.completedLevels).toEqual(new Set([1, 2, 3]));
      expect(progress.levelStars).toEqual(
        new Map([
          [1, 3],
          [2, 2],
          [3, 1],
        ])
      );
      expect(progress.highestUnlockedLevel).toBe(4);
      expect(progress.soundEnabled).toBe(true);
    });

    it('should return default progress when localStorage is empty', () => {
      const progress = StorageManager.loadProgress();

      expect(progress.completedLevels).toEqual(new Set());
      expect(progress.levelStars).toEqual(new Map());
      expect(progress.highestUnlockedLevel).toBe(1);
      expect(progress.soundEnabled).toBe(true);
    });

    it('should default soundEnabled to true if not present', () => {
      const data = {
        completedLevels: [1],
        levelStars: [[1, 3]],
        highestUnlockedLevel: 2,
        // soundEnabled is missing
      };

      localStorage.setItem('memory-match-base-progress', JSON.stringify(data));

      const progress = StorageManager.loadProgress();

      expect(progress.soundEnabled).toBe(true);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('memory-match-base-progress', 'invalid json {');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const progress = StorageManager.loadProgress();

      // Should return default progress
      expect(progress.completedLevels).toEqual(new Set());
      expect(progress.levelStars).toEqual(new Map());
      expect(progress.highestUnlockedLevel).toBe(1);
      expect(progress.soundEnabled).toBe(true);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load progress:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage.getItem errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('SecurityError');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const progress = StorageManager.loadProgress();

      // Should return default progress
      expect(progress.completedLevels).toEqual(new Set());
      expect(progress.levelStars).toEqual(new Map());
      expect(progress.highestUnlockedLevel).toBe(1);
      expect(progress.soundEnabled).toBe(true);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load progress:',
        expect.any(Error)
      );

      getItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('round-trip persistence', () => {
    it('should preserve data through save and load cycle', () => {
      const originalProgress: ProgressData = {
        completedLevels: new Set([1, 2, 3, 5, 10]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [3, 1],
          [5, 3],
          [10, 2],
        ]),
        highestUnlockedLevel: 11,
        soundEnabled: false,
      };

      StorageManager.saveProgress(originalProgress);
      const loadedProgress = StorageManager.loadProgress();

      expect(loadedProgress.completedLevels).toEqual(originalProgress.completedLevels);
      expect(loadedProgress.levelStars).toEqual(originalProgress.levelStars);
      expect(loadedProgress.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
      expect(loadedProgress.soundEnabled).toBe(originalProgress.soundEnabled);
    });

    it('should handle large progress data', () => {
      const completedLevels = new Set<number>();
      const levelStars = new Map<number, number>();

      // Complete all 100 levels
      for (let i = 1; i <= 100; i++) {
        completedLevels.add(i);
        levelStars.set(i, (i % 3) + 1); // Stars 1-3
      }

      const originalProgress: ProgressData = {
        completedLevels,
        levelStars,
        highestUnlockedLevel: 100,
        soundEnabled: true,
      };

      StorageManager.saveProgress(originalProgress);
      const loadedProgress = StorageManager.loadProgress();

      expect(loadedProgress.completedLevels.size).toBe(100);
      expect(loadedProgress.levelStars.size).toBe(100);
      expect(loadedProgress.highestUnlockedLevel).toBe(100);
      expect(loadedProgress.soundEnabled).toBe(true);
    });
  });

  describe('LocalStorage error handling - Requirement 7.6', () => {
    it('should continue with in-memory storage when localStorage is completely unavailable', () => {
      // Mock both setItem and getItem to throw errors (simulating private browsing mode)
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      setItemSpy.mockImplementation(() => {
        throw new Error('SecurityError: localStorage is not available');
      });
      
      getItemSpy.mockImplementation(() => {
        throw new Error('SecurityError: localStorage is not available');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Attempt to save progress - should not throw
      const progress: ProgressData = {
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([[1, 3], [2, 2], [3, 1]]),
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };

      expect(() => StorageManager.saveProgress(progress)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save progress:',
        expect.any(Error)
      );

      // Attempt to load progress - should return default progress and not throw
      const loadedProgress = StorageManager.loadProgress();
      
      expect(loadedProgress).toBeDefined();
      expect(loadedProgress.completedLevels).toEqual(new Set());
      expect(loadedProgress.levelStars).toEqual(new Map());
      expect(loadedProgress.highestUnlockedLevel).toBe(1);
      expect(loadedProgress.soundEnabled).toBe(true);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load progress:',
        expect.any(Error)
      );

      // Verify app can continue functioning with in-memory storage
      // The app should be able to work with the returned default progress
      expect(typeof loadedProgress.highestUnlockedLevel).toBe('number');
      expect(loadedProgress.completedLevels).toBeInstanceOf(Set);
      expect(loadedProgress.levelStars).toBeInstanceOf(Map);

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle quota exceeded errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const largeProgress: ProgressData = {
        completedLevels: new Set(Array.from({ length: 100 }, (_, i) => i + 1)),
        levelStars: new Map(Array.from({ length: 100 }, (_, i) => [i + 1, 3])),
        highestUnlockedLevel: 100,
        soundEnabled: true,
      };

      // Should not throw even with quota exceeded
      expect(() => StorageManager.saveProgress(largeProgress)).not.toThrow();
      
      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save progress:',
        expect.objectContaining({ name: 'QuotaExceededError' })
      );

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle private browsing mode gracefully', () => {
      // In private browsing mode, localStorage might exist but throw on access
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      const privateBrowsingError = new Error('Failed to read the \'localStorage\' property from \'Window\': Access is denied for this document.');
      
      setItemSpy.mockImplementation(() => {
        throw privateBrowsingError;
      });
      
      getItemSpy.mockImplementation(() => {
        throw privateBrowsingError;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const progress: ProgressData = {
        completedLevels: new Set([1]),
        levelStars: new Map([[1, 3]]),
        highestUnlockedLevel: 2,
        soundEnabled: false,
      };

      // Save should not throw
      expect(() => StorageManager.saveProgress(progress)).not.toThrow();

      // Load should return default progress and not throw
      const loadedProgress = StorageManager.loadProgress();
      expect(loadedProgress).toBeDefined();
      expect(loadedProgress.highestUnlockedLevel).toBe(1);

      // Both operations should have logged errors
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should allow app to continue with multiple save/load cycles when localStorage fails', () => {
      // Simulate localStorage being unavailable throughout the session
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate multiple game sessions
      for (let i = 0; i < 5; i++) {
        const progress: ProgressData = {
          completedLevels: new Set([i + 1]),
          levelStars: new Map([[i + 1, 3]]),
          highestUnlockedLevel: i + 2,
          soundEnabled: true,
        };

        // Each save should not throw
        expect(() => StorageManager.saveProgress(progress)).not.toThrow();

        // Each load should return default progress and not throw
        const loaded = StorageManager.loadProgress();
        expect(loaded).toBeDefined();
        expect(loaded.highestUnlockedLevel).toBe(1); // Always returns default
      }

      // Verify errors were logged but app continued
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});

// Property-Based Tests
import * as fc from 'fast-check';

describe('StorageManager - Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Property 8: Progress Persistence Round Trip - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**', () => {
    it('should preserve all data through save and load cycle for any valid ProgressData', () => {
      fc.assert(
        fc.property(
          // Generate random ProgressData
          fc.record({
            // Generate a set of completed levels (0 to 100 levels)
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 0, maxLength: 100 }
            ).map(arr => new Set(arr)),
            
            // Generate a map of level stars (level -> stars 1-3)
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }), // level number
                fc.integer({ min: 1, max: 3 })    // stars (1-3)
              ),
              { minLength: 0, maxLength: 100 }
            ).map(arr => new Map(arr)),
            
            // Generate highest unlocked level (1 to 100)
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            
            // Generate sound enabled boolean
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            // Save the progress
            StorageManager.saveProgress(originalProgress);
            
            // Load the progress
            const loadedProgress = StorageManager.loadProgress();
            
            // Property 8a: completedLevels should be equivalent
            expect(loadedProgress.completedLevels).toEqual(originalProgress.completedLevels);
            expect(loadedProgress.completedLevels.size).toBe(originalProgress.completedLevels.size);
            
            // Verify each completed level is preserved
            originalProgress.completedLevels.forEach(level => {
              expect(loadedProgress.completedLevels.has(level)).toBe(true);
            });
            
            // Property 8b: levelStars should be equivalent
            expect(loadedProgress.levelStars).toEqual(originalProgress.levelStars);
            expect(loadedProgress.levelStars.size).toBe(originalProgress.levelStars.size);
            
            // Verify each level's stars are preserved
            originalProgress.levelStars.forEach((stars, level) => {
              expect(loadedProgress.levelStars.get(level)).toBe(stars);
            });
            
            // Property 8c: highestUnlockedLevel should be preserved
            expect(loadedProgress.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
            
            // Property 8d: soundEnabled should be preserved
            expect(loadedProgress.soundEnabled).toBe(originalProgress.soundEnabled);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should handle empty progress data correctly', () => {
      fc.assert(
        fc.property(
          // Generate ProgressData with empty collections
          fc.record({
            completedLevels: fc.constant(new Set<number>()),
            levelStars: fc.constant(new Map<number, number>()),
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            StorageManager.saveProgress(originalProgress);
            const loadedProgress = StorageManager.loadProgress();
            
            // Empty sets and maps should be preserved
            expect(loadedProgress.completedLevels.size).toBe(0);
            expect(loadedProgress.levelStars.size).toBe(0);
            expect(loadedProgress.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
            expect(loadedProgress.soundEnabled).toBe(originalProgress.soundEnabled);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle maximum progress data (all 100 levels completed)', () => {
      fc.assert(
        fc.property(
          // Generate ProgressData with all levels completed
          fc.record({
            completedLevels: fc.constant(new Set(Array.from({ length: 100 }, (_, i) => i + 1))),
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 3 })
              ),
              { minLength: 100, maxLength: 100 }
            ).map(arr => {
              // Ensure all 100 levels have stars
              const map = new Map<number, number>();
              for (let i = 1; i <= 100; i++) {
                map.set(i, arr[i - 1][1]);
              }
              return map;
            }),
            highestUnlockedLevel: fc.constant(100),
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            StorageManager.saveProgress(originalProgress);
            const loadedProgress = StorageManager.loadProgress();
            
            // All 100 levels should be preserved
            expect(loadedProgress.completedLevels.size).toBe(100);
            expect(loadedProgress.levelStars.size).toBe(100);
            expect(loadedProgress.highestUnlockedLevel).toBe(100);
            
            // Verify all levels are present
            for (let i = 1; i <= 100; i++) {
              expect(loadedProgress.completedLevels.has(i)).toBe(true);
              expect(loadedProgress.levelStars.has(i)).toBe(true);
              expect(loadedProgress.levelStars.get(i)).toBe(originalProgress.levelStars.get(i));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve data types correctly (Set and Map)', () => {
      fc.assert(
        fc.property(
          fc.record({
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Set(arr)),
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 3 })
              ),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Map(arr)),
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            StorageManager.saveProgress(originalProgress);
            const loadedProgress = StorageManager.loadProgress();
            
            // Verify types are correct after round trip
            expect(loadedProgress.completedLevels).toBeInstanceOf(Set);
            expect(loadedProgress.levelStars).toBeInstanceOf(Map);
            expect(typeof loadedProgress.highestUnlockedLevel).toBe('number');
            expect(typeof loadedProgress.soundEnabled).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle duplicate levels in completedLevels (Set behavior)', () => {
      fc.assert(
        fc.property(
          // Generate arrays with potential duplicates, then convert to Set
          fc.array(
            fc.integer({ min: 1, max: 20 }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.boolean(),
          
          (levelsArray, soundEnabled) => {
            const originalProgress: ProgressData = {
              completedLevels: new Set(levelsArray), // Set removes duplicates
              levelStars: new Map(levelsArray.map(level => [level, (level % 3) + 1])),
              highestUnlockedLevel: Math.max(...levelsArray, 1),
              soundEnabled,
            };
            
            StorageManager.saveProgress(originalProgress);
            const loadedProgress = StorageManager.loadProgress();
            
            // Set should preserve uniqueness
            expect(loadedProgress.completedLevels.size).toBe(originalProgress.completedLevels.size);
            expect(loadedProgress.completedLevels).toEqual(originalProgress.completedLevels);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle star values within valid range (1-3)', () => {
      fc.assert(
        fc.property(
          fc.record({
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 1, maxLength: 50 }
            ).map(arr => new Set(arr)),
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 3 }) // Stars must be 1-3
              ),
              { minLength: 1, maxLength: 50 }
            ).map(arr => new Map(arr)),
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            StorageManager.saveProgress(originalProgress);
            const loadedProgress = StorageManager.loadProgress();
            
            // Verify all star values are in valid range
            loadedProgress.levelStars.forEach((stars, level) => {
              expect(stars).toBeGreaterThanOrEqual(1);
              expect(stars).toBeLessThanOrEqual(3);
              expect(originalProgress.levelStars.get(level)).toBe(stars);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (multiple save/load cycles preserve data)', () => {
      fc.assert(
        fc.property(
          fc.record({
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 0, maxLength: 30 }
            ).map(arr => new Set(arr)),
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 3 })
              ),
              { minLength: 0, maxLength: 30 }
            ).map(arr => new Map(arr)),
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            soundEnabled: fc.boolean(),
          }),
          
          (originalProgress) => {
            // First save/load cycle
            StorageManager.saveProgress(originalProgress);
            const firstLoad = StorageManager.loadProgress();
            
            // Second save/load cycle (save what we just loaded)
            StorageManager.saveProgress(firstLoad);
            const secondLoad = StorageManager.loadProgress();
            
            // Third save/load cycle
            StorageManager.saveProgress(secondLoad);
            const thirdLoad = StorageManager.loadProgress();
            
            // All loads should be equivalent to original
            expect(firstLoad.completedLevels).toEqual(originalProgress.completedLevels);
            expect(secondLoad.completedLevels).toEqual(originalProgress.completedLevels);
            expect(thirdLoad.completedLevels).toEqual(originalProgress.completedLevels);
            
            expect(firstLoad.levelStars).toEqual(originalProgress.levelStars);
            expect(secondLoad.levelStars).toEqual(originalProgress.levelStars);
            expect(thirdLoad.levelStars).toEqual(originalProgress.levelStars);
            
            expect(firstLoad.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
            expect(secondLoad.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
            expect(thirdLoad.highestUnlockedLevel).toBe(originalProgress.highestUnlockedLevel);
            
            expect(firstLoad.soundEnabled).toBe(originalProgress.soundEnabled);
            expect(secondLoad.soundEnabled).toBe(originalProgress.soundEnabled);
            expect(thirdLoad.soundEnabled).toBe(originalProgress.soundEnabled);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
