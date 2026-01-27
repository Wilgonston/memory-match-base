/**
 * Property-Based Tests for FrameGenerator
 * 
 * These tests verify universal correctness properties across randomized inputs
 * using the fast-check library for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateLevelFrame,
  generateShareUrl,
  type LevelCompletionFrame,
} from './FrameGenerator';

describe('FrameGenerator Property Tests', () => {
  // Feature: base-ecosystem-integration, Property 3: For any level completion event, the generated Farcaster Frame should contain the level number, star rating, and moves count in a valid Frame metadata structure
  describe('Property 3: Frame Generation Completeness', () => {
    it('should generate complete frame metadata for any valid level completion', async () => {
      await fc.assert(
        fc.property(
          // Generate random level completion data
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            stars: fc.integer({ min: 0, max: 3 }),
            moves: fc.integer({ min: 1, max: 1000 }),
            timestamp: fc.integer({ min: 0, max: Date.now() }),
            username: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            userAddress: fc.option(
              fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => `0x${s}`),
              { nil: undefined }
            ),
          }),
          fc.webUrl(),
          (completion, baseUrl) => {
            // Generate frame
            const frame = generateLevelFrame(completion, baseUrl);

            // Verify frame has required structure
            expect(frame).toBeDefined();
            expect(frame.version).toBe('vNext');

            // Verify image is present and valid
            expect(frame.image).toBeDefined();
            expect(typeof frame.image).toBe('string');
            expect(frame.image.length).toBeGreaterThan(0);

            // Verify image contains level number
            expect(frame.image).toContain(`Level%20${completion.level}`);

            // Verify image contains star information (stars are represented as ⭐ or ☆)
            const starEmoji = '%E2%AD%90'; // URL-encoded ⭐
            const emptyStarEmoji = '%E2%98%86'; // URL-encoded ☆
            const hasStarInfo = frame.image.includes(starEmoji) || frame.image.includes(emptyStarEmoji);
            expect(hasStarInfo).toBe(true);

            // Verify image contains moves count
            expect(frame.image).toContain(`${completion.moves}%20moves`);

            // Verify aspect ratio is set
            expect(frame.imageAspectRatio).toBe('1.91:1');

            // Verify button is present and valid
            expect(frame.button).toBeDefined();
            expect(frame.button?.title).toBeDefined();
            expect(frame.button?.action).toBeDefined();
            expect(frame.button?.target).toBeDefined();

            // Verify button target contains level number
            expect(frame.button?.target).toContain(`level=${completion.level}`);

            // Verify post URL is present
            expect(frame.postUrl).toBeDefined();
            expect(frame.postUrl).toContain('/api/frame');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid frame metadata structure for edge case levels', async () => {
      await fc.assert(
        fc.property(
          // Test edge cases: level 1, level 100, 0 stars, 3 stars, minimum moves, maximum moves
          fc.constantFrom(
            { level: 1, stars: 0, moves: 1, timestamp: 0 },
            { level: 1, stars: 3, moves: 1, timestamp: 0 },
            { level: 100, stars: 0, moves: 1000, timestamp: Date.now() },
            { level: 100, stars: 3, moves: 1000, timestamp: Date.now() },
            { level: 50, stars: 1, moves: 500, timestamp: Date.now() / 2 },
            { level: 50, stars: 2, moves: 500, timestamp: Date.now() / 2 }
          ),
          (completion) => {
            const frame = generateLevelFrame(completion, 'https://example.com');

            // Verify all required fields are present
            expect(frame.version).toBe('vNext');
            expect(frame.image).toBeDefined();
            expect(frame.imageAspectRatio).toBe('1.91:1');
            expect(frame.button).toBeDefined();
            expect(frame.postUrl).toBeDefined();

            // Verify image contains completion data
            expect(frame.image).toContain(`Level%20${completion.level}`);
            expect(frame.image).toContain(`${completion.moves}%20moves`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include username in frame image when provided', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            stars: fc.integer({ min: 0, max: 3 }),
            moves: fc.integer({ min: 1, max: 1000 }),
            timestamp: fc.integer({ min: 0, max: Date.now() }),
            username: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          (completion) => {
            const frame = generateLevelFrame(completion, 'https://example.com');

            // Verify username is included in image
            const encodedUsername = encodeURIComponent(completion.username);
            expect(frame.image).toContain(encodedUsername);
            expect(frame.image).toContain('by%20');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: base-ecosystem-integration, Property 4: For any level number between 1 and 100, the generated Frame deep link should correctly route to that specific level when clicked
  describe('Property 4: Frame Deep Link Correctness', () => {
    it('should generate correct deep link for any valid level', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.webUrl(),
          (level, stars, moves, baseUrl) => {
            const completion: LevelCompletionFrame = {
              level,
              stars,
              moves,
              timestamp: Date.now(),
            };

            const frame = generateLevelFrame(completion, baseUrl);

            // Verify button target contains correct level parameter
            expect(frame.button?.target).toBeDefined();
            expect(frame.button?.target).toContain(`${baseUrl}?level=${level}`);

            // Verify button action is 'link' for deep linking
            expect(frame.button?.action).toBe('link');

            // Verify the URL is valid
            expect(() => new URL(frame.button!.target!)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique deep links for different levels', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.webUrl(),
          (level1, level2, baseUrl) => {
            fc.pre(level1 !== level2); // Ensure levels are different

            const completion1: LevelCompletionFrame = {
              level: level1,
              stars: 3,
              moves: 20,
              timestamp: Date.now(),
            };

            const completion2: LevelCompletionFrame = {
              level: level2,
              stars: 3,
              moves: 20,
              timestamp: Date.now(),
            };

            const frame1 = generateLevelFrame(completion1, baseUrl);
            const frame2 = generateLevelFrame(completion2, baseUrl);

            // Verify deep links are different
            expect(frame1.button?.target).not.toBe(frame2.button?.target);

            // Verify each contains correct level
            expect(frame1.button?.target).toContain(`level=${level1}`);
            expect(frame2.button?.target).toContain(`level=${level2}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid share URLs for any level completion', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            stars: fc.integer({ min: 0, max: 3 }),
            moves: fc.integer({ min: 1, max: 1000 }),
            timestamp: fc.integer({ min: 0, max: Date.now() }),
          }),
          fc.webUrl(),
          (completion, baseUrl) => {
            const shareUrl = generateShareUrl(completion, baseUrl);

            // Verify URL is valid
            expect(() => new URL(shareUrl)).not.toThrow();

            // Verify URL contains all completion data
            expect(shareUrl).toContain(`level=${completion.level}`);
            expect(shareUrl).toContain(`stars=${completion.stars}`);
            expect(shareUrl).toContain(`moves=${completion.moves}`);
            expect(shareUrl).toContain(`timestamp=${completion.timestamp}`);

            // Verify URL starts with base URL
            expect(shareUrl).toContain(baseUrl);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Frame Metadata Consistency', () => {
    it('should generate consistent frame metadata for same input', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            level: fc.integer({ min: 1, max: 100 }),
            stars: fc.integer({ min: 0, max: 3 }),
            moves: fc.integer({ min: 1, max: 1000 }),
            timestamp: fc.integer({ min: 0, max: Date.now() }),
          }),
          (completion) => {
            const frame1 = generateLevelFrame(completion, 'https://example.com');
            const frame2 = generateLevelFrame(completion, 'https://example.com');

            // Verify frames are identical
            expect(frame1.version).toBe(frame2.version);
            expect(frame1.image).toBe(frame2.image);
            expect(frame1.imageAspectRatio).toBe(frame2.imageAspectRatio);
            expect(frame1.button?.title).toBe(frame2.button?.title);
            expect(frame1.button?.action).toBe(frame2.button?.action);
            expect(frame1.button?.target).toBe(frame2.button?.target);
            expect(frame1.postUrl).toBe(frame2.postUrl);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
