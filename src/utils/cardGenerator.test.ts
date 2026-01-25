import { describe, it, expect } from 'vitest';
import { generateCards } from './cardGenerator';
import type { ProjectImage } from '../types/game';

// Mock project images for testing
const mockImages: ProjectImage[] = [
  { id: 'base', name: 'BASE', imagePath: '/assets/base.png' },
  { id: 'coinbase', name: 'Coinbase', imagePath: '/assets/coinbase.png' },
  { id: 'aerodrome', name: 'Aerodrome', imagePath: '/assets/aerodrome.png' },
  { id: 'uniswap', name: 'Uniswap', imagePath: '/assets/uniswap.png' },
  { id: 'aave', name: 'Aave', imagePath: '/assets/aave.png' },
  { id: 'compound', name: 'Compound', imagePath: '/assets/compound.png' },
  { id: 'sushiswap', name: 'SushiSwap', imagePath: '/assets/sushiswap.png' },
  { id: 'synthetix', name: 'Synthetix', imagePath: '/assets/synthetix.png' },
  { id: 'stargate', name: 'Stargate', imagePath: '/assets/stargate.png' },
  { id: 'balancer', name: 'Balancer', imagePath: '/assets/balancer.png' },
  { id: 'pancakeswap', name: 'PancakeSwap', imagePath: '/assets/pancakeswap.png' },
  { id: 'curve', name: 'Curve', imagePath: '/assets/curve.png' },
  { id: 'opensea', name: 'OpenSea', imagePath: '/assets/opensea.png' },
  { id: 'frenpet', name: 'FrenPet', imagePath: '/assets/frenpet.png' },
  { id: 'builderfi', name: 'BuilderFi', imagePath: '/assets/builderfi.png' },
  { id: 'backed', name: 'Backed Finance', imagePath: '/assets/backed.png' },
  { id: 'echelon', name: 'Echelon Prime', imagePath: '/assets/echelon.png' },
  { id: 'degen', name: 'Degen Chain', imagePath: '/assets/degen.png' },
  { id: 'cartesi', name: 'Cartesi', imagePath: '/assets/cartesi.png' },
  { id: 'metastreet', name: 'MetaStreet', imagePath: '/assets/metastreet.png' },
];

