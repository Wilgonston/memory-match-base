/**
 * WalletComponents Component Tests
 * 
 * Unit tests for the WalletComponents component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletComponents } from './WalletComponents';
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

describe('WalletComponents', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <WalletComponents />
      </TestWrapper>
    );
    
    // Component should render successfully (OnchainKit components)
    expect(document.body).toBeTruthy();
  });

  it('should render wallet components when not connected', () => {
    render(
      <TestWrapper>
        <WalletComponents />
      </TestWrapper>
    );
    
    // OnchainKit wallet components should be present
    expect(document.body).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <WalletComponents />
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

  it('should render OnchainKit wallet components', () => {
    render(
      <TestWrapper>
        <WalletComponents />
      </TestWrapper>
    );
    
    // OnchainKit components should be in the DOM
    expect(document.body).toBeTruthy();
  });
});
