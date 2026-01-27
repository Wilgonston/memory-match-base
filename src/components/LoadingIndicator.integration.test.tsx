/**
 * LoadingIndicator Integration Tests
 * 
 * Tests for loading indicator integration with blockchain operations.
 * 
 * Requirements: 12.1, 12.6, 12.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LoadingIndicator, SuccessAnimation } from './LoadingIndicator';

describe('LoadingIndicator Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading indicator for blockchain operations', () => {
    render(
      <LoadingIndicator
        operation="Loading progress from blockchain"
        estimatedTime={3}
      />
    );

    expect(screen.getByText('Loading progress from blockchain')).toBeInTheDocument();
    expect(screen.getByText(/Estimated time: ~3s/)).toBeInTheDocument();
  });

  it('should display loading indicator for wallet connection', () => {
    render(
      <LoadingIndicator
        operation="Connecting wallet"
        estimatedTime={2}
      />
    );

    expect(screen.getByText('Connecting wallet')).toBeInTheDocument();
  });

  it('should display loading indicator for transaction submission', () => {
    render(
      <LoadingIndicator
        operation="Submitting transaction"
      />
    );

    expect(screen.getByText('Submitting transaction')).toBeInTheDocument();
  });

  it('should display loading indicator for paymaster calls', () => {
    render(
      <LoadingIndicator
        operation="Requesting gas sponsorship"
        estimatedTime={1}
      />
    );

    expect(screen.getByText('Requesting gas sponsorship')).toBeInTheDocument();
  });

  it('should show still working message for long operations', async () => {
    const { rerender } = render(
      <LoadingIndicator
        operation="Processing transaction"
        estimatedTime={5}
      />
    );

    // Initially shows estimated time
    expect(screen.getByText(/Estimated time: ~5s/)).toBeInTheDocument();

    // After timeout, show still working message
    rerender(
      <LoadingIndicator
        operation="Processing transaction"
        estimatedTime={5}
        stillWorking={true}
      />
    );

    expect(screen.getByText(/Still working on it/)).toBeInTheDocument();
    expect(screen.queryByText(/Estimated time/)).not.toBeInTheDocument();
  });

  it('should display success animation after operation completes', () => {
    render(
      <SuccessAnimation message="Progress loaded successfully!" />
    );

    expect(screen.getByText('Progress loaded successfully!')).toBeInTheDocument();
  });

  it('should maintain game interactivity during non-blocking operations', () => {
    const { container } = render(
      <div>
        <LoadingIndicator operation="Syncing to blockchain" />
        <button>Continue Playing</button>
      </div>
    );

    // Loading indicator should not block other UI elements
    const button = screen.getByText('Continue Playing');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should handle multiple concurrent loading operations', () => {
    const { container } = render(
      <div>
        <LoadingIndicator operation="Loading progress" />
        <LoadingIndicator operation="Syncing data" />
      </div>
    );

    expect(screen.getByText('Loading progress')).toBeInTheDocument();
    expect(screen.getByText('Syncing data')).toBeInTheDocument();
  });

  it('should display appropriate loading states for different blockchain operations', () => {
    const operations = [
      'Connecting wallet',
      'Loading progress from blockchain',
      'Saving progress',
      'Submitting transaction',
      'Confirming transaction',
      'Requesting gas sponsorship',
      'Switching network',
    ];

    operations.forEach(operation => {
      const { unmount } = render(
        <LoadingIndicator operation={operation} />
      );

      expect(screen.getByText(operation)).toBeInTheDocument();
      unmount();
    });
  });

  it('should show success animation with appropriate message', () => {
    const messages = [
      'Transaction confirmed!',
      'Progress saved successfully!',
      'Wallet connected!',
      'Network switched!',
    ];

    messages.forEach(message => {
      const { unmount } = render(
        <SuccessAnimation message={message} />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle loading state transitions', async () => {
    const { rerender } = render(
      <LoadingIndicator operation="Processing" estimatedTime={5} />
    );

    // Initial state
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText(/Estimated time: ~5s/)).toBeInTheDocument();

    // Transition to still working
    rerender(
      <LoadingIndicator operation="Processing" estimatedTime={5} stillWorking={true} />
    );

    expect(screen.getByText(/Still working on it/)).toBeInTheDocument();
  });

  it('should render loading indicator with spinner animation', () => {
    const { container } = render(
      <LoadingIndicator operation="Loading" />
    );

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    
    // Check for spinner rings
    const rings = container.querySelectorAll('.spinner-ring');
    expect(rings.length).toBe(3);
  });

  it('should render success animation with checkmark', () => {
    const { container } = render(
      <SuccessAnimation message="Success!" />
    );

    const checkmark = container.querySelector('.success-checkmark');
    expect(checkmark).toBeInTheDocument();

    const svg = container.querySelector('.success-svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('LoadingIndicator - Blockchain Operation Scenarios', () => {
  it('should handle wallet connection flow', async () => {
    const { rerender } = render(
      <LoadingIndicator operation="Connecting wallet" estimatedTime={2} />
    );

    expect(screen.getByText('Connecting wallet')).toBeInTheDocument();

    // Simulate successful connection
    rerender(<SuccessAnimation message="Wallet connected!" />);

    await waitFor(() => {
      expect(screen.getByText('Wallet connected!')).toBeInTheDocument();
    });
  });

  it('should handle transaction submission flow', async () => {
    const { rerender } = render(
      <LoadingIndicator operation="Submitting transaction" />
    );

    expect(screen.getByText('Submitting transaction')).toBeInTheDocument();

    // Simulate successful submission
    rerender(<SuccessAnimation message="Transaction submitted!" />);

    await waitFor(() => {
      expect(screen.getByText('Transaction submitted!')).toBeInTheDocument();
    });
  });

  it('should handle progress loading flow', async () => {
    const { rerender } = render(
      <LoadingIndicator operation="Loading progress from blockchain" estimatedTime={3} />
    );

    expect(screen.getByText('Loading progress from blockchain')).toBeInTheDocument();

    // Simulate successful load
    rerender(<SuccessAnimation message="Progress loaded successfully!" />);

    await waitFor(() => {
      expect(screen.getByText('Progress loaded successfully!')).toBeInTheDocument();
    });
  });

  it('should handle paymaster sponsorship flow', async () => {
    const { rerender } = render(
      <LoadingIndicator operation="Requesting gas sponsorship" estimatedTime={1} />
    );

    expect(screen.getByText('Requesting gas sponsorship')).toBeInTheDocument();

    // Simulate successful sponsorship
    rerender(<SuccessAnimation message="Gas sponsored!" />);

    await waitFor(() => {
      expect(screen.getByText('Gas sponsored!')).toBeInTheDocument();
    });
  });
});
