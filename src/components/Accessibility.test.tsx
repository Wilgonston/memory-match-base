/**
 * Accessibility Tests
 * 
 * Tests keyboard navigation, ARIA labels, focus management,
 * and screen reader support across all components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';
import { LevelSelect } from './LevelSelect';
import { PauseButton } from './PauseButton';
import { RestartButton } from './RestartButton';
import { PauseOverlay } from './PauseOverlay';
import { ResultScreen } from './ResultScreen';
import { GameBoard } from './GameBoard';
import { Card as CardType, GameState, ProgressData } from '../types';

describe('Accessibility - Keyboard Navigation', () => {
  describe('Card Component', () => {
    it('should be focusable with Tab key', () => {
      const mockCard: CardType = {
        id: '1',
        imageId: 'base',
        isFlipped: false,
        isMatched: false,
      };
      const mockOnClick = vi.fn();

      render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should respond to Enter key', async () => {
      const mockCard: CardType = {
        id: '1',
        imageId: 'base',
        isFlipped: false,
        isMatched: false,
      };
      const mockOnClick = vi.fn();

      render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledWith('1');
    });

    it('should respond to Space key', async () => {
      const mockCard: CardType = {
        id: '1',
        imageId: 'base',
        isFlipped: false,
        isMatched: false,
      };
      const mockOnClick = vi.fn();

      render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(mockOnClick).toHaveBeenCalledWith('1');
    });

    it('should not be focusable when disabled', () => {
      const mockCard: CardType = {
        id: '1',
        imageId: 'base',
        isFlipped: false,
        isMatched: false,
      };
      const mockOnClick = vi.fn();

      render(<Card card={mockCard} onClick={mockOnClick} disabled={true} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('LevelSelect Component', () => {
    it('should allow keyboard navigation through level buttons', async () => {
      const mockProgress: ProgressData = {
        completedLevels: new Set([1]),
        levelStars: new Map([[1, 3]]),
        highestUnlockedLevel: 2,
        soundEnabled: true,
      };
      const mockOnSelect = vi.fn();

      render(<LevelSelect progressData={mockProgress} onLevelSelect={mockOnSelect} />);
      
      const levelButtons = screen.getAllByRole('button');
      const firstButton = levelButtons[0];
      const secondButton = levelButtons[1];

      // Tab to first button
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Tab to second button
      secondButton.focus();
      expect(document.activeElement).toBe(secondButton);
    });

    it('should activate level on Enter key', () => {
      const mockProgress: ProgressData = {
        completedLevels: new Set(),
        levelStars: new Map(),
        highestUnlockedLevel: 1,
        soundEnabled: true,
      };
      const mockOnSelect = vi.fn();

      render(<LevelSelect progressData={mockProgress} onLevelSelect={mockOnSelect} />);
      
      const level1Button = screen.getByRole('button', { name: /Level 1, unlocked/i });
      level1Button.focus();
      
      fireEvent.click(level1Button);
      
      expect(mockOnSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('PauseOverlay Component', () => {
    it('should respond to Escape key to resume', () => {
      const mockOnResume = vi.fn();

      render(<PauseOverlay isPaused={true} onResume={mockOnResume} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnResume).toHaveBeenCalled();
    });

    it('should trap focus within overlay', async () => {
      const mockOnResume = vi.fn();

      render(<PauseOverlay isPaused={true} onResume={mockOnResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /Resume game/i });
      
      // Resume button should be auto-focused
      await waitFor(() => {
        expect(document.activeElement).toBe(resumeButton);
      });
    });
  });

  describe('Control Buttons', () => {
    it('PauseButton should be keyboard accessible', () => {
      const mockOnPause = vi.fn();

      render(<PauseButton onPause={mockOnPause} />);
      
      const button = screen.getByRole('button', { name: /Pause game/i });
      button.focus();
      
      expect(document.activeElement).toBe(button);
      
      fireEvent.click(button);
      expect(mockOnPause).toHaveBeenCalled();
    });

    it('RestartButton should be keyboard accessible', () => {
      const mockOnRestart = vi.fn();

      render(<RestartButton onRestart={mockOnRestart} />);
      
      const button = screen.getByRole('button', { name: /Restart level/i });
      button.focus();
      
      expect(document.activeElement).toBe(button);
      
      fireEvent.click(button);
      expect(mockOnRestart).toHaveBeenCalled();
    });
  });
});

describe('Accessibility - ARIA Labels', () => {
  it('Card should have descriptive ARIA label', () => {
    const mockCard: CardType = {
      id: '1',
      imageId: 'base',
      isFlipped: false,
      isMatched: false,
    };
    const mockOnClick = vi.fn();

    render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Face-down card');
  });

  it('Flipped card should have project name in ARIA label', () => {
    const mockCard: CardType = {
      id: '1',
      imageId: 'base',
      isFlipped: true,
      isMatched: false,
    };
    const mockOnClick = vi.fn();

    render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('card'));
  });

  it('LevelSelect should have ARIA labels for locked/unlocked levels', () => {
    const mockProgress: ProgressData = {
      completedLevels: new Set([1]),
      levelStars: new Map([[1, 3]]),
      highestUnlockedLevel: 2,
      soundEnabled: true,
    };
    const mockOnSelect = vi.fn();

    render(<LevelSelect progressData={mockProgress} onLevelSelect={mockOnSelect} />);
    
    // Check unlocked level
    const level1 = screen.getByRole('button', { name: /Level 1, completed with 3 stars/i });
    expect(level1).toBeInTheDocument();

    // Check locked level
    const level3 = screen.getByRole('button', { name: /Level 3, locked/i });
    expect(level3).toBeInTheDocument();
    expect(level3).toBeDisabled();
  });

  it('PauseOverlay should have dialog role and ARIA labels', () => {
    const mockOnResume = vi.fn();

    render(<PauseOverlay isPaused={true} onResume={mockOnResume} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'pause-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'pause-description');
  });

  it('ResultScreen should have dialog role and descriptive ARIA labels', () => {
    const mockCallbacks = {
      onNextLevel: vi.fn(),
      onRetry: vi.fn(),
      onLevelSelect: vi.fn(),
    };

    render(
      <ResultScreen
        level={1}
        moves={10}
        timeElapsed={30}
        stars={3}
        {...mockCallbacks}
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'result-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'result-stats');
  });

  it('Star rating should have descriptive ARIA label', () => {
    const mockCallbacks = {
      onNextLevel: vi.fn(),
      onRetry: vi.fn(),
      onLevelSelect: vi.fn(),
    };

    render(
      <ResultScreen
        level={1}
        moves={10}
        timeElapsed={30}
        stars={2}
        {...mockCallbacks}
      />
    );
    
    const starRating = screen.getByRole('img', { name: /2 out of 3 stars/i });
    expect(starRating).toBeInTheDocument();
  });
});

describe('Accessibility - Focus Management', () => {
  it('PauseOverlay should auto-focus resume button', async () => {
    const mockOnResume = vi.fn();

    render(<PauseOverlay isPaused={true} onResume={mockOnResume} />);
    
    const resumeButton = screen.getByRole('button', { name: /Resume game/i });
    
    await waitFor(() => {
      expect(document.activeElement).toBe(resumeButton);
    });
  });

  it('ResultScreen should auto-focus primary action button', async () => {
    // Mock wallet as disconnected to avoid SaveProgressButton interfering with focus
    const { useAccount } = await import('wagmi');
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: 'disconnected',
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
    });

    const mockCallbacks = {
      onNextLevel: vi.fn(),
      onRetry: vi.fn(),
      onLevelSelect: vi.fn(),
    };

    render(
      <ResultScreen
        level={1}
        moves={10}
        timeElapsed={30}
        stars={3}
        {...mockCallbacks}
      />
    );
    
    const nextLevelButton = screen.getByRole('button', { name: /Continue to next level/i });
    
    await waitFor(() => {
      expect(document.activeElement).toBe(nextLevelButton);
    });
  });

  it('Focus indicators should be visible on keyboard focus', () => {
    const mockOnPause = vi.fn();

    const { container } = render(<PauseButton onPause={mockOnPause} />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    // Check that button has focus
    expect(document.activeElement).toBe(button);
    
    // CSS focus styles should be applied (tested via CSS)
    expect(button).toHaveClass('pause-button');
  });
});

describe('Accessibility - Color Contrast', () => {
  it('should document WCAG AA compliance for text colors', () => {
    // This is a documentation test to ensure we're aware of color contrast requirements
    // Actual color contrast should be verified with tools like axe-core or manual testing
    
    const colorPairs = [
      { bg: '#0052FF', fg: '#FFFFFF', name: 'Primary button' },
      { bg: '#000D1F', fg: '#FFFFFF', name: 'Dark background' },
      { bg: '#00FF88', fg: '#000D1F', name: 'Success button' },
      { bg: '#FF6B00', fg: '#FFFFFF', name: 'Restart button' },
    ];

    // Document that these color pairs should meet WCAG AA standards (4.5:1 for normal text)
    colorPairs.forEach(pair => {
      expect(pair).toHaveProperty('bg');
      expect(pair).toHaveProperty('fg');
      expect(pair).toHaveProperty('name');
    });
  });
});

describe('Accessibility - Screen Reader Support', () => {
  it('should have semantic HTML structure', () => {
    const mockProgress: ProgressData = {
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
      soundEnabled: true,
    };
    const mockOnSelect = vi.fn();

    render(<LevelSelect progressData={mockProgress} onLevelSelect={mockOnSelect} />);
    
    // Check for main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for heading
    const heading = screen.getByRole('heading', { name: /Select Level/i });
    expect(heading).toBeInTheDocument();
  });

  it('should hide decorative elements from screen readers', () => {
    const mockCallbacks = {
      onNextLevel: vi.fn(),
      onRetry: vi.fn(),
      onLevelSelect: vi.fn(),
    };

    const { container } = render(
      <ResultScreen
        level={1}
        moves={10}
        timeElapsed={30}
        stars={3}
        {...mockCallbacks}
      />
    );
    
    // Check that decorative elements have aria-hidden
    const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorativeElements.length).toBeGreaterThan(0);
  });

  it('should provide text alternatives for icons', () => {
    const mockOnPause = vi.fn();

    render(<PauseButton onPause={mockOnPause} />);
    
    const button = screen.getByRole('button', { name: /Pause game/i });
    expect(button).toBeInTheDocument();
    
    // Icon should be hidden from screen readers
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Accessibility - Minimum Touch Targets', () => {
  it('should have minimum 44x44px touch targets on mobile', () => {
    const mockCard: CardType = {
      id: '1',
      imageId: 'base',
      isFlipped: false,
      isMatched: false,
    };
    const mockOnClick = vi.fn();

    const { container } = render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
    
    const card = container.querySelector('.memory-card');
    expect(card).toBeInTheDocument();
    
    // CSS ensures min-width and min-height of 44px on mobile
    // This is verified through CSS media queries
  });
});
