import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { gameReducer, initialState } from './gameReducer';
import type { GameState, Card } from '../types/game';
import type { GameAction } from '../types/actions';

// Property-Based Tests
describe('gameReducer - Property Tests', () => {
  it('Property 4: Match Detection Correctness - **Validates: Requirements 3.1, 3.2**', () => {
    fc.assert(
      fc.property(
        // Generate two card IDs and an imageId
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.boolean(), // Whether cards should match
        (cardId1, cardId2, imageId1, shouldMatch) => {
          // Ensure card IDs are different
          if (cardId1 === cardId2) {
            cardId1 = cardId1 + '_1';
            cardId2 = cardId2 + '_2';
          }

          const imageId2 = shouldMatch ? imageId1 : imageId1 + '_different';

          // Create a game state with two flipped cards
          const card1: Card = {
            id: cardId1,
            imageId: imageId1,
            isFlipped: true,
            isMatched: false,
          };

          const card2: Card = {
            id: cardId2,
            imageId: imageId2,
            isFlipped: true,
            isMatched: false,
          };

          const testState: GameState = {
            ...initialState,
            cards: [card1, card2],
            flippedCards: [cardId1, cardId2],
            isPlaying: true,
            gameStatus: 'playing',
          };

          if (shouldMatch) {
            // Test MATCH_FOUND action
            const action: GameAction = {
              type: 'MATCH_FOUND',
              cardIds: [cardId1, cardId2],
            };

            const newState = gameReducer(testState, action);

            // Verify both cards are marked as matched
            const updatedCard1 = newState.cards.find(c => c.id === cardId1);
            const updatedCard2 = newState.cards.find(c => c.id === cardId2);

            expect(updatedCard1?.isMatched).toBe(true);
            expect(updatedCard2?.isMatched).toBe(true);

            // Verify matched cards remain flipped (Requirement 3.2)
            expect(updatedCard1?.isFlipped).toBe(true);
            expect(updatedCard2?.isFlipped).toBe(true);

            // Verify matched pairs counter incremented
            expect(newState.matchedPairs).toBe(testState.matchedPairs + 1);

            // Verify flipped cards cleared
            expect(newState.flippedCards).toEqual([]);

            // Verify move counter incremented (Requirement 3.5)
            expect(newState.moves).toBe(testState.moves + 1);
          } else {
            // Test NO_MATCH action
            const action: GameAction = {
              type: 'NO_MATCH',
              cardIds: [cardId1, cardId2],
            };

            const newState = gameReducer(testState, action);

            // Verify both cards are NOT marked as matched
            const updatedCard1 = newState.cards.find(c => c.id === cardId1);
            const updatedCard2 = newState.cards.find(c => c.id === cardId2);

            expect(updatedCard1?.isMatched).toBe(false);
            expect(updatedCard2?.isMatched).toBe(false);

            // Verify cards are flipped back face-down (Requirement 3.3)
            expect(updatedCard1?.isFlipped).toBe(false);
            expect(updatedCard2?.isFlipped).toBe(false);

            // Verify matched pairs counter NOT incremented
            expect(newState.matchedPairs).toBe(testState.matchedPairs);

            // Verify flipped cards cleared
            expect(newState.flippedCards).toEqual([]);

            // Verify move counter incremented (Requirement 3.5)
            expect(newState.moves).toBe(testState.moves + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

  it('Property 11: Card Flip State Consistency - **Validates: Requirements 3.2**', () => {
    fc.assert(
      fc.property(
        // Generate card IDs and imageIds for testing
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            imageId: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (cardData) => {
          // Create cards that are NOT matched (valid initial state)
          const uniqueCards: Card[] = cardData.map((data, idx) => ({
            id: `${data.id}_${idx}`,
            imageId: data.imageId,
            isFlipped: false,
            isMatched: false,
          }));

          // Create a game state with these cards
          const testState: GameState = {
            ...initialState,
            cards: uniqueCards,
            isPlaying: true,
            gameStatus: 'playing',
          };

          // Test that MATCH_FOUND action maintains the invariant:
          // matched cards must be flipped
          if (uniqueCards.length >= 2) {
            const card1 = uniqueCards[0];
            const card2 = uniqueCards[1];

            const action: GameAction = {
              type: 'MATCH_FOUND',
              cardIds: [card1.id, card2.id],
            };

            const newState = gameReducer(testState, action);

            // Property: All matched cards must be flipped
            newState.cards.forEach(card => {
              if (card.isMatched) {
                expect(card.isFlipped).toBe(true);
              }
            });

            // Specifically verify the two cards we just matched
            const matchedCard1 = newState.cards.find(c => c.id === card1.id);
            const matchedCard2 = newState.cards.find(c => c.id === card2.id);

            expect(matchedCard1?.isMatched).toBe(true);
            expect(matchedCard1?.isFlipped).toBe(true);
            expect(matchedCard2?.isMatched).toBe(true);
            expect(matchedCard2?.isFlipped).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 7: Move Counter Increment - **Validates: Requirements 3.5**', () => {
    fc.assert(
      fc.property(
        // Generate initial move count and number of card flip pairs
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        fc.boolean(), // Whether the pairs match
        (initialMoves, numPairs, shouldMatch) => {
          let currentState: GameState = {
            ...initialState,
            moves: initialMoves,
            cards: [],
            isPlaying: true,
            gameStatus: 'playing',
          };

          // Simulate multiple pairs of card flips
          for (let i = 0; i < numPairs; i++) {
            const cardId1 = `card-${i}-1`;
            const cardId2 = `card-${i}-2`;

            // Determine if this pair matches
            const pairMatches = shouldMatch;

            const action: GameAction = pairMatches
              ? { type: 'MATCH_FOUND', cardIds: [cardId1, cardId2] }
              : { type: 'NO_MATCH', cardIds: [cardId1, cardId2] };

            currentState = gameReducer(currentState, action);
          }

          // Property: Move counter should increment by exactly 1 for each pair
          const expectedMoves = initialMoves + numPairs;
          expect(currentState.moves).toBe(expectedMoves);
        }
      ),
      { numRuns: 100 }
    );
  });


// Unit Tests for Edge Cases
describe('gameReducer - Unit Tests', () => {
  it('should ignore flipping an already flipped card (Requirement 2.2)', () => {
    const card1: Card = {
      id: 'card-1',
      imageId: 'base',
      isFlipped: true, // Already flipped
      isMatched: false,
    };

    const card2: Card = {
      id: 'card-2',
      imageId: 'coinbase',
      isFlipped: false,
      isMatched: false,
    };

    const testState: GameState = {
      ...initialState,
      cards: [card1, card2],
      flippedCards: ['card-1'],
      isPlaying: true,
      gameStatus: 'playing',
    };

    // Try to flip the already flipped card
    const action: GameAction = { type: 'FLIP_CARD', cardId: 'card-1' };
    const newState = gameReducer(testState, action);

    // State should remain unchanged
    expect(newState).toEqual(testState);
  });

  it('should ignore flipping a matched card (Requirement 2.2)', () => {
    const card1: Card = {
      id: 'card-1',
      imageId: 'base',
      isFlipped: true,
      isMatched: true, // Already matched
    };

    const card2: Card = {
      id: 'card-2',
      imageId: 'coinbase',
      isFlipped: false,
      isMatched: false,
    };

    const testState: GameState = {
      ...initialState,
      cards: [card1, card2],
      flippedCards: [],
      isPlaying: true,
      gameStatus: 'playing',
    };

    // Try to flip the matched card
    const action: GameAction = { type: 'FLIP_CARD', cardId: 'card-1' };
    const newState = gameReducer(testState, action);

    // State should remain unchanged
    expect(newState).toEqual(testState);
  });

  it('should complete level when all pairs are matched (Requirement 3.4)', () => {
    const card1: Card = {
      id: 'card-1',
      imageId: 'base',
      isFlipped: true,
      isMatched: false,
    };

    const card2: Card = {
      id: 'card-2',
      imageId: 'base',
      isFlipped: true,
      isMatched: false,
    };

    const testState: GameState = {
      ...initialState,
      cards: [card1, card2],
      flippedCards: ['card-1', 'card-2'],
      matchedPairs: 0,
      moves: 5,
      isPlaying: true,
      gameStatus: 'playing',
    };

    // Match the last pair (total pairs = 1)
    const action: GameAction = {
      type: 'MATCH_FOUND',
      cardIds: ['card-1', 'card-2'],
    };
    const newState = gameReducer(testState, action);

    // Level should be complete
    expect(newState.gameStatus).toBe('won');
    expect(newState.isPlaying).toBe(false);
    expect(newState.matchedPairs).toBe(1);
  });

  it('should fail level when timer reaches zero (Requirement 4.5)', () => {
    const testState: GameState = {
      ...initialState,
      cards: [
        { id: 'card-1', imageId: 'base', isFlipped: false, isMatched: false },
        { id: 'card-2', imageId: 'base', isFlipped: false, isMatched: false },
      ],
      timeRemaining: 1, // One second left
      isPlaying: true,
      gameStatus: 'playing',
    };

    // Tick the timer to zero
    const action: GameAction = { type: 'TICK_TIMER' };
    const newState = gameReducer(testState, action);

    // Level should be failed
    expect(newState.gameStatus).toBe('lost');
    expect(newState.isPlaying).toBe(false);
    expect(newState.timeRemaining).toBe(0);
  });

  it('should not allow flipping more than 2 cards at once (Requirement 2.3)', () => {
    const card1: Card = {
      id: 'card-1',
      imageId: 'base',
      isFlipped: true,
      isMatched: false,
    };

    const card2: Card = {
      id: 'card-2',
      imageId: 'coinbase',
      isFlipped: true,
      isMatched: false,
    };

    const card3: Card = {
      id: 'card-3',
      imageId: 'uniswap',
      isFlipped: false,
      isMatched: false,
    };

    const testState: GameState = {
      ...initialState,
      cards: [card1, card2, card3],
      flippedCards: ['card-1', 'card-2'], // Two cards already flipped
      isPlaying: true,
      gameStatus: 'playing',
    };

    // Try to flip a third card
    const action: GameAction = { type: 'FLIP_CARD', cardId: 'card-3' };
    const newState = gameReducer(testState, action);

    // State should remain unchanged
    expect(newState).toEqual(testState);
    expect(newState.flippedCards).toHaveLength(2);
  });

  it('should restart level with RESTART_LEVEL action', () => {
    const testState: GameState = {
      ...initialState,
      level: 5,
      cards: [
        { id: 'card-1', imageId: 'base', isFlipped: true, isMatched: true },
      ],
      moves: 10,
      timeRemaining: 30,
      matchedPairs: 1,
      isPlaying: false,
      gameStatus: 'lost',
    };

    const action: GameAction = { type: 'RESTART_LEVEL' };
    const newState = gameReducer(testState, action);

    // Should start level 5 again with fresh state
    expect(newState.level).toBe(5);
    expect(newState.moves).toBe(0);
    expect(newState.matchedPairs).toBe(0);
    expect(newState.isPlaying).toBe(true);
    expect(newState.gameStatus).toBe('playing');
    expect(newState.cards.length).toBeGreaterThan(0);
  });

  it('should pause and resume game correctly', () => {
    const testState: GameState = {
      ...initialState,
      cards: [
        { id: 'card-1', imageId: 'base', isFlipped: false, isMatched: false },
      ],
      isPlaying: true,
      isPaused: false,
      gameStatus: 'playing',
    };

    // Pause the game
    const pauseAction: GameAction = { type: 'PAUSE_GAME' };
    const pausedState = gameReducer(testState, pauseAction);

    expect(pausedState.isPaused).toBe(true);
    expect(pausedState.isPlaying).toBe(true);

    // Resume the game
    const resumeAction: GameAction = { type: 'RESUME_GAME' };
    const resumedState = gameReducer(pausedState, resumeAction);

    expect(resumedState.isPaused).toBe(false);
    expect(resumedState.isPlaying).toBe(true);
  });

  it('should not tick timer when game is paused', () => {
    const testState: GameState = {
      ...initialState,
      cards: [
        { id: 'card-1', imageId: 'base', isFlipped: false, isMatched: false },
      ],
      timeRemaining: 60,
      isPlaying: true,
      isPaused: true, // Game is paused
      gameStatus: 'playing',
    };

    const action: GameAction = { type: 'TICK_TIMER' };
    const newState = gameReducer(testState, action);

    // Time should not decrease
    expect(newState.timeRemaining).toBe(60);
  });

  it('should not allow flipping cards when game is paused', () => {
    const card1: Card = {
      id: 'card-1',
      imageId: 'base',
      isFlipped: false,
      isMatched: false,
    };

    const testState: GameState = {
      ...initialState,
      cards: [card1],
      isPlaying: true,
      isPaused: true, // Game is paused
      gameStatus: 'playing',
    };

    const action: GameAction = { type: 'FLIP_CARD', cardId: 'card-1' };
    const newState = gameReducer(testState, action);

    // State should remain unchanged
    expect(newState).toEqual(testState);
  });
});
