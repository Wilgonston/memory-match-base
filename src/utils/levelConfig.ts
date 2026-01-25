/**
 * Level configuration utilities for Memory Match BASE
 * 
 * This module provides functions to generate level configurations
 * based on the level number, including grid size, time limits,
 * and move thresholds for star ratings.
 */

import type { LevelConfig } from '../types/game';

/**
 * Generate level configuration based on level number
 * 
 * Level ranges:
 * - Levels 1-25: 4x4 grid, 60 seconds, optimal 12 moves, acceptable 16 moves
 * - Levels 26-60: 6x6 grid, 90 seconds, optimal 24 moves, acceptable 32 moves
 * - Levels 61-100: 8x8 grid, 120 seconds, optimal 40 moves, acceptable 52 moves
 * 
 * @param level - Level number (1-100)
 * @returns Level configuration object
 * 
 * @example
 * ```typescript
 * const config = getLevelConfig(1);
 * // { level: 1, gridSize: 4, timeLimit: 60, optimalMoves: 12, acceptableMoves: 16 }
 * 
 * const config = getLevelConfig(50);
 * // { level: 50, gridSize: 6, timeLimit: 90, optimalMoves: 24, acceptableMoves: 32 }
 * ```
 * 
 * Requirements:
 * - 1.2: 4x4 grid for levels 1-25
 * - 1.3: 6x6 grid for levels 26-60
 * - 1.4: 8x8 grid for levels 61-100
 * - 4.2: 60 seconds for levels 1-25
 * - 4.3: 90 seconds for levels 26-60
 * - 4.4: 120 seconds for levels 61-100
 */
export function getLevelConfig(level: number): LevelConfig {
  let gridSize: 4 | 6 | 8;
  let timeLimit: number;
  let optimalMoves: number;
  let acceptableMoves: number;

  if (level <= 25) {
    // Levels 1-25: Easy difficulty
    gridSize = 4;
    timeLimit = 60;
    optimalMoves = 12;
    acceptableMoves = 16;
  } else if (level <= 60) {
    // Levels 26-60: Medium difficulty
    gridSize = 6;
    timeLimit = 90;
    optimalMoves = 24;
    acceptableMoves = 32;
  } else {
    // Levels 61-100: Hard difficulty
    gridSize = 8;
    timeLimit = 120;
    optimalMoves = 40;
    acceptableMoves = 52;
  }

  return {
    level,
    gridSize,
    timeLimit,
    optimalMoves,
    acceptableMoves,
  };
}
