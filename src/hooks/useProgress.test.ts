/**
 * Unit tests for useProgress hook
 * 
 * Tests the progress management functionality including:
 * - Loading progress on mount
 * - Saving progress on updates
 * - Completing levels
 * - Updating progress
 * - Resetting progress
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from './useProgress';
import { StorageManager } from '../utils/storage';

// Mock the StorageManager
vi.mock('../utils/storage', () => ({
  StorageManager: {
    loadProgress: vi.fn(),
    saveProgress: vi.fn(),
  },
}));

describe('useProgress', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(StorageManager.loadProgress).mockReturnValue({
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
      soundEnabled: true,
    });
  });

  describe('initialization', () => {
    it('should load progress from StorageManager on mount', () => {
      const mockProgress = {
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([[1, 3], [2, 2], [3, 3]]),
        highestUnlockedLevel: 4,
        soundEnabled: false,
      };
      
      vi.mocked(StorageManager.loadProgress).mockReturnValue(mockProgress);

      const { result } = renderHook(() => useProgress());

      expect(StorageManager.loadProgress).toHaveBeenCalledTimes(1);
      expect(result.current.progress).toEqual(mockProgress);
    });

    it('should start with default progress if storage is empty', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.progress.completedLevels.size).toBe(0);
      expect(result.current.progress.levelStars.size).toBe(0);
      expect(result.current.progress.highestUnlockedLevel).toBe(1);
      expect(result.current.progress.soundEnabled).toBe(true);
    });
  });

  describe('completeLevel', () => {
    it('should add level to completedLevels', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(1, 3);
      });

      expect(result.current.progress.completedLevels.has(1)).toBe(true);
    });

    it('should set star rating for completed level', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(1, 3);
      });

      expect(result.current.progress.levelStars.get(1)).toBe(3);
    });

    it('should unlock next level when completing highest unlocked level', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.progress.highestUnlockedLevel).toBe(1);

      act(() => {
        result.current.completeLevel(1, 2);
      });

      expect(result.current.progress.highestUnlockedLevel).toBe(2);
    });

    it('should not unlock next level when completing a lower level', () => {
      vi.mocked(StorageManager.loadProgress).mockReturnValue({
        completedLevels: new Set([1, 2]),
        levelStars: new Map([[1, 3], [2, 2]]),
        highestUnlockedLevel: 5,
        soundEnabled: true,
      });

      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(3, 3);
      });

      expect(result.current.progress.highestUnlockedLevel).toBe(5);
    });

    it('should cap highest unlocked level at 100', () => {
      vi.mocked(StorageManager.loadProgress).mockReturnValue({
        completedLevels: new Set([99]),
        levelStars: new Map([[99, 3]]),
        highestUnlockedLevel: 100,
        soundEnabled: true,
      });

      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(100, 3);
      });

      expect(result.current.progress.highestUnlockedLevel).toBe(100);
    });

    it('should only update stars if new rating is better', () => {
      const { result } = renderHook(() => useProgress());

      // Complete level with 3 stars
      act(() => {
        result.current.completeLevel(1, 3);
      });

      expect(result.current.progress.levelStars.get(1)).toBe(3);

      // Try to complete with 2 stars (should not update)
      act(() => {
        result.current.completeLevel(1, 2);
      });

      expect(result.current.progress.levelStars.get(1)).toBe(3);
    });

    it('should update stars if new rating is better', () => {
      const { result } = renderHook(() => useProgress());

      // Complete level with 1 star
      act(() => {
        result.current.completeLevel(1, 1);
      });

      expect(result.current.progress.levelStars.get(1)).toBe(1);

      // Complete with 3 stars (should update)
      act(() => {
        result.current.completeLevel(1, 3);
      });

      expect(result.current.progress.levelStars.get(1)).toBe(3);
    });

    it('should save progress after completing level', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(1, 3);
      });

      // Wait for useEffect to run
      expect(StorageManager.saveProgress).toHaveBeenCalled();
    });
  });

  describe('updateProgress', () => {
    it('should update progress using updater function', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.updateProgress(prev => ({
          ...prev,
          soundEnabled: false,
        }));
      });

      expect(result.current.progress.soundEnabled).toBe(false);
    });

    it('should save progress after update', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.updateProgress(prev => ({
          ...prev,
          soundEnabled: false,
        }));
      });

      expect(StorageManager.saveProgress).toHaveBeenCalled();
    });

    it('should allow complex updates', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.updateProgress(prev => {
          const newLevelStars = new Map(prev.levelStars);
          newLevelStars.set(5, 2);
          newLevelStars.set(6, 3);
          
          return {
            ...prev,
            levelStars: newLevelStars,
            highestUnlockedLevel: 7,
          };
        });
      });

      expect(result.current.progress.levelStars.get(5)).toBe(2);
      expect(result.current.progress.levelStars.get(6)).toBe(3);
      expect(result.current.progress.highestUnlockedLevel).toBe(7);
    });
  });

  describe('resetProgress', () => {
    it('should reset all progress to default state', () => {
      vi.mocked(StorageManager.loadProgress).mockReturnValue({
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([[1, 3], [2, 2], [3, 3]]),
        highestUnlockedLevel: 4,
        soundEnabled: false,
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.progress.completedLevels.size).toBe(3);

      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progress.completedLevels.size).toBe(0);
      expect(result.current.progress.levelStars.size).toBe(0);
      expect(result.current.progress.highestUnlockedLevel).toBe(1);
      expect(result.current.progress.soundEnabled).toBe(true);
    });

    it('should save progress after reset', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.resetProgress();
      });

      expect(StorageManager.saveProgress).toHaveBeenCalled();
    });
  });

  describe('persistence', () => {
    it('should save progress whenever it changes', () => {
      const { result } = renderHook(() => useProgress());

      // Clear initial save call
      vi.clearAllMocks();

      act(() => {
        result.current.completeLevel(1, 3);
      });

      expect(StorageManager.saveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          completedLevels: expect.any(Set),
          levelStars: expect.any(Map),
          highestUnlockedLevel: 2,
          soundEnabled: true,
        })
      );
    });

    it('should handle multiple rapid updates', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeLevel(1, 3);
        result.current.completeLevel(2, 2);
        result.current.completeLevel(3, 3);
      });

      expect(result.current.progress.completedLevels.size).toBe(3);
      expect(result.current.progress.levelStars.size).toBe(3);
    });
  });
});
