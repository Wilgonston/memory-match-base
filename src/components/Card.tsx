/**
 * Card Component
 * 
 * Displays a single memory card with flip animation.
 * Shows project logo when flipped, back design when face-down.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 9.1
 */

import React from 'react';
import { Card as CardType } from '../types';
import { getProjectById } from '../data/projects';
import './Card.css';

export interface CardProps {
  /** Card data */
  card: CardType;
  /** Click handler */
  onClick: (cardId: string) => void;
  /** Whether card is disabled (prevents clicks) */
  disabled: boolean;
}

/**
 * Card component with flip animation
 */
export const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  const project = getProjectById(card.imageId);
  
  const handleClick = () => {
    if (!disabled && !card.isFlipped) {
      onClick(card.id);
    }
  };

  const cardClasses = [
    'memory-card',
    card.isFlipped ? 'flipped' : '',
    card.isMatched ? 'matched' : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={card.isFlipped ? `${project?.name || 'Unknown'} card` : 'Face-down card'}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !card.isFlipped) {
          e.preventDefault();
          onClick(card.id);
        }
      }}
    >
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-face card-back">
          <img 
            src="/assets/projects/card-back.svg" 
            alt="Card back"
            onError={(e) => {
              e.currentTarget.src = '/assets/projects/fallback.svg';
            }}
          />
        </div>
        
        {/* Card Front */}
        <div className="card-face card-front">
          <img 
            src={project?.imagePath || '/assets/projects/fallback.svg'}
            alt={project?.name || 'Unknown project'}
            onError={(e) => {
              e.currentTarget.src = '/assets/projects/fallback.svg';
            }}
          />
        </div>
      </div>
    </div>
  );
};
