/**
 * Core game type definitions for Memory Match BASE
 */

/**
 * Card type representing a single game card
 */
export interface Card {
  /** Unique identifier for the card */
  id: string;
  /** ID of the BASE project image */
  imageId: string;
  /** Whether card is face-up */
  isFlipped: boolean;
  /** Whether card has been matched */
  isMatched: boolean;
}

/**
 * Game state representing current game session
 */
export interface GameState {
  /** Current level (1-100) */
  level: number;
  /** Array of cards on the board */
  cards: Card[];
  /** IDs of currently flipped cards */
  flippedCards: string[];
  /** Number of matched pairs */
  matchedPairs: number;
  /** Number of moves made */
  moves: number;
  /** Seconds remaining */
  timeRemaining: number;
  /** Whether game is active */
  isPlaying: boolean;
  /** Whether game is paused */
  isPaused: boolean;
  /** Current game status */
  gameStatus: 'playing' | 'won' | 'lost';
}

/**
 * Level configuration
 */
export interface LevelConfig {
  /** Level number */
  level: number;
  /** Grid dimensions (4x4, 6x6, 8x8) */
  gridSize: 4 | 6 | 8;
  /** Time limit in seconds */
  timeLimit: number;
  /** Moves for 3 stars */
  optimalMoves: number;
  /** Moves for 2 stars */
  acceptableMoves: number;
}

/**
 * Progress data stored in LocalStorage
 */
export interface ProgressData {
  /** Set of completed level numbers */
  completedLevels: Set<number>;
  /** Map of level number to stars (1-3) */
  levelStars: Map<number, number>;
  /** Highest unlocked level */
  highestUnlockedLevel: number;
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
}

/**
 * BASE project image
 */
export interface ProjectImage {
  /** Unique identifier */
  id: string;
  /** Project name */
  name: string;
  /** Path to image file */
  imagePath: string;
}
