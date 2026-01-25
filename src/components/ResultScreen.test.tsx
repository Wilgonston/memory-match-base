/**
 * Unit tests for ResultScreen component
 * 
 * Tests correct statistics display, star rating rendering, and button callbacks.
 * Requirements: 5.2, 6.2, 6.3, 9.4, 11.6
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ResultScreen } from './ResultScreen';

describe('ResultScreen', () => {
  const defaultProps = {
    level: 5,
    moves: 20,
    timeElapsed: 45,
    stars: 2,
    onNextLevel: vi.fn(),
    onRetry: vi.fn(),
    onLevelSelect: vi.fn(),
  };

  it('should render level completion title', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('Level Complete!')).toBeInTheDocument();
  });

  it('should display correct level number', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display correct number of moves', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should display formatted time elapsed', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('00:45')).toBeInTheDocument();
  });

  it('should render correct star rating (2 stars)', () => {
    render(<ResultScreen {...defaultProps} />);
    const starRating = screen.getByRole('img', { name: '2 out of 3 stars earned' });
    expect(starRating).toBeInTheDocument();
  });

  it('should render 3 filled stars when stars is 3', () => {
    render(<ResultScreen {...defaultProps} stars={3} />);
    const starRating = screen.getByRole('img', { name: '3 out of 3 stars earned' });
    expect(starRating).toBeInTheDocument();
  });

  it('should render 1 filled star when stars is 1', () => {
    render(<ResultScreen {...defaultProps} stars={1} />);
    const starRating = screen.getByRole('img', { name: '1 out of 3 stars earned' });
    expect(starRating).toBeInTheDocument();
  });

  it('should call onNextLevel when Next Level button is clicked', async () => {
    const user = userEvent.setup();
    const onNextLevel = vi.fn();
    render(<ResultScreen {...defaultProps} onNextLevel={onNextLevel} />);
    
    const nextButton = screen.getByRole('button', { name: /continue to next level/i });
    await user.click(nextButton);
    
    expect(onNextLevel).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry when Retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ResultScreen {...defaultProps} onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry current level/i });
    await user.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onLevelSelect when Level Select button is clicked', async () => {
    const user = userEvent.setup();
    const onLevelSelect = vi.fn();
    render(<ResultScreen {...defaultProps} onLevelSelect={onLevelSelect} />);
    
    const levelSelectButton = screen.getByRole('button', { name: /return to level selection/i });
    await user.click(levelSelectButton);
    
    expect(onLevelSelect).toHaveBeenCalledTimes(1);
  });

  it('should display congratulations message for level 100', () => {
    render(<ResultScreen {...defaultProps} level={100} />);
    // Use getAllByText since the message appears in both the title and the live region
    const congratsElements = screen.getAllByText(/congratulations/i);
    expect(congratsElements.length).toBeGreaterThan(0);
  });

  it('should display final message for level 100', () => {
    render(<ResultScreen {...defaultProps} level={100} />);
    // Use getAllByText since the message appears in both the final message and the live region
    const finalMessages = screen.getAllByText(/You've completed all 100 levels/i);
    expect(finalMessages.length).toBeGreaterThan(0);
  });

  it('should not display Next Level button for level 100', () => {
    render(<ResultScreen {...defaultProps} level={100} />);
    const nextButton = screen.queryByRole('button', { name: /continue to next level/i });
    expect(nextButton).not.toBeInTheDocument();
  });

  it('should display Next Level button for levels below 100', () => {
    render(<ResultScreen {...defaultProps} level={50} />);
    const nextButton = screen.getByRole('button', { name: /continue to next level/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('should have dialog role and be modal', () => {
    render(<ResultScreen {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should have accessible title', () => {
    render(<ResultScreen {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'result-title');
  });

  it('should display correct time for different durations', () => {
    const { rerender } = render(<ResultScreen {...defaultProps} timeElapsed={0} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(<ResultScreen {...defaultProps} timeElapsed={59} />);
    expect(screen.getByText('00:59')).toBeInTheDocument();

    rerender(<ResultScreen {...defaultProps} timeElapsed={125} />);
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('should render all three action buttons for non-final levels', () => {
    render(<ResultScreen {...defaultProps} level={50} />);
    
    expect(screen.getByRole('button', { name: /continue to next level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry current level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to level selection/i })).toBeInTheDocument();
  });

  it('should render only Retry and Level Select buttons for level 100', () => {
    render(<ResultScreen {...defaultProps} level={100} />);
    
    expect(screen.queryByRole('button', { name: /continue to next level/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry current level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to level selection/i })).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const onNextLevel = vi.fn();
    render(<ResultScreen {...defaultProps} onNextLevel={onNextLevel} />);
    
    const nextButton = screen.getByRole('button', { name: /continue to next level/i });
    nextButton.focus();
    await user.keyboard('{Enter}');
    
    expect(onNextLevel).toHaveBeenCalledTimes(1);
  });

  it('should display statistics section', () => {
    render(<ResultScreen {...defaultProps} />);
    
    expect(screen.getByText('Moves')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should render celebration animation elements', () => {
    const { container } = render(<ResultScreen {...defaultProps} />);
    const celebrationAnimation = container.querySelector('.celebration-animation');
    expect(celebrationAnimation).toBeInTheDocument();
    
    const confetti = container.querySelectorAll('.confetti');
    expect(confetti.length).toBeGreaterThan(0);
  });
});
