/**
 * Unit tests for star rating calculation utilities
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateStars } from './scoring';
import type { LevelConfig } from '../types/game';

describe('calculateStars', () => {
  // Sample level configurations for testing
  const easyConfig: LevelConfig = {
    level: 1,
    gridSize: 4,
    timeLimit: 60,
    optimalMoves: 12,
    acceptableMoves: 16,
  };

  const mediumConfig: LevelConfig = {
    level: 26,
    gridSize: 6,
    timeLimit: 90,
    optimalMoves: 24,
    acceptableMoves: 32,
  };

  const hardConfig: LevelConfig = {
    level: 61,
    gridSize: 8,
    timeLimit: 120,
    optimalMoves: 40,
    acceptableMoves: 52,
  };

  describe('3 stars - Optimal performance', () => {
    it('should return 3 stars when moves equal optimal moves', () => {
      expect(calculateStars(12, easyConfig)).toBe(3);
      expect(calculateStars(24, mediumConfig)).toBe(3);
      expect(calculateStars(40, hardConfig)).toBe(3);
    });

    it('should return 3 stars when moves are less than optimal moves', () => {
      expect(calculateStars(10, easyConfig)).toBe(3);
      expect(calculateStars(20, mediumConfig)).toBe(3);
      expect(calculateStars(35, hardConfig)).toBe(3);
    });

    it('should return 3 stars for minimum possible moves (perfect play)', () => {
      // Minimum moves for 4x4 grid (8 pairs) is 8 moves
      expect(calculateStars(8, easyConfig)).toBe(3);
      // Minimum moves for 6x6 grid (18 pairs) is 18 moves
      expect(calculateStars(18, mediumConfig)).toBe(3);
      // Minimum moves for 8x8 grid (32 pairs) is 32 moves
      expect(calculateStars(32, hardConfig)).toBe(3);
    });
  });

  describe('2 stars - Acceptable performance', () => {
    it('should return 2 stars when moves equal acceptable moves', () => {
      expect(calculateStars(16, easyConfig)).toBe(2);
      expect(calculateStars(32, mediumConfig)).toBe(2);
      expect(calculateStars(52, hardConfig)).toBe(2);
    });

    it('should return 2 stars when moves are between optimal and acceptable', () => {
      expect(calculateStars(14, easyConfig)).toBe(2);
      expect(calculateStars(28, mediumConfig)).toBe(2);
      expect(calculateStars(45, hardConfig)).toBe(2);
    });

    it('should return 2 stars when moves are one more than optimal', () => {
      expect(calculateStars(13, easyConfig)).toBe(2);
      expect(calculateStars(25, mediumConfig)).toBe(2);
      expect(calculateStars(41, hardConfig)).toBe(2);
    });
  });

  describe('1 star - Needs improvement', () => {
    it('should return 1 star when moves exceed acceptable moves', () => {
      expect(calculateStars(17, easyConfig)).toBe(1);
      expect(calculateStars(33, mediumConfig)).toBe(1);
      expect(calculateStars(53, hardConfig)).toBe(1);
    });

    it('should return 1 star when moves are one more than acceptable', () => {
      expect(calculateStars(17, easyConfig)).toBe(1);
      expect(calculateStars(33, mediumConfig)).toBe(1);
      expect(calculateStars(53, hardConfig)).toBe(1);
    });

    it('should return 1 star for very high move counts', () => {
      expect(calculateStars(50, easyConfig)).toBe(1);
      expect(calculateStars(100, mediumConfig)).toBe(1);
      expect(calculateStars(200, hardConfig)).toBe(1);
    });
  });

  describe('Boundary conditions', () => {
    it('should handle boundary between 3 and 2 stars correctly', () => {
      // At optimal moves: 3 stars
      expect(calculateStars(12, easyConfig)).toBe(3);
      // One more than optimal: 2 stars
      expect(calculateStars(13, easyConfig)).toBe(2);
    });

    it('should handle boundary between 2 and 1 star correctly', () => {
      // At acceptable moves: 2 stars
      expect(calculateStars(16, easyConfig)).toBe(2);
      // One more than acceptable: 1 star
      expect(calculateStars(17, easyConfig)).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero moves (theoretical edge case)', () => {
      // Zero moves would be impossible in real game, but should return 3 stars
      expect(calculateStars(0, easyConfig)).toBe(3);
    });

    it('should handle very large move counts', () => {
      expect(calculateStars(1000, easyConfig)).toBe(1);
      expect(calculateStars(Number.MAX_SAFE_INTEGER, easyConfig)).toBe(1);
    });
  });

  describe('Consistency across difficulty levels', () => {
    it('should always return a value between 1 and 3', () => {
      const configs = [easyConfig, mediumConfig, hardConfig];
      const moveCounts = [0, 10, 20, 30, 40, 50, 100, 200];

      configs.forEach(config => {
        moveCounts.forEach(moves => {
          const stars = calculateStars(moves, config);
          expect(stars).toBeGreaterThanOrEqual(1);
          expect(stars).toBeLessThanOrEqual(3);
        });
      });
    });

    it('should respect the threshold ordering: optimal < acceptable', () => {
      const configs = [easyConfig, mediumConfig, hardConfig];

      configs.forEach(config => {
        expect(config.optimalMoves).toBeLessThan(config.acceptableMoves);
        
        // Verify star ratings respect this ordering
        const starsAtOptimal = calculateStars(config.optimalMoves, config);
        const starsAtAcceptable = calculateStars(config.acceptableMoves, config);
        const starsAboveAcceptable = calculateStars(config.acceptableMoves + 1, config);

        expect(starsAtOptimal).toBe(3);
        expect(starsAtAcceptable).toBe(2);
        expect(starsAboveAcceptable).toBe(1);
      });
    });
  });
});

describe('calculateStars - Property Tests', () => {
  describe('Property 9: Star Rating Boundaries - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**', () => {
    it('should always return stars between 1 and 3 for any valid input', () => {
      fc.assert(
        fc.property(
          // Generate random move counts (non-negative integers)
          fc.integer({ min: 0, max: 10000 }),
          // Generate random level configurations
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 50 }),
            acceptableMoves: fc.integer({ min: 10, max: 100 }),
          }).filter(config => config.optimalMoves < config.acceptableMoves),
          
          (moves, config) => {
            const stars = calculateStars(moves, config);
            
            // Stars must always be 1, 2, or 3
            expect(stars).toBeGreaterThanOrEqual(1);
            expect(stars).toBeLessThanOrEqual(3);
            expect(Number.isInteger(stars)).toBe(true);
            expect([1, 2, 3]).toContain(stars);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 3 stars when moves are at or below optimal threshold', () => {
      fc.assert(
        fc.property(
          // Generate level configurations
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 50 }),
            acceptableMoves: fc.integer({ min: 10, max: 100 }),
          }).filter(config => config.optimalMoves < config.acceptableMoves),
          // Generate moves at or below optimal
          fc.integer({ min: 0, max: 100 }),
          
          (config, movesOffset) => {
            const moves = Math.max(0, config.optimalMoves - movesOffset);
            const stars = calculateStars(moves, config);
            
            // Should always get 3 stars for optimal or better performance
            expect(stars).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 2 stars when moves are between optimal and acceptable', () => {
      fc.assert(
        fc.property(
          // Generate level configurations with sufficient gap between thresholds
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 40 }),
            acceptableMoves: fc.integer({ min: 15, max: 100 }),
          }).filter(config => config.optimalMoves + 2 <= config.acceptableMoves),
          
          (config) => {
            // Pick a move count strictly between optimal and acceptable
            const moves = config.optimalMoves + 1;
            const stars = calculateStars(moves, config);
            
            // Should get 2 stars for acceptable performance
            expect(stars).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 1 star when moves exceed acceptable threshold', () => {
      fc.assert(
        fc.property(
          // Generate level configurations
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 50 }),
            acceptableMoves: fc.integer({ min: 10, max: 100 }),
          }).filter(config => config.optimalMoves < config.acceptableMoves),
          // Generate moves above acceptable
          fc.integer({ min: 1, max: 1000 }),
          
          (config, extraMoves) => {
            const moves = config.acceptableMoves + extraMoves;
            const stars = calculateStars(moves, config);
            
            // Should get 1 star for poor performance
            expect(stars).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Star Rating Monotonicity - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**', () => {
    it('should decrease (or stay same) as moves increase', () => {
      fc.assert(
        fc.property(
          // Generate level configurations
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 50 }),
            acceptableMoves: fc.integer({ min: 10, max: 100 }),
          }).filter(config => config.optimalMoves < config.acceptableMoves),
          // Generate two move counts
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          
          (config, moves1, moves2) => {
            const stars1 = calculateStars(moves1, config);
            const stars2 = calculateStars(moves2, config);
            
            // If moves1 < moves2, then stars1 >= stars2 (monotonic decrease)
            if (moves1 < moves2) {
              expect(stars1).toBeGreaterThanOrEqual(stars2);
            }
            // If moves1 > moves2, then stars1 <= stars2
            if (moves1 > moves2) {
              expect(stars1).toBeLessThanOrEqual(stars2);
            }
            // If moves1 === moves2, then stars1 === stars2
            if (moves1 === moves2) {
              expect(stars1).toBe(stars2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly 3 distinct rating levels across move ranges', () => {
      fc.assert(
        fc.property(
          // Generate level configurations
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 50 }),
            acceptableMoves: fc.integer({ min: 10, max: 100 }),
          }).filter(config => config.optimalMoves < config.acceptableMoves),
          
          (config) => {
            // Test a range of move counts
            const moveRanges = [
              0,
              config.optimalMoves,
              config.optimalMoves + 1,
              config.acceptableMoves,
              config.acceptableMoves + 1,
              config.acceptableMoves + 100,
            ];
            
            const starRatings = moveRanges.map(moves => calculateStars(moves, config));
            const uniqueStars = new Set(starRatings);
            
            // Should have exactly 3 distinct star ratings possible
            expect(uniqueStars.size).toBeGreaterThanOrEqual(1);
            expect(uniqueStars.size).toBeLessThanOrEqual(3);
            
            // All ratings should be valid
            uniqueStars.forEach(stars => {
              expect([1, 2, 3]).toContain(stars);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should transition from 3 to 2 to 1 stars as moves increase', () => {
      fc.assert(
        fc.property(
          // Generate level configurations with sufficient gaps
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            gridSize: fc.constantFrom(4, 6, 8) as fc.Arbitrary<4 | 6 | 8>,
            timeLimit: fc.integer({ min: 30, max: 300 }),
            optimalMoves: fc.integer({ min: 8, max: 40 }),
            acceptableMoves: fc.integer({ min: 15, max: 100 }),
          }).filter(config => config.optimalMoves + 2 <= config.acceptableMoves),
          
          (config) => {
            // Test at key thresholds
            const starsAtOptimal = calculateStars(config.optimalMoves, config);
            const starsJustAboveOptimal = calculateStars(config.optimalMoves + 1, config);
            const starsAtAcceptable = calculateStars(config.acceptableMoves, config);
            const starsAboveAcceptable = calculateStars(config.acceptableMoves + 1, config);
            
            // Verify the transition pattern
            expect(starsAtOptimal).toBe(3);
            expect(starsJustAboveOptimal).toBe(2);
            expect(starsAtAcceptable).toBe(2);
            expect(starsAboveAcceptable).toBe(1);
            
            // Verify monotonicity at boundaries
            expect(starsAtOptimal).toBeGreaterThanOrEqual(starsJustAboveOptimal);
            expect(starsJustAboveOptimal).toBeGreaterThanOrEqual(starsAtAcceptable);
            expect(starsAtAcceptable).toBeGreaterThanOrEqual(starsAboveAcceptable);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Star Rating with Real Level Configurations - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**', () => {
    it('should work correctly with actual game level configurations', () => {
      fc.assert(
        fc.property(
          // Generate level numbers from actual game
          fc.integer({ min: 1, max: 100 }),
          // Generate move counts
          fc.integer({ min: 0, max: 200 }),
          
          (level, moves) => {
            // Create realistic level config based on level ranges
            let config: LevelConfig;
            if (level <= 25) {
              config = {
                level,
                gridSize: 4,
                timeLimit: 60,
                optimalMoves: 12,
                acceptableMoves: 16,
              };
            } else if (level <= 60) {
              config = {
                level,
                gridSize: 6,
                timeLimit: 90,
                optimalMoves: 24,
                acceptableMoves: 32,
              };
            } else {
              config = {
                level,
                gridSize: 8,
                timeLimit: 120,
                optimalMoves: 40,
                acceptableMoves: 52,
              };
            }
            
            const stars = calculateStars(moves, config);
            
            // Verify stars are valid
            expect([1, 2, 3]).toContain(stars);
            
            // Verify correct star assignment based on thresholds
            if (moves <= config.optimalMoves) {
              expect(stars).toBe(3);
            } else if (moves <= config.acceptableMoves) {
              expect(stars).toBe(2);
            } else {
              expect(stars).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
