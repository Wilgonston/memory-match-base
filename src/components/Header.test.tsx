/**
 * Header Component Unit Tests
 * 
 * Tests header rendering, time formatting, and responsive display.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';
import { onchainKitConfig } from '../config/onchainkit';

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        apiKey={onchainKitConfig.apiKey}
        chain={onchainKitConfig.chain}
        config={onchainKitConfig.config}
      >
        {children}
      </OnchainKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

describe('Header Component', () => {
  it('should render header with all elements', () => {
    render(<Header level={1} moves={0} timeRemaining={60} />, { wrapper: TestWrapper });
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for labels
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Moves')).toBeInTheDocument();
  });

  it('should display correct level number', () => {
    render(<Header level={42} moves={10} timeRemaining={90} />, { wrapper: TestWrapper });
    
    const levelValue = screen.getByLabelText('Level 42');
    expect(levelValue).toBeInTheDocument();
    expect(levelValue).toHaveTextContent('42');
  });

  it('should display formatted time correctly', () => {
    render(<Header level={1} moves={5} timeRemaining={125} />, { wrapper: TestWrapper });
    
    const timeValue = screen.getByLabelText('Time remaining: 02:05');
    expect(timeValue).toBeInTheDocument();
    expect(timeValue).toHaveTextContent('02:05');
  });

  it('should display time in MM:SS format for various values', () => {
    const { rerender } = render(<Header level={1} moves={0} timeRemaining={0} />, { wrapper: TestWrapper });
    expect(screen.getByLabelText('Time remaining: 00:00')).toHaveTextContent('00:00');
    
    rerender(<Header level={1} moves={0} timeRemaining={59} />);
    expect(screen.getByLabelText('Time remaining: 00:59')).toHaveTextContent('00:59');
    
    rerender(<Header level={1} moves={0} timeRemaining={60} />);
    expect(screen.getByLabelText('Time remaining: 01:00')).toHaveTextContent('01:00');
    
    rerender(<Header level={1} moves={0} timeRemaining={120} />);
    expect(screen.getByLabelText('Time remaining: 02:00')).toHaveTextContent('02:00');
  });

  it('should display correct move count', () => {
    render(<Header level={1} moves={15} timeRemaining={60} />, { wrapper: TestWrapper });
    
    const movesValue = screen.getByLabelText('15 moves made');
    expect(movesValue).toBeInTheDocument();
    expect(movesValue).toHaveTextContent('15');
  });

  it('should apply warning class when time is low', () => {
    render(<Header level={1} moves={5} timeRemaining={10} />, { wrapper: TestWrapper });
    
    const timeValue = screen.getByLabelText('Time remaining: 00:10');
    expect(timeValue).toHaveClass('time-warning');
  });

  it('should not apply warning class when time is above threshold', () => {
    render(<Header level={1} moves={5} timeRemaining={11} />, { wrapper: TestWrapper });
    
    const timeValue = screen.getByLabelText('Time remaining: 00:11');
    expect(timeValue).not.toHaveClass('time-warning');
  });

  it('should handle zero moves', () => {
    render(<Header level={1} moves={0} timeRemaining={60} />, { wrapper: TestWrapper });
    
    const movesValue = screen.getByLabelText('0 moves made');
    expect(movesValue).toHaveTextContent('0');
  });

  it('should handle level 100', () => {
    render(<Header level={100} moves={50} timeRemaining={120} />, { wrapper: TestWrapper });
    
    const levelValue = screen.getByLabelText('Level 100');
    expect(levelValue).toHaveTextContent('100');
  });

  it('should handle large move counts', () => {
    render(<Header level={50} moves={999} timeRemaining={30} />, { wrapper: TestWrapper });
    
    const movesValue = screen.getByLabelText('999 moves made');
    expect(movesValue).toHaveTextContent('999');
  });

  it('should update when props change', () => {
    const { rerender } = render(<Header level={1} moves={5} timeRemaining={60} />, { wrapper: TestWrapper });
    
    expect(screen.getByLabelText('5 moves made')).toHaveTextContent('5');
    expect(screen.getByLabelText('Time remaining: 01:00')).toHaveTextContent('01:00');
    
    rerender(<Header level={1} moves={6} timeRemaining={59} />);
    
    expect(screen.getByLabelText('6 moves made')).toHaveTextContent('6');
    expect(screen.getByLabelText('Time remaining: 00:59')).toHaveTextContent('00:59');
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<Header level={5} moves={10} timeRemaining={45} />, { wrapper: TestWrapper });
    
    expect(screen.getByLabelText('Level 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining: 00:45')).toBeInTheDocument();
    expect(screen.getByLabelText('10 moves made')).toBeInTheDocument();
  });
});
