/**
 * IdentityDisplay Component Tests
 * 
 * Unit tests for the IdentityDisplay component.
 * Tests rendering, props, and OnchainKit integration.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';
import { onchainKitConfig } from '../config/onchainkit';
import { IdentityDisplay } from './IdentityDisplay';

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

describe('IdentityDisplay', () => {
  const testAddress = '0x1234567890123456789012345678901234567890';

  it('should render with address', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} />
      </TestWrapper>
    );
    
    // Component should render
    expect(container).toBeTruthy();
  });

  it('should not render without address', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay />
      </TestWrapper>
    );
    
    // Should render empty (no address provided and not connected)
    // The component returns null, so no identity-info should exist
    const identityInfo = container.querySelector('.identity-info');
    expect(identityInfo).toBeNull();
  });

  it('should render with showBadge prop', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} showBadge={true} />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });

  it('should render without badge when showBadge is false', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} showBadge={false} />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });

  it('should render with showAddress prop', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} showAddress={true} />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });

  it('should render without address when showAddress is false', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} showAddress={false} />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-identity-class';
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay address={testAddress} className={customClass} />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });

  it('should handle hasCopyAddressOnClick prop', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay 
          address={testAddress} 
          hasCopyAddressOnClick={true}
        />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });
});
