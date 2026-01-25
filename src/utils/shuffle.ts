/**
 * Shuffles an array using the Fisher-Yates (Knuth) shuffle algorithm.
 * This algorithm provides a uniform random permutation of the array.
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n) - creates a copy of the array
 * 
 * @template T - The type of elements in the array
 * @param array - The array to shuffle
 * @returns A new array with the same elements in random order
 * 
 * @example
 * const cards = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(cards);
 * // shuffled might be [3, 1, 5, 2, 4]
 * // original array is unchanged
 */
export function shuffleArray<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];
  
  // Fisher-Yates shuffle algorithm
  // Start from the last element and swap with a random element before it
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements at positions i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
