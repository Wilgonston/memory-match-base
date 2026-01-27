/**
 * Header Component
 * 
 * Displays game information: level number, timer, and move counter.
 * Provides responsive layout for different screen sizes.
 * Includes wallet connection button and identity display for blockchain features.
 * 
 * Requirements: 4.7, 5.3, 5.4, 5.5, 5.6, 6.1, 11.1, 15.6, 16.4
 */

import React from 'react';
import { formatTime } from '../utils/timeFormat';
import { SoundToggle } from './SoundToggle';
import { NetworkSwitcher } from './NetworkSwitcher';
import './Header.css';

export interface HeaderProps {
  /** Current level number (1-100) */
  level: number;
  /** Number of moves made */
  moves: number;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Optional callback for logout */
  onLogout?: () => void;
}

/**
 * Header component displaying game status information
 */
export const Header: React.FC<HeaderProps> = ({ level, moves, timeRemaining, onLogout }) => {
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

        {/* Network Switcher */}
        <div className="header-item network-display">
          <NetworkSwitcher />
        </div>

        {/* Sound Toggle */}
        <div className="header-item sound-display">
          <SoundToggle />
        </div>

        {/* Logout Button */}
        {onLogout && (
          <div className="header-item logout-display">
            <button 
              className="logout-button"
              onClick={onLogout}
              aria-label="Logout"
              type="button"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="logout-icon"
              >
                <path 
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
