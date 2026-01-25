import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { shuffleArray } from './shuffle';

describe('shuffleArray', () => {
  it('should return an array with the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('should preserve all elements from the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    
    // Sort both arrays to compare contents
    const sortedInput = [...input].sort();
    const sortedResult = [...result].sort();
    
    expect(sortedResult).toEqual(sortedInput);
  });

  it('should not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    
    expect(input).toEqual(original);
  });

  it('should handle empty array', () => {
    const input: number[] = [];
    const result = shuffleArray(input);
    expect(result).toEqual([]);
  });

  it('should handle single element array', () => {
    const input = [42];
    const result = shuffleArray(input);
    expect(result).toEqual([42]);
  });

  it('should handle array with duplicate elements', () => {
    const input = [1, 1, 2, 2, 3, 3];
    const result = shuffleArray(input);
    
    expect(result).toHaveLength(6);
    
    // Count occurrences
    const countOccurrences = (arr: number[], val: number) => 
      arr.filter(x => x === val).length;
    
    expect(countOccurrences(result, 1)).toBe(2);
    expect(countOccurrences(result, 2)).toBe(2);
    expect(countOccurrences(result, 3)).toBe(2);
  });

  it('should work with different types (strings)', () => {
    const input = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(input);
    
    expect(result).toHaveLength(4);
    expect(result.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should work with objects', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ];
    const result = shuffleArray(input);
    
    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ id: 1, name: 'Alice' });
    expect(result).toContainEqual({ id: 2, name: 'Bob' });
    expect(result).toContainEqual({ id: 3, name: 'Charlie' });
  });

  it('should produce different orderings (probabilistic test)', () => {
    // This test verifies that shuffling actually changes the order
    // With a sufficiently large array, the probability of getting
    // the same order is extremely low (1/n! where n is array length)
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    let differentOrderFound = false;
    
    // Try up to 10 times (probability of all being same is astronomically low)
    for (let i = 0; i < 10; i++) {
      const result = shuffleArray(input);
      if (JSON.stringify(result) !== JSON.stringify(input)) {
        differentOrderFound = true;
        break;
      }
    }
    
    expect(differentOrderFound).toBe(true);
  });
});

// Property-Based Tests
describe('shuffleArray - Property Tests', () => {
  it('Property 3: Shuffle Preserves Content - **Validates: Requirements 1.5**', () => {
    fc.assert(
      fc.property(
        // Generate arrays of integers (easier to verify content preservation)
        fc.array(fc.integer(), { minLength: 0, maxLength: 100 }),
        (originalArray) => {
          const shuffled = shuffleArray(originalArray);
          
          // Property 1: Shuffled array has the same length
          expect(shuffled).toHaveLength(originalArray.length);
          
          // Property 2: Shuffled array contains the same elements
          // For content preservation, we verify:
          // 1. Every element in original is in shuffled
          // 2. Every element in shuffled is in original
          // 3. Element counts match
          
          // Create frequency maps
          const getFrequencyMap = (arr: number[]) => {
            const map = new Map<number, number>();
            arr.forEach(val => {
              map.set(val, (map.get(val) || 0) + 1);
            });
            return map;
          };
          
          const originalFreq = getFrequencyMap(originalArray);
          const shuffledFreq = getFrequencyMap(shuffled);
          
          // Verify same keys (unique values)
          expect(Array.from(shuffledFreq.keys()).sort()).toEqual(
            Array.from(originalFreq.keys()).sort()
          );
          
          // Verify same counts for each value
          originalFreq.forEach((count, value) => {
            expect(shuffledFreq.get(value)).toBe(count);
          });
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('Property 3: Shuffle Changes Order (with high probability) - **Validates: Requirements 1.5**', () => {
    fc.assert(
      fc.property(
        // Generate arrays with at least 3 elements to make order change likely
        fc.array(fc.integer(), { minLength: 3, maxLength: 20 }),
        (originalArray) => {
          // For arrays with distinct elements, shuffling should produce different order
          // with very high probability. We'll run multiple shuffles and check that
          // at least one produces a different order.
          
          let foundDifferentOrder = false;
          const maxAttempts = 10;
          
          for (let i = 0; i < maxAttempts; i++) {
            const shuffled = shuffleArray(originalArray);
            
            // Check if order is different
            const isDifferent = shuffled.some((val, idx) => val !== originalArray[idx]);
            
            if (isDifferent) {
              foundDifferentOrder = true;
              break;
            }
          }
          
          // For arrays with 3+ elements, we should find a different order
          // within 10 attempts (probability of failure is astronomically low)
          // Exception: arrays with all identical elements will never change order
          const allSame = originalArray.every(val => val === originalArray[0]);
          
          if (!allSame && originalArray.length >= 3) {
            expect(foundDifferentOrder).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Shuffle Preserves Element Counts - **Validates: Requirements 1.5**', () => {
    fc.assert(
      fc.property(
        // Generate arrays with potential duplicates
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 0, maxLength: 50 }),
        (originalArray) => {
          const shuffled = shuffleArray(originalArray);
          
          // Count occurrences of each element in both arrays
          const countOccurrences = (arr: number[], val: number) => 
            arr.filter(x => x === val).length;
          
          // Get unique values
          const uniqueValues = Array.from(new Set(originalArray));
          
          // Verify each unique value appears the same number of times
          uniqueValues.forEach(value => {
            expect(countOccurrences(shuffled, value)).toBe(
              countOccurrences(originalArray, value)
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Shuffle Does Not Mutate Original Array - **Validates: Requirements 1.5**', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        (originalArray) => {
          // Create a deep copy to compare against
          const originalCopy = [...originalArray];
          
          // Shuffle the array
          shuffleArray(originalArray);
          
          // Verify original array is unchanged
          expect(originalArray).toEqual(originalCopy);
        }
      ),
      { numRuns: 100 }
    );
  });
});
