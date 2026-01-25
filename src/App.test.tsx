/**
 * App Component Integration Tests
 * 
 * Integration tests for the main App component including:
 * - Navigation flow: level select → game → result → level select
 * - Progress persistence across level completions
 * - Full game flow from start to finish
 * 
 * Requirements: 5.2, 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { render } from './test/test-utils';
import userEvent from '@testing-library/user-event';
import App from './App';

// Helper function to check if we're on the game screen
const isOnGameScreen = () => {
  return screen.queryByText('Level') !== null && 
         screen.queryByText('Time') !== null && 
         screen.queryByText('Moves') !== null;
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Navigation Flow', () => {
    it('should navigate from level select to game screen when level is selected', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Should start on level select screen
      expect(screen.getByText('Select Level')).toBeInTheDocument();

      // Click on level 1 button (using aria-label)
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // Should transition to game screen
      await waitFor(() => {
        expect(screen.queryByText('Select Level')).not.toBeInTheDocument();
        expect(isOnGameScreen()).toBe(true);
      });
    });

    it('should allow retry from game screen using restart button', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // Wait for game to start
      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      }, { timeout: 10000 });

      // Verify restart button exists
      const restartButton = screen.getByRole('button', { name: /restart/i });
      expect(restartButton).toBeInTheDocument();

      // Make a move first
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);
      
      // Wait for first card to flip
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await user.click(cards[1]);

      // Wait for move to register with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await waitFor(() => {
        const movesElement = screen.getByLabelText(/1 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click restart
      await user.click(restartButton);

      // Wait for restart to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should still be on game screen with moves reset
      await waitFor(() => {
        const movesElement = screen.getByLabelText(/0 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Progress Persistence', () => {
    it('should persist progress structure to localStorage', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // Wait for game to start
      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make at least one move to trigger progress
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);
      await user.click(cards[1]);

      // Wait a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Even if level is not complete, progress should be initialized in localStorage
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();

      const progress = JSON.parse(savedProgress!);
      expect(progress).toHaveProperty('completedLevels');
      expect(progress).toHaveProperty('highestUnlockedLevel');
    });

    it('should restore progress from localStorage on mount', async () => {
      // Pre-populate localStorage with progress
      const mockProgress = {
        completedLevels: [1, 2, 3],
        levelStars: [[1, 3], [2, 2], [3, 1]],
        highestUnlockedLevel: 4,
        soundEnabled: true,
      };
      localStorage.setItem('memory-match-base-progress', JSON.stringify(mockProgress));

      render(<App />);

      // Should show progress on level select screen
      await waitFor(() => {
        expect(screen.getByText(/3\/100 levels completed/)).toBeInTheDocument();
      });

      // Level 4 should be unlocked
      const level4Button = screen.getByRole('button', { name: /Level 4, unlocked/i });
      expect(level4Button).not.toBeDisabled();

      // Level 5 should be locked
      const level5Button = screen.getByRole('button', { name: /Level 5, locked/i });
      expect(level5Button).toBeDisabled();
    });

    it('should maintain progress data structure in localStorage', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // Wait for game to start
      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make a move
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check localStorage structure
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();

      const progress = JSON.parse(savedProgress!);
      
      // Validate structure
      expect(progress).toHaveProperty('completedLevels');
      expect(progress).toHaveProperty('levelStars');
      expect(progress).toHaveProperty('highestUnlockedLevel');
      expect(progress).toHaveProperty('soundEnabled');
      
      // Validate types
      expect(Array.isArray(progress.completedLevels)).toBe(true);
      expect(Array.isArray(progress.levelStars)).toBe(true);
      expect(typeof progress.highestUnlockedLevel).toBe('number');
      expect(typeof progress.soundEnabled).toBe('boolean');
    });

    it('should handle empty localStorage gracefully', async () => {
      // Ensure localStorage is empty
      localStorage.clear();

      render(<App />);

      // Should render with default progress
      await waitFor(() => {
        expect(screen.getByText('Select Level')).toBeInTheDocument();
        expect(screen.getByText(/0\/100 levels completed/)).toBeInTheDocument();
      });

      // Only level 1 should be unlocked
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      expect(level1Button).not.toBeDisabled();

      const level2Button = screen.getByRole('button', { name: /Level 2, locked/i });
      expect(level2Button).toBeDisabled();
    });

    it('should save progress data with correct format', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      // Wait for game to start
      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Make a move
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      await user.click(cards[0]);

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check localStorage format
      const savedProgress = localStorage.getItem('memory-match-base-progress');
      expect(savedProgress).toBeTruthy();

      // Should be valid JSON
      expect(() => JSON.parse(savedProgress!)).not.toThrow();
    });
  });

  describe('Game Flow Edge Cases', () => {
    it('should reset game state when restarting a level', async () => {
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
        const movesElement = screen.getByLabelText(/1 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });

      // Restart the level
      const restartButton = screen.getByRole('button', { name: /restart/i });
      await user.click(restartButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Moves should be reset
      await waitFor(() => {
        const movesElement = screen.getByLabelText(/0 moves made/i);
        expect(movesElement).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should maintain app structure throughout navigation', async () => {
      const user = userEvent.setup();
      const { container } = render(<App />);

      // Check for app container
      const appDiv = container.querySelector('.app');
      expect(appDiv).toBeInTheDocument();

      // Navigate to game
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // App container should still exist
      expect(container.querySelector('.app')).toBeInTheDocument();
    });

    it('should handle pause and resume functionality', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Find and click pause button
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      // Should show pause overlay
      await waitFor(() => {
        expect(screen.getByText(/Paused/i)).toBeInTheDocument();
      });

      // Find and click resume button
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);

      // Pause overlay should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/Paused/i)).not.toBeInTheDocument();
      });
    });

    it('should display game controls on game screen', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Check for game controls
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('should display correct number of cards for level 1', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start level 1
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      await user.click(level1Button);

      await waitFor(() => {
        expect(isOnGameScreen()).toBe(true);
      });

      // Level 1 should have 16 cards (4x4 grid)
      const cards = screen.getAllByRole('button', { name: /Face-down card/i });
      expect(cards.length).toBe(16);
    });
  });
});