describe('generateCards', () => {
  describe('Basic functionality', () => {
    it('should generate correct number of cards for 4x4 grid', () => {
      const cards = generateCards(4, mockImages);
      expect(cards).toHaveLength(16);
    });

    it('should generate correct number of cards for 6x6 grid', () => {
      const cards = generateCards(6, mockImages);
      expect(cards).toHaveLength(36);
    });

    it('should generate correct number of cards for 8x8 grid', () => {
      // Create enough images for 8x8 grid (32 unique images needed)
      const manyImages: ProjectImage[] = Array.from({ length: 32 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        imagePath: `/assets/project-${i}.png`,
      }));
      
      const cards = generateCards(8, manyImages);
      expect(cards).toHaveLength(64);
    });

    it('should initialize all cards as face-down and unmatched', () => {
      const cards = generateCards(4, mockImages);
      
      cards.forEach(card => {
        expect(card.isFlipped).toBe(false);
        expect(card.isMatched).toBe(false);
      });
    });

    it('should create unique card IDs', () => {
      const cards = generateCards(4, mockImages);
      const ids = cards.map(card => card.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(cards.length);
    });
  });

  describe('Pair creation', () => {
    it('should create exactly 2 cards for each imageId (4x4 grid)', () => {
      const cards = generateCards(4, mockImages);
      
      // Count occurrences of each imageId
      const imageIdCounts = new Map<string, number>();
      cards.forEach(card => {
        imageIdCounts.set(card.imageId, (imageIdCounts.get(card.imageId) || 0) + 1);
      });
      
      // Every imageId should appear exactly twice
      imageIdCounts.forEach(count => {
        expect(count).toBe(2);
      });
    });

    it('should create exactly 2 cards for each imageId (6x6 grid)', () => {
      const cards = generateCards(6, mockImages);
      
      const imageIdCounts = new Map<string, number>();
      cards.forEach(card => {
        imageIdCounts.set(card.imageId, (imageIdCounts.get(card.imageId) || 0) + 1);
      });
      
      imageIdCounts.forEach(count => {
        expect(count).toBe(2);
      });
    });

    it('should use correct number of unique images for 4x4 grid', () => {
      const cards = generateCards(4, mockImages);
      const uniqueImageIds = new Set(cards.map(card => card.imageId));
      
      // 4x4 = 16 cards = 8 pairs = 8 unique images
      expect(uniqueImageIds.size).toBe(8);
    });

    it('should use correct number of unique images for 6x6 grid', () => {
      const cards = generateCards(6, mockImages);
      const uniqueImageIds = new Set(cards.map(card => card.imageId));
      
      // 6x6 = 36 cards = 18 pairs = 18 unique images
      expect(uniqueImageIds.size).toBe(18);
    });

    it('should use correct number of unique images for 8x8 grid', () => {
      // Create enough images for 8x8 grid (32 unique images needed)
      const manyImages: ProjectImage[] = Array.from({ length: 32 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        imagePath: `/assets/project-${i}.png`,
      }));
      
      const cards = generateCards(8, manyImages);
      const uniqueImageIds = new Set(cards.map(card => card.imageId));
      
      // 8x8 = 64 cards = 32 pairs = 32 unique images
      expect(uniqueImageIds.size).toBe(32);
    });
  });

  describe('Randomization', () => {
    it('should shuffle cards (probabilistic test)', () => {
      // Generate cards multiple times and verify they're in different orders
      const firstGeneration = generateCards(4, mockImages);
      
      let foundDifferentOrder = false;
      
      // Try up to 10 times
      for (let i = 0; i < 10; i++) {
        const nextGeneration = generateCards(4, mockImages);
        
        // Compare card IDs in order
        const firstIds = firstGeneration.map(c => c.id).join(',');
        const nextIds = nextGeneration.map(c => c.id).join(',');
        
        if (firstIds !== nextIds) {
          foundDifferentOrder = true;
          break;
        }
      }
      
      // With 16 cards, probability of same order is 1/16! which is astronomically low
      expect(foundDifferentOrder).toBe(true);
    });

    it('should select different images on different calls (probabilistic test)', () => {
      // Generate cards multiple times and verify different images are selected
      const firstGeneration = generateCards(4, mockImages);
      const firstImageIds = new Set(firstGeneration.map(c => c.imageId));
      
      let foundDifferentSelection = false;
      
      // Try up to 10 times
      for (let i = 0; i < 10; i++) {
        const nextGeneration = generateCards(4, mockImages);
        const nextImageIds = new Set(nextGeneration.map(c => c.imageId));
        
        // Check if the sets are different
        const firstArray = Array.from(firstImageIds).sort();
        const nextArray = Array.from(nextImageIds).sort();
        
        if (JSON.stringify(firstArray) !== JSON.stringify(nextArray)) {
          foundDifferentSelection = true;
          break;
        }
      }
      
      // With 20 images and selecting 8, there are many combinations
      // Probability of same selection is very low
      expect(foundDifferentSelection).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error if not enough images for grid size', () => {
      const tooFewImages = mockImages.slice(0, 5); // Only 5 images
      
      // 4x4 grid needs 8 unique images
      expect(() => generateCards(4, tooFewImages)).toThrow();
    });

    it('should throw error for 8x8 grid with insufficient images', () => {
      const insufficientImages = mockImages.slice(0, 20); // Only 20 images
      
      // 8x8 grid needs 32 unique images
      expect(() => generateCards(8, insufficientImages)).toThrow();
    });

    it('should work with exact number of images needed', () => {
      const exactImages = mockImages.slice(0, 8); // Exactly 8 images
      
      // 4x4 grid needs exactly 8 unique images
      expect(() => generateCards(4, exactImages)).not.toThrow();
      
      const cards = generateCards(4, exactImages);
      expect(cards).toHaveLength(16);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum grid size (4x4)', () => {
      const cards = generateCards(4, mockImages);
      
      expect(cards).toHaveLength(16);
      expect(new Set(cards.map(c => c.imageId)).size).toBe(8);
    });

    it('should handle maximum grid size (8x8) with sufficient images', () => {
      // Create enough images for 8x8 grid (32 unique images needed)
      const manyImages: ProjectImage[] = Array.from({ length: 32 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        imagePath: `/assets/project-${i}.png`,
      }));
      
      const cards = generateCards(8, manyImages);
      
      expect(cards).toHaveLength(64);
      expect(new Set(cards.map(c => c.imageId)).size).toBe(32);
    });

    it('should create cards with proper structure', () => {
      const cards = generateCards(4, mockImages);
      
      cards.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('imageId');
        expect(card).toHaveProperty('isFlipped');
        expect(card).toHaveProperty('isMatched');
        
        expect(typeof card.id).toBe('string');
        expect(typeof card.imageId).toBe('string');
        expect(typeof card.isFlipped).toBe('boolean');
        expect(typeof card.isMatched).toBe('boolean');
      });
    });

    it('should use only images from the provided set', () => {
      const cards = generateCards(4, mockImages);
      const availableImageIds = new Set(mockImages.map(img => img.id));
      
      cards.forEach(card => {
        expect(availableImageIds.has(card.imageId)).toBe(true);
      });
    });
  });
});

// Property-Based Tests
import * as fc from 'fast-check';

