/**
 * Header Component
 * 
 * Displays game information: level number, timer, and move counter.
 * Provides responsive layout for different screen sizes.
 * Includes wallet connection button for blockchain features.
 * 
 * Requirements: 4.7, 5.4, 6.1, 11.1, 15.6, 16.4
 */

import React from 'react';
import { formatTime } from '../utils/timeFormat';
import { WalletButton } from './WalletButton';
import './Header.css';

export interface HeaderProps {
  /** Current level number (1-100) */
  level: number;
  /** Number of moves made */
  moves: number;
  /** Time remaining in seconds */
  timeRemaining: number;
}

/**
 * Header component displaying game status information
 */
export const Header: React.FC<HeaderProps> = ({ level, moves, timeRemaining }) => {
  return (
    <header className="game-header" role="banner">
      <div className="header-container">
        {/* Level Display */}
        <div className="header-item level-display">
          <span className="header-label">Level</span>
          <span className="header-value" aria-label={`Level ${level}`}>
            {level}
          </span>
        </div>

        {/* Timer Display */}
        <div className="header-item timer-display">
          <span className="header-label">Time</span>
          <span 
            className={`header-value ${timeRemaining <= 10 ? 'time-warning' : ''}`}
            aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Moves Counter */}
        <div className="header-item moves-display">
          <span className="header-label">Moves</span>
          <span className="header-value" aria-label={`${moves} moves made`}>
            {moves}
          </span>
        </div>

        {/* Wallet Connection Button */}
        <div className="header-item wallet-display">
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
