/**
 * Level configuration utilities for Memory Match BASE
 * 
 * This module provides functions to generate level configurations
 * based on the level number, including grid size, time limits,
 * and move thresholds for star ratings.
 * 
 * Expanded to 300 levels to utilize all 600+ Base ecosystem projects
 */

import type { LevelConfig } from '../types/game';

/**
 * Generate level configuration based on level number
 * 
 * Level ranges (300 total levels):
 * - Levels 1-50: 4x4 grid (8 pairs), 60 seconds, optimal 12 moves, acceptable 16 moves
 * - Levels 51-100: 6x6 grid (18 pairs), 90 seconds, optimal 24 moves, acceptable 32 moves
 * - Levels 101-200: 8x8 grid (32 pairs), 120 seconds, optimal 40 moves, acceptable 52 moves
 * - Levels 201-300: 10x10 grid (50 pairs), 180 seconds, optimal 60 moves, acceptable 75 moves
 * 
 * @param level - Level number (1-300)
 * @returns Level configuration object
 * 
 * @example
 * ```typescript
 * const config = getLevelConfig(1);
 * // { level: 1, gridSize: 4, timeLimit: 60, optimalMoves: 12, acceptableMoves: 16 }
 * 
 * const config = getLevelConfig(150);
 * // { level: 150, gridSize: 8, timeLimit: 120, optimalMoves: 40, acceptableMoves: 52 }
 * 
 * const config = getLevelConfig(250);
 * // { level: 250, gridSize: 10, timeLimit: 180, optimalMoves: 60, acceptableMoves: 75 }
 * ```
 */
export function getLevelConfig(level: number): LevelConfig {
  let gridSize: 4 | 6 | 8 | 10;
  let timeLimit: number;
  let optimalMoves: number;
  let acceptableMoves: number;

  if (level <= 50) {
    // Levels 1-50: Easy difficulty (4x4 = 8 pairs)
    gridSize = 4;
    timeLimit = 60;
    optimalMoves = 12;
    acceptableMoves = 16;
  } else if (level <= 100) {
    // Levels 51-100: Medium difficulty (6x6 = 18 pairs)
    gridSize = 6;
    timeLimit = 90;
    optimalMoves = 24;
    acceptableMoves = 32;
  } else if (level <= 200) {
    // Levels 101-200: Hard difficulty (8x8 = 32 pairs)
    gridSize = 8;
    timeLimit = 120;
    optimalMoves = 40;
    acceptableMoves = 52;
  } else {
    // Levels 201-300: Expert difficulty (10x10 = 50 pairs)
    gridSize = 10;
    timeLimit = 180;
    optimalMoves = 60;
    acceptableMoves = 75;
  }

  return {
    level,
    gridSize,
    timeLimit,
    optimalMoves,
    acceptableMoves,
  };
}

/**
 * Get total number of levels
 */
export const TOTAL_LEVELS = 300;

/**
 * Get maximum level number
 */
export const MAX_LEVEL = 300;
