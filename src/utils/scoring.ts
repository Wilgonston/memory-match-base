/**
 * Star rating calculation utilities for Memory Match BASE
 */

import type { LevelConfig } from '../types/game';

/**
 * Calculate star rating based on number of moves and level configuration
 * 
 * @param moves - Number of moves made to complete the level
 * @param config - Level configuration containing optimal and acceptable move thresholds
 * @returns Star rating (1-3)
 * 
 * Star Rating Rules:
 * - 3 stars: moves <= optimalMoves (excellent performance)
 * - 2 stars: moves <= acceptableMoves (good performance)
 * - 1 star: moves > acceptableMoves (completed but needs improvement)
 * 
 * Requirements: 6.3, 6.4, 6.5, 6.6
 */
export function calculateStars(moves: number, config: LevelConfig): number {
  // 3 stars for optimal performance
  if (moves <= config.optimalMoves) {
    return 3;
  }
  
  // 2 stars for acceptable performance
  if (moves <= config.acceptableMoves) {
    return 2;
  }
  
  // 1 star for completion (but exceeds acceptable moves)
  return 1;
}
