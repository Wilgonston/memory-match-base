import { describe, it, expect } from 'vitest';
import type { Card, GameState, LevelConfig, ProgressData, ProjectImage } from './game';
import type { GameAction } from './actions';

describe('Type Definitions', () => {
  describe('Card type', () => {
    it('should allow creating a valid Card object', () => {
      const card: Card = {
        id: 'card-1',
        imageId: 'base-logo',
        isFlipped: false,
        isMatched: false,
      };

      expect(card.id).toBe('card-1');
      expect(card.imageId).toBe('base-logo');
      expect(card.isFlipped).toBe(false);
      expect(card.isMatched).toBe(false);
    });
  });

  describe('GameState type', () => {
    it('should allow creating a valid GameState object', () => {
      const gameState: GameState = {
        level: 1,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeRemaining: 60,
        isPlaying: true,
        isPaused: false,
        gameStatus: 'playing',
      };

      expect(gameState.level).toBe(1);
      expect(gameState.cards).toEqual([]);
      expect(gameState.gameStatus).toBe('playing');
    });

    it('should enforce valid gameStatus values', () => {
      const playingState: GameState = {
        level: 1,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeRemaining: 60,
        isPlaying: true,
        isPaused: false,
        gameStatus: 'playing',
      };

      const wonState: GameState = { ...playingState, gameStatus: 'won' };
      const lostState: GameState = { ...playingState, gameStatus: 'lost' };

      expect(playingState.gameStatus).toBe('playing');
      expect(wonState.gameStatus).toBe('won');
      expect(lostState.gameStatus).toBe('lost');
    });
  });

  describe('LevelConfig type', () => {
    it('should allow creating a valid LevelConfig object', () => {
      const config: LevelConfig = {
        level: 1,
        gridSize: 4,
        timeLimit: 60,
        optimalMoves: 12,
        acceptableMoves: 16,
      };

      expect(config.level).toBe(1);
      expect(config.gridSize).toBe(4);
      expect(config.timeLimit).toBe(60);
    });

    it('should enforce valid gridSize values', () => {
      const config4: LevelConfig = {
        level: 1,
        gridSize: 4,
        timeLimit: 60,
        optimalMoves: 12,
        acceptableMoves: 16,
      };

      const config6: LevelConfig = {
        level: 26,
        gridSize: 6,
        timeLimit: 90,
        optimalMoves: 24,
        acceptableMoves: 32,
      };

      const config8: LevelConfig = {
        level: 61,
        gridSize: 8,
        timeLimit: 120,
        optimalMoves: 40,
        acceptableMoves: 52,
      };

      expect(config4.gridSize).toBe(4);
      expect(config6.gridSize).toBe(6);
      expect(config8.gridSize).toBe(8);
    });
  });

  describe('ProgressData type', () => {
    it('should allow creating a valid ProgressData object', () => {
      const progress: ProgressData = {
        completedLevels: new Set([1, 2, 3]),
        levelStars: new Map([
          [1, 3],
          [2, 2],
          [3, 1],
        ]),
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };

      expect(progress.completedLevels.size).toBe(3);
      expect(progress.levelStars.get(1)).toBe(3);
      expect(progress.highestUnlockedLevel).toBe(4);
      expect(progress.soundEnabled).toBe(true);
    });
  });

  describe('ProjectImage type', () => {
    it('should allow creating a valid ProjectImage object', () => {
      const image: ProjectImage = {
        id: 'base-logo',
        name: 'BASE',
        imagePath: '/assets/projects/base.svg',
      };

      expect(image.id).toBe('base-logo');
      expect(image.name).toBe('BASE');
      expect(image.imagePath).toBe('/assets/projects/base.svg');
    });
  });

  describe('GameAction type', () => {
    it('should allow creating valid action objects', () => {
      const startAction: GameAction = { type: 'START_LEVEL', level: 1 };
      const flipAction: GameAction = { type: 'FLIP_CARD', cardId: 'card-1' };
      const matchAction: GameAction = { type: 'MATCH_FOUND', cardIds: ['card-1', 'card-2'] };
      const noMatchAction: GameAction = { type: 'NO_MATCH', cardIds: ['card-1', 'card-3'] };
      const tickAction: GameAction = { type: 'TICK_TIMER' };
      const pauseAction: GameAction = { type: 'PAUSE_GAME' };
      const resumeAction: GameAction = { type: 'RESUME_GAME' };
      const restartAction: GameAction = { type: 'RESTART_LEVEL' };
      const completeAction: GameAction = { type: 'COMPLETE_LEVEL' };
      const failAction: GameAction = { type: 'FAIL_LEVEL' };

      expect(startAction.type).toBe('START_LEVEL');
      expect(flipAction.type).toBe('FLIP_CARD');
      expect(matchAction.type).toBe('MATCH_FOUND');
      expect(noMatchAction.type).toBe('NO_MATCH');
      expect(tickAction.type).toBe('TICK_TIMER');
      expect(pauseAction.type).toBe('PAUSE_GAME');
      expect(resumeAction.type).toBe('RESUME_GAME');
      expect(restartAction.type).toBe('RESTART_LEVEL');
      expect(completeAction.type).toBe('COMPLETE_LEVEL');
      expect(failAction.type).toBe('FAIL_LEVEL');
    });

    it('should enforce tuple type for cardIds in MATCH_FOUND and NO_MATCH', () => {
      const matchAction: GameAction = { type: 'MATCH_FOUND', cardIds: ['card-1', 'card-2'] };
      const noMatchAction: GameAction = { type: 'NO_MATCH', cardIds: ['card-3', 'card-4'] };

      expect(matchAction.cardIds).toHaveLength(2);
      expect(noMatchAction.cardIds).toHaveLength(2);
    });
  });

  describe('Type compilation tests', () => {
    it('should compile Card with all required properties', () => {
      const card: Card = {
        id: 'test-id',
        imageId: 'test-image',
        isFlipped: true,
        isMatched: false,
      };

      // TypeScript ensures all properties are present
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('imageId');
      expect(card).toHaveProperty('isFlipped');
      expect(card).toHaveProperty('isMatched');
    });

    it('should compile GameState with all required properties', () => {
      const state: GameState = {
        level: 1,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeRemaining: 60,
        isPlaying: true,
        isPaused: false,
        gameStatus: 'playing',
      };

      // TypeScript ensures all properties are present
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('cards');
      expect(state).toHaveProperty('flippedCards');
      expect(state).toHaveProperty('matchedPairs');
      expect(state).toHaveProperty('moves');
      expect(state).toHaveProperty('timeRemaining');
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('gameStatus');
    });

    it('should compile LevelConfig with all required properties', () => {
      const config: LevelConfig = {
        level: 1,
        gridSize: 4,
        timeLimit: 60,
        optimalMoves: 12,
        acceptableMoves: 16,
      };

      // TypeScript ensures all properties are present
      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('gridSize');
      expect(config).toHaveProperty('timeLimit');
      expect(config).toHaveProperty('optimalMoves');
      expect(config).toHaveProperty('acceptableMoves');
    });

    it('should compile ProgressData with all required properties', () => {
      const progress: ProgressData = {
        completedLevels: new Set(),
        levelStars: new Map(),
        highestUnlockedLevel: 1,
        soundEnabled: true,
      };

      // TypeScript ensures all properties are present
      expect(progress).toHaveProperty('completedLevels');
      expect(progress).toHaveProperty('levelStars');
      expect(progress).toHaveProperty('highestUnlockedLevel');
      expect(progress).toHaveProperty('soundEnabled');
    });

    it('should compile ProjectImage with all required properties', () => {
      const image: ProjectImage = {
        id: 'test-id',
        name: 'Test Project',
        imagePath: '/path/to/image.png',
      };

      // TypeScript ensures all properties are present
      expect(image).toHaveProperty('id');
      expect(image).toHaveProperty('name');
      expect(image).toHaveProperty('imagePath');
    });
  });

  describe('Type constraints', () => {
    it('should only allow valid gridSize values (4, 6, or 8)', () => {
      const config4: LevelConfig = { level: 1, gridSize: 4, timeLimit: 60, optimalMoves: 12, acceptableMoves: 16 };
      const config6: LevelConfig = { level: 26, gridSize: 6, timeLimit: 90, optimalMoves: 24, acceptableMoves: 32 };
      const config8: LevelConfig = { level: 61, gridSize: 8, timeLimit: 120, optimalMoves: 40, acceptableMoves: 52 };

      expect([4, 6, 8]).toContain(config4.gridSize);
      expect([4, 6, 8]).toContain(config6.gridSize);
      expect([4, 6, 8]).toContain(config8.gridSize);
    });

    it('should only allow valid gameStatus values', () => {
      const validStatuses: Array<GameState['gameStatus']> = ['playing', 'won', 'lost'];
      
      validStatuses.forEach(status => {
        const state: GameState = {
          level: 1,
          cards: [],
          flippedCards: [],
          matchedPairs: 0,
          moves: 0,
          timeRemaining: 60,
          isPlaying: true,
          isPaused: false,
          gameStatus: status,
        };
        
        expect(['playing', 'won', 'lost']).toContain(state.gameStatus);
      });
    });

    it('should handle boolean flags correctly', () => {
      const card: Card = {
        id: 'test',
        imageId: 'test',
        isFlipped: false,
        isMatched: false,
      };

      expect(typeof card.isFlipped).toBe('boolean');
      expect(typeof card.isMatched).toBe('boolean');

      const state: GameState = {
        level: 1,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeRemaining: 60,
        isPlaying: true,
        isPaused: false,
        gameStatus: 'playing',
      };

      expect(typeof state.isPlaying).toBe('boolean');
      expect(typeof state.isPaused).toBe('boolean');
    });
  });
});
