/**
 * Unit tests for LevelSelect component
 * 
 * Tests:
 * - Locked levels are disabled
 * - Completed levels show stars
 * - onLevelSelect callback works
 * - Progress summary displays correctly
 * - Unlocked levels are clickable
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelSelect } from './LevelSelect';
import { ProgressData } from '../types';

describe('LevelSelect Component', () => {
  const createProgressData = (overrides?: Partial<ProgressData>): ProgressData => ({
    completedLevels: new Set([1, 2, 3]),
    levelStars: new Map([
      [1, 3],
      [2, 2],
      [3, 1],
    ]),
    highestUnlockedLevel: 5,
    soundEnabled: true,
    ...overrides,
  });

  it('should render level selection grid', () => {
    const progressData = createProgressData();
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    expect(screen.getByText('Select Level')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /level selection grid/i })).toBeInTheDocument();
  });

  it('should display progress summary correctly', () => {
    const progressData = createProgressData();
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    expect(screen.getByText(/Progress: 3\/100 levels completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Stars: 6\/300/i)).toBeInTheDocument();
  });

  it('should render all 100 level buttons', () => {
    const progressData = createProgressData();
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    // Check for first, middle, and last level buttons
    expect(screen.getByRole('button', { name: /^Level 1,/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Level 50,/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Level 100,/i })).toBeInTheDocument();
  });

  it('should disable locked levels', () => {
    const progressData = createProgressData({ highestUnlockedLevel: 3 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level1Button = screen.getByRole('button', { name: /^Level 1,/i });
    const level4Button = screen.getByRole('button', { name: /^Level 4, locked/i });

    expect(level1Button).not.toBeDisabled();
    expect(level4Button).toBeDisabled();
  });

  it('should show lock icon for locked levels', () => {
    const progressData = createProgressData({ highestUnlockedLevel: 2 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level3Button = screen.getByRole('button', { name: /^Level 3, locked/i });
    expect(level3Button).toBeDisabled();
    expect(level3Button.querySelector('.lock-icon')).toBeInTheDocument();
  });

  it('should show star rating for completed levels', () => {
    const progressData = createProgressData({
      completedLevels: new Set([1, 2]),
      levelStars: new Map([
        [1, 3],
        [2, 2],
      ]),
      highestUnlockedLevel: 5,
    });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level1Button = screen.getByRole('button', { name: /^Level 1, completed with 3 stars/i });
    const level2Button = screen.getByRole('button', { name: /^Level 2, completed with 2 stars/i });

    expect(level1Button).toBeInTheDocument();
    expect(level2Button).toBeInTheDocument();

    // Check for star elements
    const level1Stars = level1Button.querySelectorAll('.star');
    const level2Stars = level2Button.querySelectorAll('.star');

    expect(level1Stars).toHaveLength(3);
    expect(level2Stars).toHaveLength(3);
  });

  it('should call onLevelSelect when unlocked level is clicked', async () => {
    const user = userEvent.setup();
    const progressData = createProgressData({ highestUnlockedLevel: 5 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level3Button = screen.getByRole('button', { name: /^Level 3,/i });
    await user.click(level3Button);

    expect(onLevelSelect).toHaveBeenCalledWith(3);
    expect(onLevelSelect).toHaveBeenCalledTimes(1);
  });

  it('should not call onLevelSelect when locked level is clicked', async () => {
    const user = userEvent.setup();
    const progressData = createProgressData({ highestUnlockedLevel: 2 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level5Button = screen.getByRole('button', { name: /^Level 5, locked/i });
    await user.click(level5Button);

    expect(onLevelSelect).not.toHaveBeenCalled();
  });

  it('should apply correct CSS classes to level buttons', () => {
    const progressData = createProgressData({
      completedLevels: new Set([1]),
      levelStars: new Map([[1, 3]]),
      highestUnlockedLevel: 3,
    });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level1Button = screen.getByRole('button', { name: /^Level 1,/i });
    const level2Button = screen.getByRole('button', { name: /^Level 2,/i });
    const level4Button = screen.getByRole('button', { name: /^Level 4,/i });

    expect(level1Button).toHaveClass('level-button', 'unlocked', 'completed');
    expect(level2Button).toHaveClass('level-button', 'unlocked');
    expect(level2Button).not.toHaveClass('completed');
    expect(level4Button).toHaveClass('level-button', 'locked');
  });

  it('should handle edge case: level 1 always unlocked', () => {
    const progressData = createProgressData({ highestUnlockedLevel: 1 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level1Button = screen.getByRole('button', { name: /^Level 1,/i });
    expect(level1Button).not.toBeDisabled();
  });

  it('should handle edge case: all levels unlocked', () => {
    const progressData = createProgressData({ highestUnlockedLevel: 100 });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    const level100Button = screen.getByRole('button', { name: /^Level 100,/i });
    expect(level100Button).not.toBeDisabled();
  });

  it('should handle edge case: no completed levels', () => {
    const progressData = createProgressData({
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
    });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    expect(screen.getByText(/Progress: 0\/100 levels completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Stars: 0\/300/i)).toBeInTheDocument();
  });

  it('should calculate total stars correctly', () => {
    const progressData = createProgressData({
      completedLevels: new Set([1, 2, 3, 4, 5]),
      levelStars: new Map([
        [1, 3],
        [2, 3],
        [3, 2],
        [4, 2],
        [5, 1],
      ]),
      highestUnlockedLevel: 6,
    });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    // Total stars: 3 + 3 + 2 + 2 + 1 = 11
    expect(screen.getByText(/Total Stars: 11\/300/i)).toBeInTheDocument();
  });

  it('should have accessible labels for screen readers', () => {
    const progressData = createProgressData({
      completedLevels: new Set([1]),
      levelStars: new Map([[1, 3]]),
      highestUnlockedLevel: 3,
    });
    const onLevelSelect = vi.fn();

    render(<LevelSelect progressData={progressData} onLevelSelect={onLevelSelect} />);

    expect(screen.getByRole('button', { name: /^Level 1, completed with 3 stars/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Level 2, unlocked/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Level 4, locked/i })).toBeInTheDocument();
  });
});
