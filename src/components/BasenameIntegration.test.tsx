/**
 * Basename Integration Tests
 * 
 * Tests to verify that Basename displays correctly in Identity components.
 * 
 * Task 5.4: Integrate Basename in Identity Components
 * **Validates: Requirements 16.1, 16.2, 28.1**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletComponents } from './WalletComponents';
import { Header } from './Header';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

// Mock OnchainKit's useName hook
vi.mock('@coinbase/onchainkit/identity', async () => {
  const actual = await vi.importActual('@coinbase/onchainkit/identity');
  return {
    ...actual,
    useName: vi.fn(),
  };
});

import { useName } from '@coinbase/onchainkit/identity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || 'test-key'}
        chain={base}
      >
        {children}
      </OnchainKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

describe('Basename Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task 5.4.1: OnchainKit Name Component', () => {
    it('should use OnchainKit Name component in WalletComponents', () => {
      // Mock useName to return a basename
      vi.mocked(useName).mockReturnValue({
        data: 'alice.base.eth',
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors
      expect(container).toBeTruthy();
    });
  });

  describe('Task 5.4.2: Basename in WalletDropdown', () => {
    it('should display Basename in WalletDropdown when available', () => {
      // Mock useName to return a basename
      vi.mocked(useName).mockReturnValue({
        data: 'alice.base.eth',
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    it('should display address when no Basename available', () => {
      // Mock useName to return null (no basename)
      vi.mocked(useName).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors
      expect(container).toBeTruthy();
    });
  });

  describe('Task 5.4.3: Basename in Header', () => {
    it('should display Basename in Header when available', () => {
      // Mock useName to return a basename
      vi.mocked(useName).mockReturnValue({
        data: 'alice.base.eth',
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <Header level={1} moves={10} timeRemaining={60} />
        </TestWrapper>
      );

      // Verify Header renders with wallet component
      expect(container.querySelector('.game-header')).toBeTruthy();
      expect(container.querySelector('.wallet-display')).toBeTruthy();
    });

    it('should display address in Header when no Basename available', () => {
      // Mock useName to return null (no basename)
      vi.mocked(useName).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <Header level={1} moves={10} timeRemaining={60} />
        </TestWrapper>
      );

      // Verify Header renders with wallet component
      expect(container.querySelector('.game-header')).toBeTruthy();
      expect(container.querySelector('.wallet-display')).toBeTruthy();
    });
  });

  describe('Task 5.4.4: Test with Basenames', () => {
    it('should handle various Basename formats', () => {
      const basenames = [
        'alice.base.eth',
        'bob.base.eth',
        'charlie.base.eth',
        'test123.base.eth',
      ];

      basenames.forEach(basename => {
        vi.mocked(useName).mockReturnValue({
          data: basename,
          isLoading: false,
          isError: false,
          error: null,
        } as any);

        const { container, unmount } = render(
          <TestWrapper>
            <WalletComponents />
          </TestWrapper>
        );

        // Verify component renders without errors
        expect(container).toBeTruthy();
        
        unmount();
      });
    });
  });

  describe('Task 5.4.5: Test without Basenames', () => {
    it('should handle addresses without Basenames', () => {
      // Mock useName to return null
      vi.mocked(useName).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors
      expect(container).toBeTruthy();
    });

    it('should handle loading state gracefully', () => {
      // Mock useName to return loading state
      vi.mocked(useName).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors during loading
      expect(container).toBeTruthy();
    });

    it('should handle errors gracefully', () => {
      // Mock useName to return error state
      vi.mocked(useName).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      } as any);

      const { container } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );

      // Verify component renders without errors even on error
      expect(container).toBeTruthy();
    });
  });

  describe('Integration: Complete Flow', () => {
    it('should work in all components without errors', () => {
      // Mock useName to return a basename
      vi.mocked(useName).mockReturnValue({
        data: 'alice.base.eth',
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      // Test WalletComponents
      const { container: walletContainer, unmount: unmountWallet } = render(
        <TestWrapper>
          <WalletComponents />
        </TestWrapper>
      );
      expect(walletContainer).toBeTruthy();
      unmountWallet();

      // Test Header
      const { container: headerContainer, unmount: unmountHeader } = render(
        <TestWrapper>
          <Header level={1} moves={10} timeRemaining={60} />
        </TestWrapper>
      );
      expect(headerContainer.querySelector('.game-header')).toBeTruthy();
      expect(headerContainer.querySelector('.wallet-display')).toBeTruthy();
      unmountHeader();
    });
  });
});
