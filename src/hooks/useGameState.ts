/**
 * Custom hook for game state management using useReducer
 * 
 * This hook provides a clean interface for managing game state throughout
 * the application. It wraps the gameReducer and provides both the current
 * state and dispatch function for triggering game actions.
 * 
 * Requirements:
 * - All game state management requirements
 * - Provides centralized state management for the game
 * - Enables components to access and update game state
 * 
 * @example
 * ```typescript
 * function GameBoard() {
 *   const { state, dispatch } = useGameState();
 *   
 *   const handleStartLevel = (level: number) => {
 *     dispatch({ type: 'START_LEVEL', level });
 *   };
 *   
 *   const handleCardClick = (cardId: string) => {
 *     dispatch({ type: 'FLIP_CARD', cardId });
 *   };
 *   
 *   return <div>Level: {state.level}</div>;
 * }
 * ```
 */

import { useReducer, Dispatch } from 'react';
import { gameReducer, initialState } from '../reducers/gameReducer';
import type { GameState } from '../types/game';
import type { GameAction } from '../types/actions';

/**
 * Return type for useGameState hook
 */
export interface UseGameStateReturn {
  /** Current game state */
  state: GameState;
  /** Dispatch function for game actions */
  dispatch: Dispatch<GameAction>;
}

/**
 * Custom hook for managing game state with useReducer
 * 
 * This hook initializes the game state using the gameReducer and provides
 * access to both the current state and the dispatch function for triggering
 * state updates.
 * 
 * @returns Object containing game state and dispatch function
 * 
 * @example
 * ```typescript
 * const { state, dispatch } = useGameState();
 * 
 * // Start a new level
 * dispatch({ type: 'START_LEVEL', level: 1 });
 * 
 * // Flip a card
 * dispatch({ type: 'FLIP_CARD', cardId: 'base-1' });
 * 
 * // Check for match
 * if (state.flippedCards.length === 2) {
 *   const [card1, card2] = state.flippedCards.map(id => 
 *     state.cards.find(c => c.id === id)
 *   );
 *   
 *   if (card1?.imageId === card2?.imageId) {
 *     dispatch({ type: 'MATCH_FOUND', cardIds: [card1.id, card2.id] });
 *   } else {
 *     dispatch({ type: 'NO_MATCH', cardIds: [card1.id, card2.id] });
 *   }
 * }
 * 
 * // Pause the game
 * dispatch({ type: 'PAUSE_GAME' });
 * 
 * // Resume the game
 * dispatch({ type: 'RESUME_GAME' });
 * 
 * // Restart current level
 * dispatch({ type: 'RESTART_LEVEL' });
 * ```
 */
export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return {
    state,
    dispatch,
  };
}
