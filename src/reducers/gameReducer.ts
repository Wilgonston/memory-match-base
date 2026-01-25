/**
 * Game state reducer for Memory Match BASE
 * 
 * This module implements the game state management logic using a reducer pattern.
 * It handles all game actions including card flipping, matching, timer updates,
 * and game flow control (pause, resume, restart, completion).
 * 
 * Requirements:
 * - 2.1: Card flipping mechanics
 * - 2.2: Prevent flipping when two cards are already flipped
 * - 3.1: Compare flipped cards
 * - 3.2: Mark matched cards and keep them face-up
 * - 3.3: Flip non-matching cards back after delay
 * - 3.4: Trigger level completion when all pairs matched
 * - 3.5: Increment move counter after each pair of flips
 * - 4.1: Timer countdown
 * - 4.5: Trigger level failure when timer reaches zero
 * - 4.6: Stop timer when all pairs matched
 */

import type { GameState } from '../types/game';
import type { GameAction } from '../types/actions';
import { getLevelConfig } from '../utils/levelConfig';
import { generateCards } from '../utils/cardGenerator';
import { projects } from '../data/projects';

/**
 * Initial game state
 */
const initialState: GameState = {
  level: 1,
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  timeRemaining: 0,
  isPlaying: false,
  isPaused: false,
  gameStatus: 'playing',
};

/**
 * Game reducer function that handles all game state transitions
 * 
 * @param state - Current game state
 * @param action - Action to perform
 * @returns New game state
 * 
 * @example
 * ```typescript
 * const state = gameReducer(initialState, { type: 'START_LEVEL', level: 1 });
 * const newState = gameReducer(state, { type: 'FLIP_CARD', cardId: 'base-1' });
 * ```
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_LEVEL': {
      // Get level configuration
      const config = getLevelConfig(action.level);
      
      // Generate cards for the level
      const cards = generateCards(config.gridSize, projects);
      
      // Initialize game state for new level
      return {
        level: action.level,
        cards,
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeRemaining: config.timeLimit,
        isPlaying: true,
        isPaused: false,
        gameStatus: 'playing',
      };
    }

    case 'FLIP_CARD': {
      // Don't allow flipping if game is not playing or is paused
      if (!state.isPlaying || state.isPaused) {
        return state;
      }

      // Don't allow flipping more than 2 cards at once (Requirement 2.3)
      if (state.flippedCards.length >= 2) {
        return state;
      }

      // Find the card to flip
      const card = state.cards.find(c => c.id === action.cardId);
      
      // Don't flip if card doesn't exist, is already flipped, or is already matched (Requirement 2.2)
      if (!card || card.isFlipped || card.isMatched) {
        return state;
      }

      // Flip the card
      const updatedCards = state.cards.map(c =>
        c.id === action.cardId ? { ...c, isFlipped: true } : c
      );

      const newFlippedCards = [...state.flippedCards, action.cardId];

      return {
        ...state,
        cards: updatedCards,
        flippedCards: newFlippedCards,
      };
    }

    case 'MATCH_FOUND': {
      const [cardId1, cardId2] = action.cardIds;

      // Mark both cards as matched (Requirement 3.2)
      const updatedCards = state.cards.map(c =>
        c.id === cardId1 || c.id === cardId2
          ? { ...c, isMatched: true, isFlipped: true }
          : c
      );

      const newMatchedPairs = state.matchedPairs + 1;
      const totalPairs = state.cards.length / 2;

      // Increment move counter (Requirement 3.5)
      const newMoves = state.moves + 1;

      // Check if all pairs are matched (Requirement 3.4)
      const allMatched = newMatchedPairs === totalPairs;

      return {
        ...state,
        cards: updatedCards,
        flippedCards: [],
        matchedPairs: newMatchedPairs,
        moves: newMoves,
        gameStatus: allMatched ? 'won' : 'playing',
        isPlaying: !allMatched, // Stop playing when all matched (Requirement 4.6)
      };
    }

    case 'NO_MATCH': {
      const [cardId1, cardId2] = action.cardIds;

      // Flip both cards back face-down (Requirement 3.3)
      const updatedCards = state.cards.map(c =>
        c.id === cardId1 || c.id === cardId2
          ? { ...c, isFlipped: false }
          : c
      );

      // Increment move counter (Requirement 3.5)
      const newMoves = state.moves + 1;

      return {
        ...state,
        cards: updatedCards,
        flippedCards: [],
        moves: newMoves,
      };
    }

    case 'TICK_TIMER': {
      // Don't tick if game is not playing or is paused
      if (!state.isPlaying || state.isPaused) {
        return state;
      }

      const newTimeRemaining = Math.max(0, state.timeRemaining - 1);

      // Check if time has run out (Requirement 4.5)
      if (newTimeRemaining === 0 && state.gameStatus === 'playing') {
        return {
          ...state,
          timeRemaining: 0,
          isPlaying: false,
          gameStatus: 'lost',
        };
      }

      return {
        ...state,
        timeRemaining: newTimeRemaining,
      };
    }

    case 'PAUSE_GAME': {
      // Only pause if game is currently playing
      if (!state.isPlaying || state.gameStatus !== 'playing') {
        return state;
      }

      return {
        ...state,
        isPaused: true,
      };
    }

    case 'RESUME_GAME': {
      // Only resume if game is paused
      if (!state.isPaused) {
        return state;
      }

      return {
        ...state,
        isPaused: false,
      };
    }

    case 'RESTART_LEVEL': {
      // Restart the current level by starting it again
      return gameReducer(state, { type: 'START_LEVEL', level: state.level });
    }

    case 'COMPLETE_LEVEL': {
      // Mark level as complete
      return {
        ...state,
        isPlaying: false,
        gameStatus: 'won',
      };
    }

    case 'FAIL_LEVEL': {
      // Mark level as failed
      return {
        ...state,
        isPlaying: false,
        gameStatus: 'lost',
      };
    }

    default:
      return state;
  }
}

/**
 * Export initial state for use in components
 */
export { initialState };
