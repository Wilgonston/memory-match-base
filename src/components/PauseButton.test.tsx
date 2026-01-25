/**
 * PauseButton Component Tests
 * 
 * Unit tests for the PauseButton component.
 * Tests rendering, click handling, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PauseButton } from './PauseButton';

describe('PauseButton', () => {
  it('renders pause button with icon and text', () => {
    const onPause = vi.fn();
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    expect(button).toBeInTheDocument();
    
    // Check that text is present
    expect(screen.getByText('Pause')).toBeInTheDocument();
    
    // Check that SVG icon is present
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onPause when clicked', () => {
    const onPause = vi.fn();
    
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    fireEvent.click(button);
    
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onPause multiple times when clicked multiple times', () => {
    const onPause = vi.fn();
    
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(onPause).toHaveBeenCalledTimes(3);
  });

  it('has correct button type', () => {
    const onPause = vi.fn();
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has accessible label', () => {
    const onPause = vi.fn();
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    expect(button).toHaveAttribute('aria-label', 'Pause game');
  });

  it('has pause-button CSS class', () => {
    const onPause = vi.fn();
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    expect(button).toHaveClass('pause-button');
  });

  it('SVG icon has aria-hidden attribute', () => {
    const onPause = vi.fn();
    render(<PauseButton onPause={onPause} />);
    
    const button = screen.getByRole('button', { name: /pause game/i });
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
