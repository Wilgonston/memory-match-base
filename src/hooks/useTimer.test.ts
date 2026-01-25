/**
 * Unit tests for useTimer hook
 * 
 * Tests the timer functionality including countdown, pause, resume, and callbacks.
 * 
 * Requirements tested:
 * - 4.1: Timer countdown from allocated time
 * - 4.5: Trigger callback when timer reaches zero
 * - 4.6: Stop timer when game ends
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTimer());

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });

    it('should start timer with initial time (Requirement 4.1)', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it('should countdown from initial time (Requirement 4.1)', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      expect(result.current.timeRemaining).toBe(10);

      // Advance time by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(9);

      // Advance time by 3 more seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(6);
    });

    it('should stop at zero and not go negative', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(2);
      });

      expect(result.current.timeRemaining).toBe(2);

      // Advance time by 3 seconds (more than initial time)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Pause and resume functionality', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);

      // Pause the timer
      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.isPaused).toBe(true);

      // Advance time while paused
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Time should not have changed
      expect(result.current.timeRemaining).toBe(8);
    });

    it('should resume the timer from paused state', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);

      // Pause the timer
      act(() => {
        result.current.pauseTimer();
      });

      // Resume the timer
      act(() => {
        result.current.resumeTimer();
      });

      expect(result.current.isPaused).toBe(false);

      // Countdown should continue
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(6);
    });

    it('should handle multiple pause/resume cycles', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(20);
      });

      // Countdown for 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.timeRemaining).toBe(17);

      // Pause
      act(() => {
        result.current.pauseTimer();
      });

      // Time doesn't change while paused
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.timeRemaining).toBe(17);

      // Resume
      act(() => {
        result.current.resumeTimer();
      });

      // Countdown continues
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.timeRemaining).toBe(15);

      // Pause again
      act(() => {
        result.current.pauseTimer();
      });

      // Time doesn't change while paused
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.timeRemaining).toBe(15);

      // Resume again
      act(() => {
        result.current.resumeTimer();
      });

      // Countdown continues
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.timeRemaining).toBe(10);
    });
  });

  describe('Stop functionality (Requirement 4.6)', () => {
    it('should stop the timer completely', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);
      expect(result.current.isRunning).toBe(true);

      // Stop the timer
      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);

      // Time should not change after stopping
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(8);
    });

    it('should allow restarting after stop', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);

      // Stop the timer
      act(() => {
        result.current.stopTimer();
      });

      // Start a new timer
      act(() => {
        result.current.startTimer(15);
      });

      expect(result.current.timeRemaining).toBe(15);
      expect(result.current.isRunning).toBe(true);

      // Countdown should work
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(12);
    });
  });

  describe('Reset functionality', () => {
    it('should reset timer to new time', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      // Countdown for 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(7);

      // Reset to new time
      act(() => {
        result.current.resetTimer(20);
      });

      expect(result.current.timeRemaining).toBe(20);
      expect(result.current.isRunning).toBe(true); // Should still be running

      // Countdown should continue from new time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(18);
    });
  });

  describe('Callback functionality (Requirement 4.5)', () => {
    it('should call onTimerEnd when timer reaches zero', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd }));

      act(() => {
        result.current.startTimer(3);
      });

      expect(onTimerEnd).not.toHaveBeenCalled();

      // Countdown to zero
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onTimerEnd).toHaveBeenCalledTimes(1);
      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });

    it('should not call onTimerEnd when timer is stopped before reaching zero', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd }));

      act(() => {
        result.current.startTimer(5);
      });

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(3);

      // Stop the timer
      act(() => {
        result.current.stopTimer();
      });

      // Advance time past when timer would have ended
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Callback should not have been called
      expect(onTimerEnd).not.toHaveBeenCalled();
    });

    it('should not call onTimerEnd when timer is paused at zero', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd }));

      act(() => {
        result.current.startTimer(2);
      });

      // Countdown for 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Pause before reaching zero
      act(() => {
        result.current.pauseTimer();
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Callback should not have been called
      expect(onTimerEnd).not.toHaveBeenCalled();
      expect(result.current.timeRemaining).toBe(1);
    });

    it('should handle callback updates', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onTimerEnd }) => useTimer({ onTimerEnd }),
        { initialProps: { onTimerEnd: callback1 } }
      );

      act(() => {
        result.current.startTimer(2);
      });

      // Update callback
      rerender({ onTimerEnd: callback2 });

      // Countdown to zero
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback2).toHaveBeenCalledTimes(1);
      // Old callback should not have been called
      expect(callback1).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle starting timer with zero time', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd }));

      act(() => {
        result.current.startTimer(0);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });

    it('should handle negative initial time', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(-5);
      });

      expect(result.current.timeRemaining).toBe(-5);

      // Countdown should still work (will go to 0 and stop)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(0);
    });

    it('should handle rapid start/stop cycles', () => {
      const { result } = renderHook(() => useTimer());

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.startTimer(10);
        });

        act(() => {
          vi.advanceTimersByTime(500);
        });

        act(() => {
          result.current.stopTimer();
        });
      }

      // Should be in stopped state
      expect(result.current.isRunning).toBe(false);
    });

    it('should cleanup interval on unmount', () => {
      const { result, unmount } = renderHook(() => useTimer());

      act(() => {
        result.current.startTimer(10);
      });

      expect(result.current.isRunning).toBe(true);

      // Unmount the hook
      unmount();

      // No errors should occur
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });
  });

  describe('Custom interval', () => {
    it('should support custom interval', () => {
      const { result } = renderHook(() => useTimer({ interval: 500 }));

      act(() => {
        result.current.startTimer(10);
      });

      expect(result.current.timeRemaining).toBe(10);

      // Advance by 500ms (custom interval)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.timeRemaining).toBe(9);

      // Advance by another 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.timeRemaining).toBe(8);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical game timer scenario (Requirement 4.1, 4.5, 4.6)', () => {
      const onLevelFail = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd: onLevelFail }));

      // Start level with 60 seconds (level 1-25)
      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.isRunning).toBe(true);

      // Player plays for 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.timeRemaining).toBe(30);

      // Player pauses the game
      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.isPaused).toBe(true);

      // Time passes while paused (5 seconds)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(30); // Should not change

      // Player resumes
      act(() => {
        result.current.resumeTimer();
      });

      expect(result.current.isPaused).toBe(false);

      // Player continues playing until time runs out
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);

      // Level fail callback should be called
      expect(onLevelFail).toHaveBeenCalledTimes(1);
    });

    it('should handle level completion before timer ends (Requirement 4.6)', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimerEnd }));

      // Start level with 60 seconds
      act(() => {
        result.current.startTimer(60);
      });

      // Player plays for 20 seconds
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      expect(result.current.timeRemaining).toBe(40);

      // Player completes level - stop timer
      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.isRunning).toBe(false);

      // Advance time past when timer would have ended
      act(() => {
        vi.advanceTimersByTime(50000);
      });

      // Callback should not be called
      expect(onTimerEnd).not.toHaveBeenCalled();
      expect(result.current.timeRemaining).toBe(40); // Time frozen at completion
    });
  });
});
