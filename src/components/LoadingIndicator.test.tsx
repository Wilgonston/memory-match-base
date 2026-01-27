/**
 * LoadingIndicator Component Tests
 * 
 * Tests for loading indicator components including:
 * - Basic rendering
 * - Operation type display
 * - Estimated time display
 * - Cancel button functionality
 * - Still working message
 * - Success animation
 * 
 * Requirements: 12.1, 12.6, 12.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  LoadingIndicator, 
  InlineLoadingIndicator, 
  SuccessAnimation 
} from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('should render with operation text', () => {
    render(<LoadingIndicator operation="Connecting wallet" />);
    
    expect(screen.getByText('Connecting wallet')).toBeInTheDocument();
  });

  it('should display estimated time when provided', () => {
    render(
      <LoadingIndicator 
        operation="Saving progress" 
        estimatedTime={5} 
      />
    );
    
    expect(screen.getByText(/Estimated time: ~5s/)).toBeInTheDocument();
  });

  it('should not display estimated time when stillWorking is true', () => {
    render(
      <LoadingIndicator 
        operation="Processing" 
        estimatedTime={5}
        stillWorking={true}
      />
    );
    
    expect(screen.queryByText(/Estimated time/)).not.toBeInTheDocument();
    expect(screen.getByText(/Still working on it/)).toBeInTheDocument();
  });

  it('should display still working message', () => {
    render(
      <LoadingIndicator 
        operation="Long operation" 
        stillWorking={true}
      />
    );
    
    expect(screen.getByText(/Still working on it/)).toBeInTheDocument();
  });

  it('should render cancel button when cancellable', () => {
    const onCancel = vi.fn();
    
    render(
      <LoadingIndicator 
        operation="Cancellable operation" 
        cancellable={true}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    
    render(
      <LoadingIndicator 
        operation="Cancellable operation" 
        cancellable={true}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not render cancel button when not cancellable', () => {
    render(<LoadingIndicator operation="Non-cancellable operation" />);
    
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('should render custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">Custom</div>;
    
    render(
      <LoadingIndicator 
        operation="With custom icon" 
        icon={customIcon}
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should render default spinner when no icon provided', () => {
    const { container } = render(
      <LoadingIndicator operation="Default spinner" />
    );
    
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });
});

describe('InlineLoadingIndicator', () => {
  it('should render inline with operation text', () => {
    const { container } = render(
      <InlineLoadingIndicator operation="Loading..." />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(container.querySelector('.inline-loading-indicator')).toBeInTheDocument();
  });

  it('should render inline spinner', () => {
    const { container } = render(
      <InlineLoadingIndicator operation="Processing" />
    );
    
    expect(container.querySelector('.inline-spinner')).toBeInTheDocument();
  });
});

describe('SuccessAnimation', () => {
  it('should render success message', () => {
    render(<SuccessAnimation message="Transaction successful!" />);
    
    expect(screen.getByText('Transaction successful!')).toBeInTheDocument();
  });

  it('should render success checkmark SVG', () => {
    const { container } = render(
      <SuccessAnimation message="Success" />
    );
    
    expect(container.querySelector('.success-checkmark')).toBeInTheDocument();
    expect(container.querySelector('.success-svg')).toBeInTheDocument();
  });

  it('should have success animation classes', () => {
    const { container } = render(
      <SuccessAnimation message="Done" />
    );
    
    expect(container.querySelector('.success-circle')).toBeInTheDocument();
    expect(container.querySelector('.success-check')).toBeInTheDocument();
  });
});

describe('LoadingIndicator - Accessibility', () => {
  it('should have accessible cancel button', () => {
    const onCancel = vi.fn();
    
    render(
      <LoadingIndicator 
        operation="Operation" 
        cancellable={true}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel operation/i });
    expect(cancelButton).toHaveAccessibleName();
  });

  it('should be keyboard accessible', () => {
    const onCancel = vi.fn();
    
    render(
      <LoadingIndicator 
        operation="Operation" 
        cancellable={true}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    cancelButton.focus();
    
    expect(document.activeElement).toBe(cancelButton);
  });
});

describe('LoadingIndicator - Different Operation Types', () => {
  const operationTypes = [
    'Connecting wallet',
    'Saving progress',
    'Submitting transaction',
    'Confirming transaction',
    'Loading data',
    'Processing payment',
  ];

  operationTypes.forEach(operation => {
    it(`should display operation: ${operation}`, () => {
      render(<LoadingIndicator operation={operation} />);
      
      expect(screen.getByText(operation)).toBeInTheDocument();
    });
  });
});
