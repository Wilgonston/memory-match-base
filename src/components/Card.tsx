/**
 * Card Component
 * 
 * Displays a single memory card with flip animation.
 * Shows project logo when flipped, back design when face-down.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 9.1, 15.7
 */

import React from 'react';
import { Card as CardType } from '../types';
import { getProjectById } from '../data/projects';
import { hapticCardFlip } from '../utils/haptics';
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
      hapticCardFlip();
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
          hapticCardFlip();
          onClick(card.id);
        }
      }}
    >
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-face card-back">
          {/* Using CSS gradient background instead of image */}
        </div>
        
        {/* Card Front */}
        <div className="card-face card-front">
          {project?.imagePath ? (
            <img 
              src={project.imagePath}
              alt={project.name || 'Unknown project'}
              loading="lazy"
              onError={(e) => {
                // Hide broken image
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, #0052FF 0%, #0041CC 100%)',
              borderRadius: '8px'
            }} />
          )}
        </div>
      </div>
    </div>
  );
};
