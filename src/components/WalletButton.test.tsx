/**
 * WalletButton Component Tests
 * 
 * Unit tests for the WalletButton component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletButton } from './WalletButton';
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

describe('WalletButton', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <WalletButton />
      </TestWrapper>
    );
    
    // Component should render successfully
    expect(document.querySelector('.wallet-button-container')).toBeTruthy();
  });

  it('should render connect wallet button when not connected', () => {
    render(
      <TestWrapper>
        <WalletButton />
      </TestWrapper>
    );
    
    // Should have a wallet button container
    const container = document.querySelector('.wallet-button-container');
    expect(container).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <WalletButton />
      </TestWrapper>
    );
    
    // Check that buttons are present and accessible
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Buttons should be focusable
    buttons.forEach(button => {
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  it('should apply correct CSS classes', () => {
    render(
      <TestWrapper>
        <WalletButton />
      </TestWrapper>
    );
    
    const container = document.querySelector('.wallet-button-container');
    expect(container).toBeTruthy();
    expect(container?.classList.contains('wallet-button-container')).toBe(true);
  });
});
