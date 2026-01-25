/**
 * Grid Component
 * 
 * Renders a responsive grid of Card components.
 * Adapts layout based on grid size (4x4, 6x6, 8x8).
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 10.1, 10.2, 10.3
 */

import React from 'react';
import { Card as CardType } from '../types';
import { Card } from './Card';
import './Grid.css';

export interface GridProps {
  /** Array of cards to display */
  cards: CardType[];
  /** Callback when a card is clicked */
  onCardClick: (cardId: string) => void;
  /** Whether cards are disabled (prevents clicks) */
  disabled?: boolean;
}

/**
 * Grid component with responsive layout
 * Uses React.memo for performance optimization
 */
export const Grid: React.FC<GridProps> = React.memo(({ cards, onCardClick, disabled = false }) => {
  // Calculate grid size based on number of cards
  const totalCards = cards.length;
  const gridSize = Math.sqrt(totalCards);
  
  // Determine grid columns class based on grid size
  const getGridClass = () => {
    if (gridSize === 4) return 'grid-4x4';
    if (gridSize === 6) return 'grid-6x6';
    if (gridSize === 8) return 'grid-8x8';
    return 'grid-4x4'; // fallback
  };

  return (
    <div 
      className={`memory-grid ${getGridClass()}`}
      role="grid"
      aria-label={`${gridSize}x${gridSize} memory card grid`}
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onClick={onCardClick}
          disabled={disabled || card.isMatched}
        />
      ))}
    </div>
  );
});

Grid.displayName = 'Grid';
