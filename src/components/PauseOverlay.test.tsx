/**
 * PauseOverlay Component Tests
 * 
 * Unit tests for the PauseOverlay component.
 * Tests rendering, visibility, and interaction behavior.
 * 
 * Requirements: 11.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PauseOverlay } from './PauseOverlay';

describe('PauseOverlay', () => {
  describe('Rendering', () => {
    it('should not render when isPaused is false', () => {
      const onResume = vi.fn();
      const { container } = render(
        <PauseOverlay isPaused={false} onResume={onResume} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when isPaused is true', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Game Paused')).toBeInTheDocument();
    });

    it('should display pause message', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      expect(screen.getByText(/Take a break/i)).toBeInTheDocument();
    });

    it('should render resume button', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume game/i });
      expect(resumeButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'pause-title');
    });

    it('should auto-focus resume button when rendered', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume game/i });
      // Check that the button has focus (autoFocus prop causes this)
      expect(document.activeElement).toBe(resumeButton);
    });

    it('should have accessible button label', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume game/i });
      expect(resumeButton).toHaveAttribute('aria-label', 'Resume game (or press Escape)');
    });
  });

  describe('Interaction', () => {
    it('should call onResume when resume button is clicked', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume game/i });
      fireEvent.click(resumeButton);
      
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('should not call onResume when not paused', () => {
      const onResume = vi.fn();
      const { rerender } = render(
        <PauseOverlay isPaused={true} onResume={onResume} />
      );
      
      // Unpause
      rerender(<PauseOverlay isPaused={false} onResume={onResume} />);
      
      // Try to find button (should not exist)
      const resumeButton = screen.queryByRole('button', { name: /resume game/i });
      expect(resumeButton).not.toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render play icon in resume button', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const svg = screen.getByRole('button', { name: /resume game/i }).querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('resume-icon');
    });

    it('should render button text', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to overlay', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveClass('pause-overlay');
    });

    it('should apply correct CSS classes to content', () => {
      const onResume = vi.fn();
      const { container } = render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const content = container.querySelector('.pause-content');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct CSS classes to resume button', () => {
      const onResume = vi.fn();
      render(<PauseOverlay isPaused={true} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume game/i });
      expect(resumeButton).toHaveClass('resume-button');
    });
  });
});
