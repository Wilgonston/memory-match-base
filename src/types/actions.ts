/**
 * Game action type definitions for state management
 */

/**
 * Game actions for reducer
 */
export type GameAction =
  | { type: 'START_LEVEL'; level: number }
  | { type: 'FLIP_CARD'; cardId: string }
  | { type: 'MATCH_FOUND'; cardIds: [string, string] }
  | { type: 'NO_MATCH'; cardIds: [string, string] }
  | { type: 'TICK_TIMER' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESTART_LEVEL' }
  | { type: 'COMPLETE_LEVEL' }
  | { type: 'FAIL_LEVEL' };
