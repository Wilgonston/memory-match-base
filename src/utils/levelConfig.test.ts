/**
 * Unit tests for level configuration utilities
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getLevelConfig } from './levelConfig';

describe('getLevelConfig', () => {
  describe('Levels 1-25 (Easy)', () => {
    it('should return 4x4 grid for level 1', () => {
      const config = getLevelConfig(1);
      expect(config.gridSize).toBe(4);
      expect(config.timeLimit).toBe(60);
      expect(config.optimalMoves).toBe(12);
      expect(config.acceptableMoves).toBe(16);
      expect(config.level).toBe(1);
    });

    it('should return 4x4 grid for level 25 (boundary)', () => {
      const config = getLevelConfig(25);
      expect(config.gridSize).toBe(4);
      expect(config.timeLimit).toBe(60);
      expect(config.optimalMoves).toBe(12);
      expect(config.acceptableMoves).toBe(16);
      expect(config.level).toBe(25);
    });

    it('should return 4x4 grid for level 13 (middle)', () => {
      const config = getLevelConfig(13);
      expect(config.gridSize).toBe(4);
      expect(config.timeLimit).toBe(60);
    });
  });

  describe('Levels 26-60 (Medium)', () => {
    it('should return 6x6 grid for level 26 (boundary)', () => {
      const config = getLevelConfig(26);
      expect(config.gridSize).toBe(6);
      expect(config.timeLimit).toBe(90);
      expect(config.optimalMoves).toBe(24);
      expect(config.acceptableMoves).toBe(32);
      expect(config.level).toBe(26);
    });

    it('should return 6x6 grid for level 60 (boundary)', () => {
      const config = getLevelConfig(60);
      expect(config.gridSize).toBe(6);
      expect(config.timeLimit).toBe(90);
      expect(config.optimalMoves).toBe(24);
      expect(config.acceptableMoves).toBe(32);
      expect(config.level).toBe(60);
    });

    it('should return 6x6 grid for level 43 (middle)', () => {
      const config = getLevelConfig(43);
      expect(config.gridSize).toBe(6);
      expect(config.timeLimit).toBe(90);
    });
  });

  describe('Levels 61-100 (Hard)', () => {
    it('should return 8x8 grid for level 61 (boundary)', () => {
      const config = getLevelConfig(61);
      expect(config.gridSize).toBe(8);
      expect(config.timeLimit).toBe(120);
      expect(config.optimalMoves).toBe(40);
      expect(config.acceptableMoves).toBe(52);
      expect(config.level).toBe(61);
    });

    it('should return 8x8 grid for level 100 (boundary)', () => {
      const config = getLevelConfig(100);
      expect(config.gridSize).toBe(8);
      expect(config.timeLimit).toBe(120);
      expect(config.optimalMoves).toBe(40);
      expect(config.acceptableMoves).toBe(52);
      expect(config.level).toBe(100);
    });

    it('should return 8x8 grid for level 80 (middle)', () => {
      const config = getLevelConfig(80);
      expect(config.gridSize).toBe(8);
      expect(config.timeLimit).toBe(120);
    });
  });

  describe('Grid size consistency', () => {
    it('should always return even total card count', () => {
      for (let level = 1; level <= 100; level++) {
        const config = getLevelConfig(level);
        const totalCards = config.gridSize * config.gridSize;
        expect(totalCards % 2).toBe(0);
      }
    });
  });

  describe('Move thresholds', () => {
    it('should have optimalMoves less than acceptableMoves', () => {
      for (let level = 1; level <= 100; level++) {
        const config = getLevelConfig(level);
        expect(config.optimalMoves).toBeLessThan(config.acceptableMoves);
      }
    });
  });
});

// Property-Based Tests
describe('getLevelConfig - Property Tests', () => {
  it('Property 2: Grid Size Consistency - **Validates: Requirements 1.2, 1.3, 1.4**', () => {
    fc.assert(
      fc.property(
        // Generate level numbers from 1 to 100
        fc.integer({ min: 1, max: 100 }),
        (level) => {
          const config = getLevelConfig(level);
          
          // Property: Total cards (gridSize × gridSize) must always be even
          const totalCards = config.gridSize * config.gridSize;
          expect(totalCards % 2).toBe(0);
          
          // Additional verification: gridSize should be one of the valid values
          expect([4, 6, 8]).toContain(config.gridSize);
          
          // Verify the total cards match expected values for each grid size
          if (config.gridSize === 4) {
            expect(totalCards).toBe(16);
          } else if (config.gridSize === 6) {
            expect(totalCards).toBe(36);
          } else if (config.gridSize === 8) {
            expect(totalCards).toBe(64);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('Property 12: Time Allocation by Level Range - **Validates: Requirements 4.2, 4.3, 4.4**', () => {
    fc.assert(
      fc.property(
        // Generate level numbers from 1 to 100
        fc.integer({ min: 1, max: 100 }),
        (level) => {
          const config = getLevelConfig(level);
          
          // Property: Time limits must match the level range
          if (level >= 1 && level <= 25) {
            // Levels 1-25: 60 seconds
            expect(config.timeLimit).toBe(60);
            expect(config.gridSize).toBe(4);
          } else if (level >= 26 && level <= 60) {
            // Levels 26-60: 90 seconds
            expect(config.timeLimit).toBe(90);
            expect(config.gridSize).toBe(6);
          } else if (level >= 61 && level <= 100) {
            // Levels 61-100: 120 seconds
            expect(config.timeLimit).toBe(120);
            expect(config.gridSize).toBe(8);
          }
          
          // Verify level is correctly set in config
          expect(config.level).toBe(level);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2 & 12: Combined Level Configuration Consistency - **Validates: Requirements 1.2, 1.3, 1.4, 4.2, 4.3, 4.4**', () => {
    fc.assert(
      fc.property(
        // Generate level numbers from 1 to 100
        fc.integer({ min: 1, max: 100 }),
        (level) => {
          const config = getLevelConfig(level);
          
          // Verify all properties are consistent for each level range
          if (level <= 25) {
            expect(config.gridSize).toBe(4);
            expect(config.timeLimit).toBe(60);
            expect(config.optimalMoves).toBe(12);
            expect(config.acceptableMoves).toBe(16);
          } else if (level <= 60) {
            expect(config.gridSize).toBe(6);
            expect(config.timeLimit).toBe(90);
            expect(config.optimalMoves).toBe(24);
            expect(config.acceptableMoves).toBe(32);
          } else {
            expect(config.gridSize).toBe(8);
            expect(config.timeLimit).toBe(120);
            expect(config.optimalMoves).toBe(40);
            expect(config.acceptableMoves).toBe(52);
          }
          
          // Verify move thresholds are sensible
          expect(config.optimalMoves).toBeGreaterThan(0);
          expect(config.acceptableMoves).toBeGreaterThan(config.optimalMoves);
          
          // Verify time limit is positive
          expect(config.timeLimit).toBeGreaterThan(0);
          
          // Verify total cards is even (required for pairs)
          const totalCards = config.gridSize * config.gridSize;
          expect(totalCards % 2).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2: Grid Size Produces Valid Pair Count - **Validates: Requirements 1.2, 1.3, 1.4**', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (level) => {
          const config = getLevelConfig(level);
          
          // Calculate number of pairs needed
          const totalCards = config.gridSize * config.gridSize;
          const pairsNeeded = totalCards / 2;
          
          // Property: Number of pairs must be a whole number
          expect(Number.isInteger(pairsNeeded)).toBe(true);
          
          // Property: Number of pairs must be positive
          expect(pairsNeeded).toBeGreaterThan(0);
          
          // Verify pairs match expected values
          if (config.gridSize === 4) {
            expect(pairsNeeded).toBe(8);
          } else if (config.gridSize === 6) {
            expect(pairsNeeded).toBe(18);
          } else if (config.gridSize === 8) {
            expect(pairsNeeded).toBe(32);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Time Limit Increases with Difficulty - **Validates: Requirements 4.2, 4.3, 4.4**', () => {
    fc.assert(
      fc.property(
        // Generate two different level numbers
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (level1, level2) => {
          const config1 = getLevelConfig(level1);
          const config2 = getLevelConfig(level2);
          
          // Determine which level range each belongs to
          const getRange = (lvl: number) => {
            if (lvl <= 25) return 1;
            if (lvl <= 60) return 2;
            return 3;
          };
          
          const range1 = getRange(level1);
          const range2 = getRange(level2);
          
          // Property: Higher difficulty ranges should have equal or greater time limits
          if (range1 < range2) {
            expect(config1.timeLimit).toBeLessThanOrEqual(config2.timeLimit);
          } else if (range1 > range2) {
            expect(config1.timeLimit).toBeGreaterThanOrEqual(config2.timeLimit);
          } else {
            // Same range should have same time limit
            expect(config1.timeLimit).toBe(config2.timeLimit);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
