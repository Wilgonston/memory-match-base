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
 * Level ranges (based on industry standards for memory match games):
 * - Levels 1-25: 4x4 grid (16 cards), 90 seconds, optimal 12 moves, acceptable 16 moves
 * - Levels 26-60: 6x6 grid (36 cards), 150 seconds (2.5 min), optimal 24 moves, acceptable 32 moves
 * - Levels 61-100: 8x8 grid (64 cards), 240 seconds (4 min), optimal 40 moves, acceptable 52 moves
 * 
 * Time limits are based on research of popular memory match games:
 * - 16 cards: 60-90 seconds standard
 * - 36 cards: 120-180 seconds standard
 * - 64 cards: 240-300 seconds standard (giant games allow up to 5 minutes)
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
    timeLimit = 90; // Increased from 60 to 90 seconds
    optimalMoves = 12;
    acceptableMoves = 16;
  } else if (level <= 60) {
    // Levels 26-60: Medium difficulty (36 cards)
    gridSize = 6;
    timeLimit = 150; // Increased from 90 to 150 seconds (2.5 minutes)
    optimalMoves = 24;
    acceptableMoves = 32;
  } else {
    // Levels 61-100: Hard difficulty (64 cards)
    gridSize = 8;
    timeLimit = 240; // Increased from 120 to 240 seconds (4 minutes)
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
