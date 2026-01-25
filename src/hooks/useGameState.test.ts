/**
 * Unit tests for useGameState hook
 * 
 * Tests verify that the hook correctly initializes state and provides
 * a working dispatch function for game actions.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';

describe('useGameState', () => {
  it('should initialize with default game state', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.state).toEqual({
      level: 1,
      cards: [],
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeRemaining: 0,
      isPlaying: false,
      isPaused: false,
      gameStatus: 'playing',
    });
  });

  it('should provide a dispatch function', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.dispatch).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('should update state when START_LEVEL action is dispatched', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // After starting level 1, state should be updated
    expect(result.current.state.level).toBe(1);
    expect(result.current.state.isPlaying).toBe(true);
    expect(result.current.state.isPaused).toBe(false);
    expect(result.current.state.gameStatus).toBe('playing');
    expect(result.current.state.cards.length).toBe(16); // 4x4 grid for level 1
    expect(result.current.state.timeRemaining).toBe(60); // 60 seconds for level 1
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.matchedPairs).toBe(0);
  });

  it('should handle FLIP_CARD action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level first
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    const firstCardId = result.current.state.cards[0].id;

    // Flip the first card
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: firstCardId });
    });

    // Card should be flipped
    const flippedCard = result.current.state.cards.find(c => c.id === firstCardId);
    expect(flippedCard?.isFlipped).toBe(true);
    expect(result.current.state.flippedCards).toContain(firstCardId);
  });

  it('should handle PAUSE_GAME and RESUME_GAME actions', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level first
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // Pause the game
    act(() => {
      result.current.dispatch({ type: 'PAUSE_GAME' });
    });

    expect(result.current.state.isPaused).toBe(true);

    // Resume the game
    act(() => {
      result.current.dispatch({ type: 'RESUME_GAME' });
    });

    expect(result.current.state.isPaused).toBe(false);
  });

  it('should handle RESTART_LEVEL action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 5 });
    });

    const initialCards = result.current.state.cards;

    // Make some moves
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: initialCards[0].id });
    });

    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: initialCards[1].id });
    });

    // Restart the level
    act(() => {
      result.current.dispatch({ type: 'RESTART_LEVEL' });
    });

    // State should be reset for the same level
    expect(result.current.state.level).toBe(5);
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.matchedPairs).toBe(0);
    expect(result.current.state.flippedCards).toEqual([]);
    expect(result.current.state.isPlaying).toBe(true);
    expect(result.current.state.gameStatus).toBe('playing');
  });

  it('should handle MATCH_FOUND action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // Find two cards with the same imageId
    const cards = result.current.state.cards;
    const firstImageId = cards[0].imageId;
    const matchingCards = cards.filter(c => c.imageId === firstImageId);
    const [card1, card2] = matchingCards;

    // Flip both cards
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: card1.id });
    });

    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: card2.id });
    });

    // Dispatch match found
    act(() => {
      result.current.dispatch({ type: 'MATCH_FOUND', cardIds: [card1.id, card2.id] });
    });

    // Cards should be marked as matched
    const updatedCard1 = result.current.state.cards.find(c => c.id === card1.id);
    const updatedCard2 = result.current.state.cards.find(c => c.id === card2.id);
    expect(updatedCard1?.isMatched).toBe(true);
    expect(updatedCard2?.isMatched).toBe(true);
    expect(result.current.state.matchedPairs).toBe(1);
    expect(result.current.state.moves).toBe(1);
    expect(result.current.state.flippedCards).toEqual([]);
  });

  it('should handle NO_MATCH action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // Find two cards with different imageIds
    const cards = result.current.state.cards;
    let card1 = cards[0];
    let card2 = cards.find(c => c.imageId !== card1.imageId);

    if (!card2) {
      // Fallback if all cards have same imageId (shouldn't happen)
      card2 = cards[1];
    }

    // Flip both cards
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: card1.id });
    });

    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId: card2.id });
    });

    // Dispatch no match
    act(() => {
      result.current.dispatch({ type: 'NO_MATCH', cardIds: [card1.id, card2.id] });
    });

    // Cards should be flipped back
    const updatedCard1 = result.current.state.cards.find(c => c.id === card1.id);
    const updatedCard2 = result.current.state.cards.find(c => c.id === card2.id);
    expect(updatedCard1?.isFlipped).toBe(false);
    expect(updatedCard2?.isFlipped).toBe(false);
    expect(result.current.state.moves).toBe(1);
    expect(result.current.state.flippedCards).toEqual([]);
  });

  it('should handle TICK_TIMER action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    const initialTime = result.current.state.timeRemaining;

    // Tick the timer
    act(() => {
      result.current.dispatch({ type: 'TICK_TIMER' });
    });

    expect(result.current.state.timeRemaining).toBe(initialTime - 1);
  });

  it('should handle COMPLETE_LEVEL action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // Complete the level
    act(() => {
      result.current.dispatch({ type: 'COMPLETE_LEVEL' });
    });

    expect(result.current.state.gameStatus).toBe('won');
    expect(result.current.state.isPlaying).toBe(false);
  });

  it('should handle FAIL_LEVEL action', () => {
    const { result } = renderHook(() => useGameState());

    // Start a level
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 1 });
    });

    // Fail the level
    act(() => {
      result.current.dispatch({ type: 'FAIL_LEVEL' });
    });

    expect(result.current.state.gameStatus).toBe('lost');
    expect(result.current.state.isPlaying).toBe(false);
  });

  it('should maintain state consistency across multiple actions', () => {
    const { result } = renderHook(() => useGameState());

    // Start level 3
    act(() => {
      result.current.dispatch({ type: 'START_LEVEL', level: 3 });
    });

    expect(result.current.state.level).toBe(3);
    expect(result.current.state.isPlaying).toBe(true);

    // Pause
    act(() => {
      result.current.dispatch({ type: 'PAUSE_GAME' });
    });

    expect(result.current.state.isPaused).toBe(true);

    // Try to flip a card while paused (should be ignored)
    const cardId = result.current.state.cards[0].id;
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId });
    });

    const card = result.current.state.cards.find(c => c.id === cardId);
    expect(card?.isFlipped).toBe(false); // Should not be flipped

    // Resume
    act(() => {
      result.current.dispatch({ type: 'RESUME_GAME' });
    });

    expect(result.current.state.isPaused).toBe(false);

    // Now flip should work
    act(() => {
      result.current.dispatch({ type: 'FLIP_CARD', cardId });
    });

    const cardAfterResume = result.current.state.cards.find(c => c.id === cardId);
    expect(cardAfterResume?.isFlipped).toBe(true);
  });
});
