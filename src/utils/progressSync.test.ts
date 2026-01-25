/**
 * Progress Synchronization Utilities Tests
 * 
 * Unit tests for progress data transformation and merging.
 */

import { describe, it, expect } from 'vitest';
import {
  localToOnChain,
  onChainToLocal,
  mergeProgress,
  extractBatchUpdateData,
  hasCompletedLevels,
  isProgressEquivalent,
} from './progressSync';
import type { ProgressData } from '../types/game';
import type { OnChainProgress } from '../types/blockchain';

describe('progressSync utilities', () => {
  describe('localToOnChain', () => {
    it('should convert local progress to on-chain format', () => {
      const local: ProgressData = {
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [3, 1],
        ]),
        highestUnlockedLevel: 3,
        soundEnabled: true,
      };

      const onChain = localToOnChain(local);

      expect(onChain.total).toBe(6);
      expect(onChain.levelStars.size).toBe(3);
      expect(onChain.levelStars.get(1)).toBe(3);
      expect(onChain.levelStars.get(2)).toBe(2);
      expect(onChain.levelStars.get(3)).toBe(1);
    });

    it('should handle empty progress', () => {
      const local: ProgressData = {
        completedLevels: new Set(),
        levelStars: new Map(),
        highestUnlockedLevel: 0,
        soundEnabled: true,
      };

      const onChain = localToOnChain(local);

      expect(onChain.total).toBe(0);
      expect(onChain.levelStars.size).toBe(0);
    });
  });

  describe('onChainToLocal', () => {
    it('should convert on-chain progress to local format', () => {
      const onChain: OnChainProgress = {
        total: 6,
        updated: 1234567890,
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [3, 1],
        ]),
      };

      const local = onChainToLocal(onChain);

      expect(local.completedLevels.size).toBe(3);
      expect(local.completedLevels.has(1)).toBe(true);
      expect(local.completedLevels.has(2)).toBe(true);
      expect(local.completedLevels.has(3)).toBe(true);
      expect(local.levelStars.get(1)).toBe(3);
      expect(local.levelStars.get(2)).toBe(2);
      expect(local.levelStars.get(3)).toBe(1);
      expect(local.highestUnlockedLevel).toBe(3);
      expect(local.soundEnabled).toBe(true);
    });
  });

  describe('mergeProgress', () => {
    it('should keep maximum stars for each level', () => {
      const local: ProgressData = {
        completedLevels: new Set([1, 2]),
        levelStars: new Map([
          [1, 2],
          [2, 3],
        ]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };

      const onChain: OnChainProgress = {
        total: 5,
        updated: 1234567890,
        levelStars: new Map([
          [1, 3],
          [3, 2],
        ]),
      };

      const merged = mergeProgress(local, onChain);

      expect(merged.levelStars.get(1)).toBe(3); // Max of 2 and 3
      expect(merged.levelStars.get(2)).toBe(3); // Only in local
      expect(merged.levelStars.get(3)).toBe(2); // Only in onChain
      expect(merged.highestUnlockedLevel).toBe(3);
    });
  });

  describe('extractBatchUpdateData', () => {
    it('should extract levels and stars arrays', () => {
      const progress: ProgressData = {
        completedLevels: new Set([1, 2, 5]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [5, 1],
        ]),
        highestUnlockedLevel: 5,
        soundEnabled: true,
      };

      const { levels, stars } = extractBatchUpdateData(progress);

      expect(levels).toEqual([1, 2, 5]);
      expect(stars).toEqual([3, 2, 1]);
    });
  });

  describe('hasCompletedLevels', () => {
    it('should return true when levels are completed', () => {
      const progress: ProgressData = {
        completedLevels: new Set([1]),
        levelStars: new Map([[1, 3]]),
        highestUnlockedLevel: 1,
        soundEnabled: true,
      };

      expect(hasCompletedLevels(progress)).toBe(true);
    });

    it('should return false when no levels are completed', () => {
      const progress: ProgressData = {
        completedLevels: new Set(),
        levelStars: new Map(),
        highestUnlockedLevel: 0,
        soundEnabled: true,
      };

      expect(hasCompletedLevels(progress)).toBe(false);
    });
  });

  describe('isProgressEquivalent', () => {
    it('should return true for equivalent progress', () => {
      const a: ProgressData = {
        completedLevels: new Set([1, 2]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
        ]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };

      const b: ProgressData = {
        completedLevels: new Set([1, 2]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
        ]),
        highestUnlockedLevel: 2,
        soundEnabled: false,
      };

      expect(isProgressEquivalent(a, b)).toBe(true);
    });

    it('should return false for different progress', () => {
      const a: ProgressData = {
        completedLevels: new Set([1, 2]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
        ]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };

      const b: ProgressData = {
        completedLevels: new Set([1, 2]),
        levelStars: new Map([
          [1, 3],
          [2, 3],
        ]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };

      expect(isProgressEquivalent(a, b)).toBe(false);
    });
  });
});
