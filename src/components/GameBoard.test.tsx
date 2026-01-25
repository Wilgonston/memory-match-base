import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../test/test-utils';
import { GameBoard } from './GameBoard';
import type { GameState } from '../types/game';

describe('GameBoard Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
    level: 1,
    cards: [
      { id: 'card-1', imageId: 'base', isFlipped: false, isMatched: false },
      { id: 'card-2', imageId: 'base', isFlipped: false, isMatched: false },
      { id: 'card-3', imageId: 'coinbase', isFlipped: false, isMatched: false },
      { id: 'card-4', imageId: 'coinbase', isFlipped: false, isMatched: false },
    ],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timeRemaining: 60,
    isPlaying: true,
    isPaused: false,
    gameStatus: 'playing',
    ...overrides,
  });

  describe('Card Flip Flow', () => {
    it('should dispatch FLIP_CARD action when a card is clicked', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState();

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      const cards = screen.getAllByRole('button', { name: /card/i });
      fireEvent.click(cards[0]);

      expect(onAction).toHaveBeenCalledWith({ type: 'FLIP_CARD', cardId: 'card-1' });
    });

    it('should dispatch MATCH_FOUND when two matching cards are flipped', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState({
        flippedCards: ['card-1', 'card-2'],
        cards: [
          { id: 'card-1', imageId: 'base', isFlipped: true, isMatched: false },
          { id: 'card-2', imageId: 'base', isFlipped: true, isMatched: false },
          { id: 'card-3', imageId: 'coinbase', isFlipped: false, isMatched: false },
          { id: 'card-4', imageId: 'coinbase', isFlipped: false, isMatched: false },
        ],
      });

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      expect(onAction).toHaveBeenCalledWith({ type: 'MATCH_FOUND', cardIds: ['card-1', 'card-2'] });
    });

    it('should dispatch NO_MATCH after 1 second when non-matching cards are flipped', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState({
        flippedCards: ['card-1', 'card-3'],
        cards: [
          { id: 'card-1', imageId: 'base', isFlipped: true, isMatched: false },
          { id: 'card-2', imageId: 'base', isFlipped: false, isMatched: false },
          { id: 'card-3', imageId: 'coinbase', isFlipped: true, isMatched: false },
          { id: 'card-4', imageId: 'coinbase', isFlipped: false, isMatched: false },
        ],
      });

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      expect(onAction).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);

      expect(onAction).toHaveBeenCalledWith({ type: 'NO_MATCH', cardIds: ['card-1', 'card-3'] });
    });
  });

  describe('Timer Countdown', () => {
    it('should dispatch TICK_TIMER every second when game is playing', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState();

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      vi.advanceTimersByTime(1000);
      expect(onAction).toHaveBeenCalledWith({ type: 'TICK_TIMER' });
    });

    it('should not dispatch TICK_TIMER when game is paused', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState({ isPaused: true });

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      vi.advanceTimersByTime(2000);
      expect(onAction).not.toHaveBeenCalledWith({ type: 'TICK_TIMER' });
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should dispatch PAUSE_GAME when pause button is clicked', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState();

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      expect(onAction).toHaveBeenCalledWith({ type: 'PAUSE_GAME' });
    });

    it('should dispatch RESUME_GAME when resume button is clicked', () => {
      const onAction = vi.fn();
      const gameState = createMockGameState({ isPaused: true });

      render(<GameBoard gameState={gameState} onAction={onAction} onLevelSelect={vi.fn()} />);

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
      expect(onAction).toHaveBeenCalledWith({ type: 'RESUME_GAME' });
    });
  });
});
