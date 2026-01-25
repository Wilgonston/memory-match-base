/**
 * Demo/Example usage of useGameState hook
 * 
 * This file demonstrates how to use the useGameState hook in a component.
 * It's not meant to be run, but serves as documentation and examples.
 */

import { useEffect } from 'react';
import { useGameState } from './useGameState';

/**
 * Example 1: Basic usage - Starting a level and displaying state
 */
export function BasicGameExample() {
  const { state, dispatch } = useGameState();

  const handleStartLevel = () => {
    dispatch({ type: 'START_LEVEL', level: 1 });
  };

  return (
    <div>
      <h2>Level {state.level}</h2>
      <p>Moves: {state.moves}</p>
      <p>Time: {state.timeRemaining}s</p>
      <p>Matched Pairs: {state.matchedPairs}</p>
      <p>Status: {state.gameStatus}</p>
      <button onClick={handleStartLevel}>Start Level 1</button>
    </div>
  );
}

/**
 * Example 2: Card flipping with match detection
 */
export function CardFlipExample() {
  const { state, dispatch } = useGameState();

  const handleCardClick = (cardId: string) => {
    // Flip the card
    dispatch({ type: 'FLIP_CARD', cardId });
  };

  // Check for matches when two cards are flipped
  useEffect(() => {
    if (state.flippedCards.length === 2) {
      const [cardId1, cardId2] = state.flippedCards;
      const card1 = state.cards.find(c => c.id === cardId1);
      const card2 = state.cards.find(c => c.id === cardId2);

      if (card1 && card2) {
        if (card1.imageId === card2.imageId) {
          // Match found
          setTimeout(() => {
            dispatch({ type: 'MATCH_FOUND', cardIds: [cardId1, cardId2] });
          }, 500);
        } else {
          // No match
          setTimeout(() => {
            dispatch({ type: 'NO_MATCH', cardIds: [cardId1, cardId2] });
          }, 1000);
        }
      }
    }
  }, [state.flippedCards, state.cards, dispatch]);

  return (
    <div>
      <div className="grid">
        {state.cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched}
          >
            {card.isFlipped || card.isMatched ? card.imageId : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 3: Timer implementation
 */
export function TimerExample() {
  const { state, dispatch } = useGameState();

  // Timer countdown
  useEffect(() => {
    if (state.isPlaying && !state.isPaused) {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isPlaying, state.isPaused, dispatch]);

  return (
    <div>
      <p>Time Remaining: {state.timeRemaining}s</p>
      {state.gameStatus === 'lost' && <p>Time's up!</p>}
    </div>
  );
}

/**
 * Example 4: Pause and resume functionality
 */
export function PauseResumeExample() {
  const { state, dispatch } = useGameState();

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  return (
    <div>
      {state.isPaused ? (
        <button onClick={handleResume}>Resume</button>
      ) : (
        <button onClick={handlePause}>Pause</button>
      )}
    </div>
  );
}

/**
 * Example 5: Restart level functionality
 */
export function RestartExample() {
  const { state, dispatch } = useGameState();

  const handleRestart = () => {
    dispatch({ type: 'RESTART_LEVEL' });
  };

  return (
    <div>
      <button onClick={handleRestart}>Restart Level</button>
      <p>Current Level: {state.level}</p>
      <p>Moves: {state.moves}</p>
    </div>
  );
}

/**
 * Example 6: Complete game flow
 */
export function CompleteGameFlowExample() {
  const { state, dispatch } = useGameState();

  useEffect(() => {
    // Start level 1 on mount
    dispatch({ type: 'START_LEVEL', level: 1 });
  }, [dispatch]);

  // Timer
  useEffect(() => {
    if (state.isPlaying && !state.isPaused) {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.isPlaying, state.isPaused, dispatch]);

  // Match detection
  useEffect(() => {
    if (state.flippedCards.length === 2) {
      const [cardId1, cardId2] = state.flippedCards;
      const card1 = state.cards.find(c => c.id === cardId1);
      const card2 = state.cards.find(c => c.id === cardId2);

      if (card1 && card2) {
        if (card1.imageId === card2.imageId) {
          setTimeout(() => {
            dispatch({ type: 'MATCH_FOUND', cardIds: [cardId1, cardId2] });
          }, 500);
        } else {
          setTimeout(() => {
            dispatch({ type: 'NO_MATCH', cardIds: [cardId1, cardId2] });
          }, 1000);
        }
      }
    }
  }, [state.flippedCards, state.cards, dispatch]);

  const handleCardClick = (cardId: string) => {
    dispatch({ type: 'FLIP_CARD', cardId });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const handleRestart = () => {
    dispatch({ type: 'RESTART_LEVEL' });
  };

  const handleNextLevel = () => {
    dispatch({ type: 'START_LEVEL', level: state.level + 1 });
  };

  if (state.gameStatus === 'won') {
    return (
      <div>
        <h2>Level Complete!</h2>
        <p>Moves: {state.moves}</p>
        <button onClick={handleNextLevel}>Next Level</button>
        <button onClick={handleRestart}>Retry</button>
      </div>
    );
  }

  if (state.gameStatus === 'lost') {
    return (
      <div>
        <h2>Time's Up!</h2>
        <button onClick={handleRestart}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h2>Level {state.level}</h2>
        <p>Moves: {state.moves}</p>
        <p>Time: {state.timeRemaining}s</p>
        <button onClick={handlePause}>Pause</button>
        <button onClick={handleRestart}>Restart</button>
      </header>

      {state.isPaused && (
        <div className="pause-overlay">
          <button onClick={handleResume}>Resume</button>
        </div>
      )}

      <div className="grid">
        {state.cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || state.isPaused}
            className={`card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
          >
            {card.isFlipped || card.isMatched ? card.imageId : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
