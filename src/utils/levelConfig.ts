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
 * Level ranges with smooth difficulty progression:
 * - Levels 1-25: 4x4 grid (16 cards), 90 seconds
 * - Levels 26-35: 6x6 grid (36 cards), 120 seconds (transition period - easier)
 * - Levels 36-60: 6x6 grid (36 cards), 150 seconds (standard difficulty)
 * - Levels 61-75: 8x8 grid (64 cards), 180 seconds (transition period - easier)
 * - Levels 76-100: 8x8 grid (64 cards), 240 seconds (full difficulty)
 * 
 * This creates smoother transitions:
 * - Level 25→26: 90s → 120s (+30s, not +60s)
 * - Level 35→36: 120s → 150s (+30s)
 * - Level 60→61: 150s → 180s (+30s, not +90s)
 * - Level 75→76: 180s → 240s (+60s)
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
    // Levels 1-25: Easy difficulty (16 cards)
    gridSize = 4;
    timeLimit = 90;
    optimalMoves = 12;
    acceptableMoves = 16;
  } else if (level <= 35) {
    // Levels 26-35: Medium difficulty - TRANSITION (36 cards, easier time)
    gridSize = 6;
    timeLimit = 120; // Easier transition from 4x4
    optimalMoves = 24;
    acceptableMoves = 32;
  } else if (level <= 60) {
    // Levels 36-60: Medium difficulty - STANDARD (36 cards)
    gridSize = 6;
    timeLimit = 150; // Standard difficulty
    optimalMoves = 24;
    acceptableMoves = 32;
  } else if (level <= 75) {
    // Levels 61-75: Hard difficulty - TRANSITION (64 cards, easier time)
    gridSize = 8;
    timeLimit = 180; // Easier transition from 6x6
    optimalMoves = 40;
    acceptableMoves = 52;
  } else {
    // Levels 76-100: Hard difficulty - FULL (64 cards)
    gridSize = 8;
    timeLimit = 240; // Full difficulty
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
