/**
 * Custom hook for timer logic
 * 
 * This hook provides a clean interface for managing countdown timer functionality.
 * It handles countdown, pause, resume, and triggers a callback when the timer
 * reaches zero.
 * 
 * Requirements:
 * - 4.1: Timer countdown from allocated time
 * - 4.5: Trigger callback when timer reaches zero
 * - 4.6: Stop timer when game ends
 * 
 * @example
 * ```typescript
 * function GameBoard() {
 *   const { timeRemaining, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer({
 *     onTimerEnd: () => {
 *       console.log('Time is up!');
 *       dispatch({ type: 'FAIL_LEVEL' });
 *     }
 *   });
 *   
 *   useEffect(() => {
 *     startTimer(60); // Start 60 second countdown
 *   }, []);
 *   
 *   return <div>Time: {formatTime(timeRemaining)}</div>;
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Configuration options for useTimer hook
 */
export interface UseTimerOptions {
  /** Callback function to call when timer reaches zero */
  onTimerEnd?: () => void;
  /** Interval in milliseconds for timer updates (default: 1000ms) */
  interval?: number;
}

/**
 * Return type for useTimer hook
 */
export interface UseTimerReturn {
  /** Current time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Start the timer with initial time in seconds */
  startTimer: (initialTime: number) => void;
  /** Pause the timer */
  pauseTimer: () => void;
  /** Resume the timer */
  resumeTimer: () => void;
  /** Stop the timer completely */
  stopTimer: () => void;
  /** Reset the timer to a new time */
  resetTimer: (newTime: number) => void;
}

/**
 * Custom hook for managing countdown timer
 * 
 * This hook:
 * - Counts down from an initial time value (Requirement 4.1)
 * - Supports pause and resume functionality
 * - Calls a callback when timer reaches zero (Requirement 4.5)
 * - Can be stopped when game ends (Requirement 4.6)
 * - Uses setInterval for consistent countdown
 * - Cleans up interval on unmount
 * 
 * @param options - Configuration options for the timer
 * @returns Object containing timer state and control functions
 * 
 * @example
 * ```typescript
 * const { timeRemaining, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer({
 *   onTimerEnd: () => {
 *     alert('Time is up!');
 *   }
 * });
 * 
 * // Start a 60 second countdown
 * startTimer(60);
 * 
 * // Pause the timer
 * pauseTimer();
 * 
 * // Resume the timer
 * resumeTimer();
 * 
 * // Stop the timer completely
 * stopTimer();
 * 
 * // Reset to a new time
 * resetTimer(30);
 * ```
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onTimerEnd, interval = 1000 } = options;

  // State
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Refs to store callback and interval ID
  const onTimerEndRef = useRef(onTimerEnd);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when it changes
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  /**
   * Start the timer with an initial time
   * 
   * @param initialTime - Initial time in seconds
   */
  const startTimer = useCallback((initialTime: number) => {
    setTimeRemaining(initialTime);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  /**
   * Pause the timer
   * 
   * Keeps the current time but stops countdown
   */
  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume the timer
   * 
   * Continues countdown from current time
   */
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Stop the timer completely
   * 
   * Stops countdown and resets running state
   */
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  /**
   * Reset the timer to a new time
   * 
   * @param newTime - New time in seconds
   */
  const resetTimer = useCallback((newTime: number) => {
    setTimeRemaining(newTime);
  }, []);

  // Effect to handle countdown
  useEffect(() => {
    // Clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Only run interval if timer is running and not paused
    if (isRunning && !isPaused) {
      intervalIdRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);

          // Call callback when timer reaches zero
          if (newTime === 0 && prev > 0) {
            onTimerEndRef.current?.();
          }

          return newTime;
        });
      }, interval);
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRunning, isPaused, interval]);

  // Stop timer when time reaches zero
  useEffect(() => {
    if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
    }
  }, [timeRemaining, isRunning]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  };
}
