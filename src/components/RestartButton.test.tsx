/**
 * RestartButton Component Tests
 * 
 * Unit tests for the RestartButton component.
 * Tests rendering, click handling, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestartButton } from './RestartButton';

describe('RestartButton', () => {
  it('renders restart button with icon and text', () => {
    const onRestart = vi.fn();
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    expect(button).toBeInTheDocument();
    
    // Check that text is present
    expect(screen.getByText('Restart')).toBeInTheDocument();
    
    // Check that SVG icon is present
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onRestart when clicked', () => {
    const onRestart = vi.fn();
    
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    fireEvent.click(button);
    
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('calls onRestart multiple times when clicked multiple times', () => {
    const onRestart = vi.fn();
    
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(onRestart).toHaveBeenCalledTimes(3);
  });

  it('has correct button type', () => {
    const onRestart = vi.fn();
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has accessible label', () => {
    const onRestart = vi.fn();
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    expect(button).toHaveAttribute('aria-label', 'Restart level');
  });

  it('has restart-button CSS class', () => {
    const onRestart = vi.fn();
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    expect(button).toHaveClass('restart-button');
  });

  it('SVG icon has aria-hidden attribute', () => {
    const onRestart = vi.fn();
    render(<RestartButton onRestart={onRestart} />);
    
    const button = screen.getByRole('button', { name: /restart level/i });
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
