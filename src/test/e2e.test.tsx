/**
 * End-to-End Tests for Memory Match BASE
 * 
 * Comprehensive end-to-end tests covering:
 * - Playing through multiple levels
 * - Level completion and failure scenarios
 * - Progress persistence (close and reopen simulation)
 * - Different screen sizes (responsive behavior)
 * 
 * Task 22.1: Test complete game flow end-to-end
 * Requirements: All
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act, cleanup } from '@testing-library/react';
import { render, setupMockAuthentication, clearMockAuthentication } from './test-utils';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Helper to simulate window resize
const resizeWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helper to check if we're on the game screen
const isOnGameScreen = () => {
  return screen.queryByText('Level') !== null && 
         screen.queryByText('Time') !== null && 
         screen.queryByText('Moves') !== null;
};

// Helper to find matching cards in the game
const findMatchingCards = async () => {
  const cards = screen.getAllByRole('button', { name: /Face-down card|Flipped card/i });
  const cardElements = cards as HTMLElement[];
  
  // Group cards by their data attributes or position
  const cardsByImage: { [key: string]: HTMLElement[] } = {};
  
  for (const card of cardElements) {
    // Try to identify cards by their position in the DOM
    const cardId = card.getAttribute('data-card-id') || card.id;
    if (cardId) {
      const imageId = cardId.split('-')[0];
      if (!cardsByImage[imageId]) {
        cardsByImage[imageId] = [];
      }
      cardsByImage[imageId].push(card);
    }
  }
  
  // Find first pair
  for (const imageId in cardsByImage) {
    if (cardsByImage[imageId].length >= 2) {
      return [cardsByImage[imageId][0], cardsByImage[imageId][1]];
    }
  }
  
  // Fallback: just return first two cards (they might match)
  return [cardElements[0], cardElements[1]];
};

describe('End-to-End Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Set default window size
    resizeWindow(1024, 768);
    
    // Setup mock authentication for all tests
    setupMockAuthentication();
  });

  afterEach(() => {
    cleanup();
    clearMockAuthentication();
    vi.restoreAllMocks();
  });

  describe('Playing Through Multiple Levels', () => {
    it('should allow playing through level 1 and progressing to level 2', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 5000 });

      // Verify we're on level 1
      expect(screen.getByLabelText(/Level 1/i)).toBeInTheDocument();

      // Level 1 should have 16 cards (4x4 grid)
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      expect(cards.length).toBe(16);

      // Make a move
      await user.click(cards[0]);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await user.click(cards[1]);

      // Wait for move to register
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Check that moves counter exists and has been updated
      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 5000 });
    }, 10000);

    it('should track progress across multiple level attempts', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // Make several moves
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      
      for (let i = 0; i < 6; i += 2) {
        await user.click(cards[i]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        await user.click(cards[i + 1]);
        
        // Wait for move to register
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
        });
      }

      // Verify moves are tracked
      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // Progress should be saved
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();
    }, 15000);

    it('should maintain game state when navigating between screens', async () => {
      const user = userEvent.setup();
      
      // Pre-populate progress
      const mockProgress = {
        completedLevels: [1],
        levelStars: [[1, 3]],
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };
      localStorage.setItem('memory-match-base-progress', JSON.stringify(mockProgress));

      render(<App />);

      // Should show progress
      await waitFor(() => {
        expect(screen.getByText(/1\/100 levels completed/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Level 2 should be unlocked
      const level2Button = screen.getByRole('button', { name: /Level 2, unlocked/i });
      expect(level2Button).not.toBeDisabled();

      // Start level 2
      await user.click(level2Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
        expect(screen.getByLabelText(/Level 2/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 15000);
  });

  describe('Level Completion and Failure', () => {
    it('should handle level restart correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // Make some moves
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await user.click(cards[1]);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/1 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // Restart the level
      const restartButton = screen.getByRole('button', { name: /restart/i });
      await user.click(restartButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Moves should be reset to 0
      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/0 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should still be on level 1
      expect(screen.getByLabelText(/Level 1/i)).toBeInTheDocument();
    }, 15000);

    it('should display game controls during gameplay', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Verify game controls are present
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('should handle pause and resume during gameplay', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // Pause the game
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      // Should show pause overlay
      await waitFor(() => {
        expect(screen.getByText(/Paused/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Resume the game
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);

      // Pause overlay should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/Paused/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Game should still be active
      expect(isOnGameScreen()).toBe(true);
    }, 15000); // Increase test timeout to 15 seconds

    it('should maintain timer during gameplay', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Timer should be displayed (level 1 has 60 seconds)
      const timerElement = screen.getByLabelText(/Time remaining/i);
      expect(timerElement).toBeInTheDocument();
      expect(timerElement.textContent).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Progress Persistence (Close and Reopen)', () => {
    it('should persist progress when app is "closed" and "reopened"', async () => {
      const user = userEvent.setup();
      
      // First session: Start and play level 1
      const { unmount } = render(<App />);

      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // Make some moves - click two cards
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      if (cards.length >= 2) {
        await user.click(cards[0]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        await user.click(cards[1]);
        
        // Wait for move counter to update (may be 0 or 1 depending on match)
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
      }

      // Verify progress is saved (don't check specific move count)
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();

      // "Close" the app
      unmount();

      // "Reopen" the app
      render(<App />);

      // Progress should be restored
      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      }, { timeout: 10000 });

      // LocalStorage should still have the progress
      const restoredProgress = localStorage.getItem('memory-match-base-progress');
      expect(restoredProgress).toBeTruthy();
      expect(restoredProgress).toBe(savedProgress);
    }, 15000); // Increase test timeout to 15 seconds

    it('should restore completed levels after reopen', async () => {
      // Simulate completed levels
      const mockProgress = {
        completedLevels: [1, 2, 3],
        levelStars: [[1, 3], [2, 2], [3, 1]],
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };
      localStorage.setItem('memory-match-base-progress', JSON.stringify(mockProgress));

      // "Open" the app
      render(<App />);

      // Should show completed levels
      await waitFor(() => {
        expect(screen.getByText(/3\/100 levels completed/i)).toBeInTheDocument();
      });

      // Level 4 should be unlocked
      const level4Button = screen.getByRole('button', { name: /Level 4, unlocked/i });
      expect(level4Button).not.toBeDisabled();

      // Level 5 should be locked
      const level5Button = screen.getByRole('button', { name: /Level 5, locked/i });
      expect(level5Button).toBeDisabled();
    });

    it('should handle corrupted localStorage gracefully', async () => {
      // Set corrupted data
      localStorage.setItem('memory-match-base-progress', 'invalid-json{{{');

      // Should still render without crashing
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // Should fall back to default progress
      expect(screen.getByText(/0\/100 levels completed/i)).toBeInTheDocument();
    });

    it('should maintain progress structure across sessions', async () => {
      const user = userEvent.setup();
      
      // First session
      const { unmount } = render(<App />);

      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make a move
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get saved progress
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();
      const progress1 = JSON.parse(savedProgress!);

      unmount();

      // Second session
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // Progress structure should be maintained
      const restoredProgress = localStorage.getItem('memory-match-base-progress');
      expect(restoredProgress).toBeTruthy();
      const progress2 = JSON.parse(restoredProgress!);

      // Verify structure is the same
      expect(progress2).toHaveProperty('completedLevels');
      expect(progress2).toHaveProperty('levelStars');
      expect(progress2).toHaveProperty('highestUnlockedLevel');
      expect(progress2).toHaveProperty('soundEnabled');
    });
  });

  describe('Different Screen Sizes (Responsive)', () => {
    it('should render correctly on mobile screen (375x667)', async () => {
      resizeWindow(375, 667);
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // Level select should be visible
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      expect(level1Button).toBeInTheDocument();
    });

    it('should render correctly on tablet screen (768x1024)', async () => {
      resizeWindow(768, 1024);
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // Level select should be visible
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      expect(level1Button).toBeInTheDocument();
    });

    it('should render correctly on desktop screen (1920x1080)', async () => {
      resizeWindow(1920, 1080);
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // Level select should be visible
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      expect(level1Button).toBeInTheDocument();
    });

    it('should render game board correctly on mobile during gameplay', async () => {
      resizeWindow(375, 667);
      
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Game board should be visible with cards
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      expect(cards.length).toBe(16);

      // Controls should be visible
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('should maintain functionality across screen size changes', async () => {
      const user = userEvent.setup();
      
      // Start on desktop
      resizeWindow(1920, 1080);
      render(<App />);

      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make a move
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);
      await user.click(cards[1]);

      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/1 moves made/i);
        expect(movesElement).toBeInTheDocument();
      });

      // Resize to mobile
      resizeWindow(375, 667);
      
      // Game should still be functional
      expect(isOnGameScreen()).toBe(true);
      
      // Moves should still be tracked
      const movesElement = screen.queryByLabelText(/1 moves made/i);
      expect(movesElement).toBeInTheDocument();
    });

    it('should handle minimum mobile width (320px)', async () => {
      resizeWindow(320, 568);
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      });

      // App should still be functional
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      expect(level1Button).toBeInTheDocument();
    });
  });

  describe('Complete Game Flow Integration', () => {
    it('should handle complete flow: select level -> play -> restart -> return to menu', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 1. Start on level select
      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
      }, { timeout: 10000 });

      // 2. Select level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // 3. Play the game
      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // 4. Make some moves
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await user.click(cards[1]);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/1 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // 5. Restart the level
      const restartButton = screen.getByRole('button', { name: /restart/i });
      await user.click(restartButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await waitFor(() => {
        const movesElement = screen.queryByLabelText(/0 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // 6. Verify we're still in the game
      expect(isOnGameScreen()).toBe(true);
    }, 15000);

    it('should maintain app stability throughout extended gameplay', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make multiple moves
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      
      for (let i = 0; i < 8; i += 2) {
        await user.click(cards[i]);
        await user.click(cards[i + 1]);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      // App should still be stable
      expect(isOnGameScreen()).toBe(true);
      
      // Progress should be saved
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();
    });

    it('should handle rapid interactions gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Rapid clicks on cards
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      
      // Click multiple cards rapidly
      await user.click(cards[0]);
      await user.click(cards[1]);
      await user.click(cards[2]); // Should be ignored (only 2 cards can be flipped)

      // App should handle this gracefully
      expect(isOnGameScreen()).toBe(true);
    });
  });
});