describe('generateCards - Property Tests', () => {
  it('Property 1: Card Pair Invariant - **Validates: Requirements 1.1, 8.3**', () => {
    fc.assert(
      fc.property(
        // Generate valid grid sizes (4, 6, or 8)
        fc.constantFrom(4, 6, 8),
        // Generate a sufficient number of mock images
        fc.integer({ min: 32, max: 50 }).chain(imageCount =>
          fc.constant(
            Array.from({ length: imageCount }, (_, i) => ({
              id: `project-${i}`,
              name: `Project ${i}`,
              imagePath: `/assets/project-${i}.png`,
            }))
          )
        ),
        (gridSize, availableImages) => {
          // Generate cards
          const cards = generateCards(gridSize, availableImages);
          
          // Property 1a: Total cards equals gridSize × gridSize
          const expectedTotalCards = gridSize * gridSize;
          expect(cards).toHaveLength(expectedTotalCards);
          
          // Property 1b: Each imageId appears exactly twice
          const imageIdCounts = new Map<string, number>();
          cards.forEach(card => {
            imageIdCounts.set(card.imageId, (imageIdCounts.get(card.imageId) || 0) + 1);
          });
          
          // Every imageId should appear exactly twice (forming a pair)
          imageIdCounts.forEach((count, imageId) => {
            expect(count).toBe(2);
          });
          
          // Property 1c: Number of unique imageIds equals half the total cards
          const expectedUniqueImages = expectedTotalCards / 2;
          expect(imageIdCounts.size).toBe(expectedUniqueImages);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('Property 1: Card Pair Invariant - All cards initialized correctly - **Validates: Requirements 1.1, 8.3**', () => {
    fc.assert(
      fc.property(
        // Generate valid grid sizes (4, 6, or 8)
        fc.constantFrom(4, 6, 8),
        // Generate sufficient mock images
        fc.constant(
          Array.from({ length: 50 }, (_, i) => ({
            id: `project-${i}`,
            name: `Project ${i}`,
            imagePath: `/assets/project-${i}.png`,
          }))
        ),
        (gridSize, availableImages) => {
          const cards = generateCards(gridSize, availableImages);
          
          // All cards should be initialized as face-down and unmatched
          cards.forEach(card => {
            expect(card.isFlipped).toBe(false);
            expect(card.isMatched).toBe(false);
            expect(typeof card.id).toBe('string');
            expect(typeof card.imageId).toBe('string');
            expect(card.id).toBeTruthy();
            expect(card.imageId).toBeTruthy();
          });
          
          // All card IDs should be unique
          const cardIds = cards.map(c => c.id);
          const uniqueCardIds = new Set(cardIds);
          expect(uniqueCardIds.size).toBe(cards.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Card Pair Invariant - Cards use only provided images - **Validates: Requirements 1.1, 8.3**', () => {
    fc.assert(
      fc.property(
        // Generate valid grid sizes (4, 6, or 8)
        fc.constantFrom(4, 6, 8),
        // Generate random number of images (ensuring enough for the grid)
        fc.integer({ min: 32, max: 50 }).chain(imageCount =>
          fc.tuple(
            fc.constant(imageCount),
            fc.constant(
              Array.from({ length: imageCount }, (_, i) => ({
                id: `project-${i}`,
                name: `Project ${i}`,
                imagePath: `/assets/project-${i}.png`,
              }))
            )
          )
        ),
        (gridSize, [imageCount, availableImages]) => {
          const cards = generateCards(gridSize, availableImages);
          
          // Create set of available image IDs
          const availableImageIds = new Set(availableImages.map(img => img.id));
          
          // Every card's imageId should be from the available images
          cards.forEach(card => {
            expect(availableImageIds.has(card.imageId)).toBe(true);
          });
          
          // All imageIds used should be from the provided set
          const usedImageIds = new Set(cards.map(c => c.imageId));
          usedImageIds.forEach(imageId => {
            expect(availableImageIds.has(imageId)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Card Pair Invariant - Pair structure is consistent - **Validates: Requirements 1.1, 8.3**', () => {
    fc.assert(
      fc.property(
        // Generate valid grid sizes (4, 6, or 8)
        fc.constantFrom(4, 6, 8),
        // Generate sufficient mock images
        fc.constant(
          Array.from({ length: 50 }, (_, i) => ({
            id: `project-${i}`,
            name: `Project ${i}`,
            imagePath: `/assets/project-${i}.png`,
          }))
        ),
        (gridSize, availableImages) => {
          const cards = generateCards(gridSize, availableImages);
          
          // Group cards by imageId
          const cardsByImageId = new Map<string, typeof cards>();
          cards.forEach(card => {
            if (!cardsByImageId.has(card.imageId)) {
              cardsByImageId.set(card.imageId, []);
            }
            cardsByImageId.get(card.imageId)!.push(card);
          });
          
          // Each imageId should have exactly 2 cards (a pair)
          cardsByImageId.forEach((pairCards, imageId) => {
            expect(pairCards).toHaveLength(2);
            
            // The two cards in a pair should have different IDs
            expect(pairCards[0].id).not.toBe(pairCards[1].id);
            
            // But the same imageId
            expect(pairCards[0].imageId).toBe(imageId);
            expect(pairCards[1].imageId).toBe(imageId);
            
            // Both should be initialized the same way
            expect(pairCards[0].isFlipped).toBe(pairCards[1].isFlipped);
            expect(pairCards[0].isMatched).toBe(pairCards[1].isMatched);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
