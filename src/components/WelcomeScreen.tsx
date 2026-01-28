/**
 * WelcomeScreen Component
 * 
 * Onboarding screen that explains the game and how to get started.
 * Required by Base Featured Guidelines - Onboarding Flow requirement.
 * 
 * Features:
 * - Clear explanation of game purpose
 * - Instructions on how to play
 * - Visual appeal with BASE branding
 * - Easy dismissal to start playing
 */

import { useState, useEffect } from 'react';
import './WelcomeScreen.css';

export interface WelcomeScreenProps {
  /** Callback when user dismisses the welcome screen */
  onDismiss: () => void;
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for fade out animation
  };

  return (
    <div className={`welcome-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>Welcome to Memory Match BASE</h1>
          <p className="welcome-subtitle">Master the BASE ecosystem through memory!</p>
        </div>

        <div className="welcome-body">
          <div className="welcome-section">
            <div className="welcome-icon">🎮</div>
            <h2>How to Play</h2>
            <p>
              Match pairs of BASE ecosystem project cards by flipping them over.
              Find all pairs to complete the level!
            </p>
          </div>

          <div className="welcome-section">
            <div className="welcome-icon">🎯</div>
            <h2>100 Levels</h2>
            <p>
              Progress through 100 challenging levels, from easy 4×4 grids
              to expert 8×8 grids. Each level features different BASE projects.
            </p>
          </div>

          <div className="welcome-section">
            <div className="welcome-icon">⭐</div>
            <h2>Earn Stars</h2>
            <p>
              Complete levels quickly to earn up to 3 stars. Beat your best time
              and master every level!
            </p>
          </div>

          <div className="welcome-section">
            <div className="welcome-icon">💾</div>
            <h2>Save Progress</h2>
            <p>
              Your progress is saved locally and can be synced to the blockchain.
              All transactions are sponsored - play for free!
            </p>
          </div>
        </div>

        <div className="welcome-footer">
          <button 
            className="welcome-button"
            onClick={handleDismiss}
            aria-label="Start playing"
          >
            Start Playing
          </button>
          <p className="welcome-note">
            Connect your wallet to save progress on-chain
          </p>
        </div>
      </div>
    </div>
  );
}
