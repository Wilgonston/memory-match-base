/**
 * Card Component Unit Tests
 * 
 * Tests card rendering, click handling, disabled state, and CSS classes.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';
import { Card as CardType } from '../types';

describe('Card Component', () => {
  const mockCard: CardType = {
    id: 'base-1',
    imageId: 'base',
    isFlipped: false,
    isMatched: false,
  };

  const mockOnClick = vi.fn();

  it('should render card correctly', () => {
    render(<Card card={mockCard} onClick={mockOnClick} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveAttribute('aria-label', 'Face-down card');
  });

  it('should call onClick when clicked', () => {
    const mockOnClickTest = vi.fn();
    render(<Card card={mockCard} onClick={mockOnClickTest} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.click(cardElement);
    
    expect(mockOnClickTest).toHaveBeenCalledWith('base-1');
    expect(mockOnClickTest).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const mockOnClickDisabled = vi.fn();
    
    render(<Card card={mockCard} onClick={mockOnClickDisabled} disabled={true} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.click(cardElement);
    
    expect(mockOnClickDisabled).not.toHaveBeenCalled();
  });

  it('should not call onClick when card is already flipped', () => {
    const mockOnClickFlipped = vi.fn();
    const flippedCard: CardType = { ...mockCard, isFlipped: true };
    
    render(<Card card={flippedCard} onClick={mockOnClickFlipped} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.click(cardElement);
    
    expect(mockOnClickFlipped).not.toHaveBeenCalled();
  });

  it('should apply flipped CSS class when card is flipped', () => {
    const flippedCard: CardType = { ...mockCard, isFlipped: true };
    render(<Card card={flippedCard} onClick={mockOnClick} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveClass('flipped');
  });

  it('should apply matched CSS class when card is matched', () => {
    const matchedCard: CardType = { ...mockCard, isFlipped: true, isMatched: true };
    render(<Card card={matchedCard} onClick={mockOnClick} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveClass('matched');
  });

  it('should apply disabled CSS class when disabled', () => {
    render(<Card card={mockCard} onClick={mockOnClick} disabled={true} />);
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveClass('disabled');
  });

  it('should display project name when flipped', () => {
    const flippedCard: CardType = { ...mockCard, isFlipped: true };
    render(<Card card={flippedCard} onClick={mockOnClick} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveAttribute('aria-label', 'BASE card');
  });

  it('should handle keyboard navigation with Enter key', () => {
    const mockOnClickKeyboard = vi.fn();
    
    render(<Card card={mockCard} onClick={mockOnClickKeyboard} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.keyDown(cardElement, { key: 'Enter' });
    
    expect(mockOnClickKeyboard).toHaveBeenCalledWith('base-1');
  });

  it('should handle keyboard navigation with Space key', () => {
    const mockOnClickKeyboard = vi.fn();
    
    render(<Card card={mockCard} onClick={mockOnClickKeyboard} disabled={false} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.keyDown(cardElement, { key: ' ' });
    
    expect(mockOnClickKeyboard).toHaveBeenCalledWith('base-1');
  });
});
