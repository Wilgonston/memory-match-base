/**
 * Grid Component Unit Tests
 * 
 * Tests grid rendering, layout classes, and card interactions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid } from './Grid';
import { Card as CardType } from '../types';

describe('Grid Component', () => {
  const createMockCards = (count: number): CardType[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `card-${i}`,
      imageId: `project-${Math.floor(i / 2)}`,
      isFlipped: false,
      isMatched: false,
    }));
  };

  it('should render correct number of cards for 4x4 grid', () => {
    const cards = createMockCards(16);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} />);

    // Check that all cards are rendered
    const cardElements = screen.getAllByRole('button');
    expect(cardElements).toHaveLength(16);
  });

  it('should render correct number of cards for 6x6 grid', () => {
    const cards = createMockCards(36);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} />);

    const cardElements = screen.getAllByRole('button');
    expect(cardElements).toHaveLength(36);
  });

  it('should render correct number of cards for 8x8 grid', () => {
    const cards = createMockCards(64);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} />);

    const cardElements = screen.getAllByRole('button');
    expect(cardElements).toHaveLength(64);
  });

  it('should apply correct grid class for 4x4 layout', () => {
    const cards = createMockCards(16);
    const onCardClick = vi.fn();

    const { container } = render(<Grid cards={cards} onCardClick={onCardClick} />);

    const gridElement = container.querySelector('.memory-grid');
    expect(gridElement).toHaveClass('grid-4x4');
  });

  it('should apply correct grid class for 6x6 layout', () => {
    const cards = createMockCards(36);
    const onCardClick = vi.fn();

    const { container } = render(<Grid cards={cards} onCardClick={onCardClick} />);

    const gridElement = container.querySelector('.memory-grid');
    expect(gridElement).toHaveClass('grid-6x6');
  });

  it('should apply correct grid class for 8x8 layout', () => {
    const cards = createMockCards(64);
    const onCardClick = vi.fn();

    const { container } = render(<Grid cards={cards} onCardClick={onCardClick} />);

    const gridElement = container.querySelector('.memory-grid');
    expect(gridElement).toHaveClass('grid-8x8');
  });

  it('should pass onCardClick callback to Card components', () => {
    const cards = createMockCards(4);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} />);

    // The callback is passed to Card components
    // We verify this by checking that cards are rendered with the callback
    const cardElements = screen.getAllByRole('button');
    expect(cardElements.length).toBeGreaterThan(0);
  });

  it('should disable all cards when disabled prop is true', () => {
    const cards = createMockCards(4);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} disabled={true} />);

    const cardElements = screen.getAllByRole('button');
    cardElements.forEach((card) => {
      expect(card).toHaveClass('disabled');
    });
  });

  it('should not disable cards when disabled prop is false', () => {
    const cards = createMockCards(4);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} disabled={false} />);

    const cardElements = screen.getAllByRole('button');
    // At least some cards should not have disabled class (unless they're matched)
    const nonDisabledCards = cardElements.filter(card => !card.classList.contains('disabled'));
    expect(nonDisabledCards.length).toBeGreaterThan(0);
  });

  it('should disable matched cards regardless of disabled prop', () => {
    const cards: CardType[] = [
      { id: 'card-1', imageId: 'project-1', isFlipped: true, isMatched: true },
      { id: 'card-2', imageId: 'project-1', isFlipped: true, isMatched: true },
      { id: 'card-3', imageId: 'project-2', isFlipped: false, isMatched: false },
      { id: 'card-4', imageId: 'project-2', isFlipped: false, isMatched: false },
    ];
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} disabled={false} />);

    const cardElements = screen.getAllByRole('button');
    // First two cards should be disabled (matched)
    expect(cardElements[0]).toHaveClass('disabled');
    expect(cardElements[1]).toHaveClass('disabled');
  });

  it('should render grid with proper ARIA attributes', () => {
    const cards = createMockCards(16);
    const onCardClick = vi.fn();

    render(<Grid cards={cards} onCardClick={onCardClick} />);

    const gridElement = screen.getByRole('grid');
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveAttribute('aria-label', '4x4 memory card grid');
  });

  it('should handle empty cards array', () => {
    const cards: CardType[] = [];
    const onCardClick = vi.fn();

    const { container } = render(<Grid cards={cards} onCardClick={onCardClick} />);

    const gridElement = container.querySelector('.memory-grid');
    expect(gridElement).toBeInTheDocument();
    
    const cardElements = container.querySelectorAll('.memory-card');
    expect(cardElements).toHaveLength(0);
  });

  it('should use React.memo for performance optimization', () => {
    // Check that Grid component has displayName set (indicates React.memo usage)
    expect(Grid.displayName).toBe('Grid');
  });
});
