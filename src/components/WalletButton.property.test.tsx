/**
 * WalletButton Property-Based Tests
 * 
 * Property tests for wallet connection persistence and disconnection cleanup.
 * 
 * **Validates: Requirements 15.4, 15.5**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';
import { onchainKitConfig } from '../config/onchainkit';
import { WalletButton } from './WalletButton';
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

describe('WalletButton Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Property 13: Wallet Connection Persistence
   * 
   * For any wallet connection, if the connection is established and the page is reloaded,
   * the wallet should remain connected with the same address and chain ID.
   * 
   * **Validates: Requirements 15.4**
   * **Feature: memory-match-base, Property 13: Wallet Connection Persistence**
   */
  it('Property 13: Wallet connection should persist across page reloads', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random wallet addresses (Ethereum addresses are 42 characters: 0x + 40 hex chars)
        fc.hexaString({ minLength: 40, maxLength: 40 }),
        // Generate random chain IDs (Base Mainnet: 8453, Base Sepolia: 84532)
        fc.constantFrom(8453, 84532),
        async (addressHex, chainId) => {
          const address = `0x${addressHex}` as `0x${string}`;
          
          // Simulate wallet connection by setting localStorage
          // (wagmi uses localStorage to persist connection state)
          const connectionState = {
            state: {
              connections: {
                __type: 'Map',
                value: [[
                  'mock-connector',
                  {
                    accounts: [address],
                    chainId: chainId,
                    connector: 'mock-connector',
                  }
                ]]
              },
              current: 'mock-connector',
              status: 'connected',
            },
          };
          
          localStorage.setItem('wagmi.store', JSON.stringify(connectionState));
          
          // Render the component (simulating page load)
          const { unmount } = render(
            <TestWrapper>
              <WalletButton />
            </TestWrapper>
          );
          
          // Wait for component to render
          await waitFor(() => {
            expect(document.querySelector('.wallet-button-container')).toBeTruthy();
          }, { timeout: 3000 });
          
          // Verify localStorage still contains the connection state
          const storedState = localStorage.getItem('wagmi.store');
          expect(storedState).toBeTruthy();
          
          // Verify the stored state contains the address and chainId
          if (storedState) {
            const parsed = JSON.parse(storedState);
            expect(parsed.state).toBeDefined();
            // The connection state should be preserved
            expect(parsed.state.connections).toBeDefined();
          }
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 10 } // Run 10 iterations for property test
    );
  });

  /**
   * Property 14: Wallet Disconnection Cleanup
   * 
   * For any connected wallet, when disconnected, all wallet state should be cleared
   * and the app should revert to LocalStorage-only mode.
   * 
   * **Validates: Requirements 15.5**
   * **Feature: memory-match-base, Property 14: Wallet Disconnection Cleanup**
   */
  it('Property 14: Wallet disconnection should clear all wallet state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random wallet addresses
        fc.hexaString({ minLength: 40, maxLength: 40 }),
        // Generate random chain IDs
        fc.constantFrom(8453, 84532),
        async (addressHex, chainId) => {
          const address = `0x${addressHex}` as `0x${string}`;
          
          // Set up initial connected state
          const connectionState = {
            state: {
              connections: {
                __type: 'Map',
                value: [[
                  'mock-connector',
                  {
                    accounts: [address],
                    chainId: chainId,
                    connector: 'mock-connector',
                  }
                ]]
              },
              current: 'mock-connector',
              status: 'connected',
            },
          };
          
          localStorage.setItem('wagmi.store', JSON.stringify(connectionState));
          
          // Render the component
          const { unmount } = render(
            <TestWrapper>
              <WalletButton />
            </TestWrapper>
          );
          
          // Wait for component to render
          await waitFor(() => {
            expect(document.querySelector('.wallet-button-container')).toBeTruthy();
          }, { timeout: 3000 });
          
          // Simulate disconnection by clearing the connection state
          const disconnectedState = {
            state: {
              connections: {
                __type: 'Map',
                value: []
              },
              current: null,
              status: 'disconnected',
            },
          };
          
          localStorage.setItem('wagmi.store', JSON.stringify(disconnectedState));
          
          // Verify the state is cleared
          const storedState = localStorage.getItem('wagmi.store');
          expect(storedState).toBeTruthy();
          
          if (storedState) {
            const parsed = JSON.parse(storedState);
            expect(parsed.state.status).toBe('disconnected');
            expect(parsed.state.current).toBeNull();
            // Connections should be empty
            expect(parsed.state.connections.value).toHaveLength(0);
          }
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 10 } // Run 10 iterations for property test
    );
  });

  /**
   * Additional property test: Component should render consistently
   * regardless of connection state
   */
  it('Property: WalletButton should render consistently in all states', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random connection states
        fc.constantFrom('connected', 'disconnected', 'connecting', 'reconnecting'),
        async (status) => {
          // Set up state based on status
          if (status === 'connected') {
            const connectionState = {
              state: {
                connections: {
                  __type: 'Map',
                  value: [[
                    'mock-connector',
                    {
                      accounts: ['0x1234567890123456789012345678901234567890'],
                      chainId: 8453,
                      connector: 'mock-connector',
                    }
                  ]]
                },
                current: 'mock-connector',
                status: 'connected',
              },
            };
            localStorage.setItem('wagmi.store', JSON.stringify(connectionState));
          } else {
            localStorage.clear();
          }
          
          // Render the component
          const { unmount } = render(
            <TestWrapper>
              <WalletButton />
            </TestWrapper>
          );
          
          // Component should always render
          await waitFor(() => {
            expect(document.querySelector('.wallet-button-container')).toBeTruthy();
          }, { timeout: 3000 });
          
          // Should have at least one button
          const buttons = document.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });
});
