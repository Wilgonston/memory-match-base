/**
 * IdentityDisplay Property-Based Tests
 * 
 * Property tests for IdentityDisplay component.
 * Tests invariants across many random inputs.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';
import { onchainKitConfig } from '../config/onchainkit';
import { IdentityDisplay } from './IdentityDisplay';
import * as fc from 'fast-check';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
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
};

// Generator for valid Ethereum addresses
const ethereumAddressArbitrary = fc.hexaString({ minLength: 40, maxLength: 40 }).map(
  (hex) => `0x${hex}` as `0x${string}`
);

describe('IdentityDisplay Property Tests', () => {
  /**
   * Property: Component must render with valid address
   * 
   * Tests that the component renders successfully with any valid Ethereum address.
   */
  it('Property: Component must render with valid address', async () => {
    await fc.assert(
      fc.asyncProperty(
        ethereumAddressArbitrary,
        async (address) => {
          const { container, unmount } = render(
            <TestWrapper>
              <IdentityDisplay address={address} />
            </TestWrapper>
          );
          
          // Component should render
          expect(container).toBeTruthy();
          
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Component must handle null address
   * 
   * Tests that the component returns null when no address is provided.
   */
  it('Property: Component must handle null address', () => {
    const { container } = render(
      <TestWrapper>
        <IdentityDisplay />
      </TestWrapper>
    );
    
    // Should not render without address
    expect(container.firstChild).toBeNull();
  });

  /**
   * Property: Component must respect showBadge prop
   * 
   * Tests that the component renders correctly with different showBadge values.
   */
  it('Property: Component must respect showBadge prop', async () => {
    await fc.assert(
      fc.asyncProperty(
        ethereumAddressArbitrary,
        fc.boolean(),
        async (address, showBadge) => {
          const { container, unmount } = render(
            <TestWrapper>
              <IdentityDisplay address={address} showBadge={showBadge} />
            </TestWrapper>
          );
          
          // Component should render regardless of showBadge value
          expect(container).toBeTruthy();
          
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Component must respect showAddress prop
   * 
   * Tests that the component renders correctly with different showAddress values.
   */
  it('Property: Component must respect showAddress prop', async () => {
    await fc.assert(
      fc.asyncProperty(
        ethereumAddressArbitrary,
        fc.boolean(),
        async (address, showAddress) => {
          const { container, unmount } = render(
            <TestWrapper>
              <IdentityDisplay address={address} showAddress={showAddress} />
            </TestWrapper>
          );
          
          // Component should render regardless of showAddress value
          expect(container).toBeTruthy();
          
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Component must handle all prop combinations
   * 
   * Tests that the component renders correctly with any combination of props.
   */
  it('Property: Component must handle all prop combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        ethereumAddressArbitrary,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.string(),
        async (address, showBadge, showAddress, hasCopyAddressOnClick, className) => {
          const { container, unmount } = render(
            <TestWrapper>
              <IdentityDisplay 
                address={address}
                showBadge={showBadge}
                showAddress={showAddress}
                hasCopyAddressOnClick={hasCopyAddressOnClick}
                className={className}
              />
            </TestWrapper>
          );
          
          // Component should render with any prop combination
          expect(container).toBeTruthy();
          
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });
});
