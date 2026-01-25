/**
 * Card generation utilities for Memory Match BASE
 * 
 * This module provides functions to generate shuffled card arrays
 * for game levels, including selecting random images, creating pairs,
 * and shuffling the cards.
 */

import type { Card, ProjectImage } from '../types/game';
import { shuffleArray } from './shuffle';

/**
 * Selects a random subset of images from the available images.
 * 
 * @param availableImages - Array of available project images
 * @param count - Number of images to select
 * @returns Array of randomly selected images
 * 
 * @throws Error if count is greater than available images
 */
function selectRandomImages(
  availableImages: ProjectImage[],
  count: number
): ProjectImage[] {
  if (count > availableImages.length) {
    throw new Error(
      `Cannot select ${count} images from ${availableImages.length} available images`
    );
  }

  // Shuffle the available images and take the first 'count' items
  const shuffled = shuffleArray(availableImages);
  return shuffled.slice(0, count);
}

/**
 * Generate shuffled cards for a level based on grid size.
 * 
 * This function:
 * 1. Calculates the number of pairs needed based on grid size
 * 2. Selects random images from the available images
 * 3. Creates two cards for each selected image (a pair)
 * 4. Shuffles all cards randomly
 * 
 * @param gridSize - Grid dimensions (4, 6, or 8)
 * @param availableImages - Array of available BASE project images
 * @returns Array of shuffled cards ready for gameplay
 * 
 * @throws Error if not enough images are available for the grid size
 * 
 * @example
 * ```typescript
 * const images = [
 *   { id: 'base', name: 'BASE', imagePath: '/assets/base.png' },
 *   { id: 'coinbase', name: 'Coinbase', imagePath: '/assets/coinbase.png' },
 *   // ... more images
 * ];
 * 
 * // For a 4x4 grid (16 cards, 8 pairs)
 * const cards = generateCards(4, images);
 * // Returns 16 cards with 8 unique imageIds, each appearing twice
 * ```
 * 
 * Requirements:
 * - 1.1: Display grid of face-down cards
 * - 1.5: Shuffle card positions randomly
 * - 8.1: Use images from predefined set of BASE projects
 * - 8.3: Select appropriate number of unique images based on grid size
 */
export function generateCards(
  gridSize: number,
  availableImages: ProjectImage[]
): Card[] {
  // Calculate total cards and pairs needed
  const totalCards = gridSize * gridSize;
  const pairsNeeded = totalCards / 2;

  // Validate that we have enough images
  if (pairsNeeded > availableImages.length) {
    throw new Error(
      `Not enough images available. Need ${pairsNeeded} unique images but only have ${availableImages.length}`
    );
  }

  // Select random images for this level
  const selectedImages = selectRandomImages(availableImages, pairsNeeded);

  // Create pairs of cards
  const cards: Card[] = [];
  selectedImages.forEach((image) => {
    // Create first card of the pair
    cards.push({
      id: `${image.id}-1`,
      imageId: image.id,
      isFlipped: false,
      isMatched: false,
    });

    // Create second card of the pair
    cards.push({
      id: `${image.id}-2`,
      imageId: image.id,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Shuffle the cards to randomize positions
  return shuffleArray(cards);
}
