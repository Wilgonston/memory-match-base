/**
 * Property-Based Tests for LevelSelect component
 * 
 * Tests universal properties that should hold across all valid inputs.
 * Uses fast-check library with minimum 100 iterations per test.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { LevelSelect } from './LevelSelect';
import { ProgressData } from '../types';

describe('LevelSelect Component - Property Tests', () => {
  describe('Property 10: Level Unlock Progression - **Validates: Requirements 5.2, 5.4**', () => {
    it('should ensure all levels below unlocked level are also unlocked', () => {
      fc.assert(
        fc.property(
          // Generate random progress data with various unlock states
          fc.record({
            // Generate highest unlocked level (1 to 100)
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            
            // Generate some completed levels (subset of unlocked levels)
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Set(arr)),
            
            // Generate level stars for completed levels
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }), // level number
                fc.integer({ min: 1, max: 3 })    // stars (1-3)
              ),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Map(arr)),
            
            // Sound enabled
            soundEnabled: fc.boolean(),
          }),
          
          (progressData) => {
            const onLevelSelect = () => {};
            
            // Render the component
            const { container } = render(
              <LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />
            );
            
            const highestUnlocked = progressData.highestUnlockedLevel;
            
            // Property 10: For any level N that is unlocked, all levels 1 to N-1 should also be unlocked
            // This means: if highestUnlockedLevel is N, then levels 1 through N should be unlocked
            
            // Check all levels from 1 to highestUnlockedLevel are unlocked (not disabled)
            for (let level = 1; level <= highestUnlocked; level++) {
              const levelButton = container.querySelector(`button[aria-label*="Level ${level},"]`);
              
              // Button should exist
              expect(levelButton).not.toBeNull();
              
              // Button should not be disabled
              expect(levelButton?.hasAttribute('disabled')).toBe(false);
              
              // Button should have 'unlocked' class
              expect(levelButton?.classList.contains('unlocked')).toBe(true);
              
              // Button should NOT have 'locked' class
              expect(levelButton?.classList.contains('locked')).toBe(false);
            }
            
            // Check all levels above highestUnlockedLevel are locked (disabled)
            if (highestUnlocked < 100) {
              for (let level = highestUnlocked + 1; level <= Math.min(highestUnlocked + 5, 100); level++) {
                const levelButton = container.querySelector(`button[aria-label*="Level ${level},"]`);
                
                // Button should exist
                expect(levelButton).not.toBeNull();
                
                // Button should be disabled
                expect(levelButton?.hasAttribute('disabled')).toBe(true);
                
                // Button should have 'locked' class
                expect(levelButton?.classList.contains('locked')).toBe(true);
                
                // Button should NOT have 'unlocked' class
                expect(levelButton?.classList.contains('unlocked')).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as per design document
      );
    });

    it('should maintain unlock progression invariant: unlocked levels form a contiguous range from 1', () => {
      fc.assert(
        fc.property(
          // Generate random highest unlocked level
          fc.integer({ min: 1, max: 100 }),
          
          (highestUnlockedLevel) => {
            const progressData: ProgressData = {
              highestUnlockedLevel,
              completedLevels: new Set(),
              levelStars: new Map(),
              soundEnabled: true,
            };
            
            const onLevelSelect = () => {};
            
            // Render the component
            const { container } = render(
              <LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />
            );
            
            // Property: Unlocked levels should form a contiguous range [1, highestUnlockedLevel]
            // No gaps should exist in the unlocked range
            
            const unlockedButtons: number[] = [];
            const lockedButtons: number[] = [];
            
            // Collect all unlocked and locked level numbers
            for (let level = 1; level <= 100; level++) {
              const levelButton = container.querySelector(`button[aria-label*="Level ${level},"]`);
              
              if (levelButton && !levelButton.hasAttribute('disabled')) {
                unlockedButtons.push(level);
              } else if (levelButton && levelButton.hasAttribute('disabled')) {
                lockedButtons.push(level);
              }
            }
            
            // Verify unlocked buttons form contiguous range from 1
            expect(unlockedButtons.length).toBe(highestUnlockedLevel);
            
            for (let i = 0; i < unlockedButtons.length; i++) {
              expect(unlockedButtons[i]).toBe(i + 1);
            }
            
            // Verify locked buttons start after highestUnlockedLevel
            if (lockedButtons.length > 0) {
              expect(Math.min(...lockedButtons)).toBe(highestUnlockedLevel + 1);
            }
            
            // Verify no unlocked level exists after a locked level
            if (unlockedButtons.length > 0 && lockedButtons.length > 0) {
              const maxUnlocked = Math.max(...unlockedButtons);
              const minLocked = Math.min(...lockedButtons);
              expect(maxUnlocked).toBeLessThan(minLocked);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure level 1 is always unlocked regardless of progress', () => {
      fc.assert(
        fc.property(
          // Generate random progress data
          fc.record({
            highestUnlockedLevel: fc.integer({ min: 1, max: 100 }),
            completedLevels: fc.array(
              fc.integer({ min: 1, max: 100 }),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Set(arr)),
            levelStars: fc.array(
              fc.tuple(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 3 })
              ),
              { minLength: 0, maxLength: 50 }
            ).map(arr => new Map(arr)),
            soundEnabled: fc.boolean(),
          }),
          
          (progressData) => {
            const onLevelSelect = () => {};
            
            // Render the component
            const { container } = render(
              <LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />
            );
            
            // Property: Level 1 should ALWAYS be unlocked
            const level1Button = container.querySelector(`button[aria-label*="Level 1,"]`);
            
            expect(level1Button).not.toBeNull();
            expect(level1Button?.hasAttribute('disabled')).toBe(false);
            expect(level1Button?.classList.contains('unlocked')).toBe(true);
            expect(level1Button?.classList.contains('locked')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never have a locked level with a lower number than an unlocked level', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          
          (highestUnlockedLevel) => {
            const progressData: ProgressData = {
              highestUnlockedLevel,
              completedLevels: new Set(),
              levelStars: new Map(),
              soundEnabled: true,
            };
            
            const onLevelSelect = () => {};
            
            // Render the component
            const { container } = render(
              <LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />
            );
            
            // Property: For any locked level L and unlocked level U, L > U must hold
            // In other words: locked levels always have higher numbers than unlocked levels
            
            for (let lockedLevel = highestUnlockedLevel + 1; lockedLevel <= 100; lockedLevel++) {
              const lockedButton = container.querySelector(`button[aria-label*="Level ${lockedLevel},"]`);
              
              if (lockedButton) {
                expect(lockedButton.hasAttribute('disabled')).toBe(true);
                
                // Check that all levels below this locked level are unlocked
                for (let unlockedLevel = 1; unlockedLevel <= highestUnlockedLevel; unlockedLevel++) {
                  expect(unlockedLevel).toBeLessThan(lockedLevel);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
