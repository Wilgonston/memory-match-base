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

export const TOTAL_LEVELS = 100;
export const MAX_LEVEL = 100;
