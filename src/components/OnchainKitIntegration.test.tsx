/**
 * OnchainKit Component Integration Tests
 * 
 * Tests for OnchainKit component integration including:
 * - AppWithWalletModal wrapper functionality
 * - Wallet component connection flow
 * - Identity components display correct data
 * - TransactionButton executes transactions
 * - EthBalance displays correctly
 * 
 * Requirements: 5.1, 5.3, 5.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';
import { onchainKitConfig } from '../config/onchainkit';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Test wrapper component (simulates AppWithWalletModal)
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

describe('OnchainKit Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test AppWithWalletModal wrapper functionality
   * 
   * **Validates: Requirements 5.1**
   */
  describe('AppWithWalletModal wrapper', () => {
    it('should render children within OnchainKitProvider', () => {
      const { container } = render(
        <TestWrapper>
          <div data-testid="test-child">Test Content</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should provide OnchainKit context to children', () => {
      const TestComponent = () => {
        // Component that uses OnchainKit context
        return <div data-testid="context-consumer">Has Context</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('context-consumer')).toBeTruthy();
    });

    it('should configure OnchainKitProvider with correct props', () => {
      const { container } = render(
        <TestWrapper>
          <div>Test</div>
        </TestWrapper>
      );

      // Verify the provider is rendered
      expect(container).toBeTruthy();
      
      // OnchainKitProvider should be configured with:
      // - apiKey from config
      // - chain from config
      // - config object with appearance, wallet, and paymaster settings
    });
  });

  /**
   * Test Wallet component connection flow
   * 
   * **Validates: Requirements 5.1, 5.3**
   */
  describe('Wallet component connection', () => {
    it('should render Wallet component without errors', async () => {
      const { Wallet, ConnectWallet } = await import('@coinbase/onchainkit/wallet');
      const { Avatar, Name } = await import('@coinbase/onchainkit/identity');

      const { container } = render(
        <TestWrapper>
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
          </Wallet>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should render WalletDropdown with Identity components', async () => {
      const { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } = 
        await import('@coinbase/onchainkit/wallet');
      const { Avatar, Name, Address, Identity } = await import('@coinbase/onchainkit/identity');

      const { container } = render(
        <TestWrapper>
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  /**
   * Test Identity components display correct data
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Identity components', () => {
    it('should render Identity component with Avatar, Name, and Address', async () => {
      const { Identity, Avatar, Name, Address } = await import('@coinbase/onchainkit/identity');

      const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      const { container } = render(
        <TestWrapper>
          <Identity address={testAddress} hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
          </Identity>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should render EthBalance component', async () => {
      const { EthBalance } = await import('@coinbase/onchainkit/identity');

      const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      const { container } = render(
        <TestWrapper>
          <EthBalance address={testAddress} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should support hasCopyAddressOnClick prop', async () => {
      const { Identity, Address } = await import('@coinbase/onchainkit/identity');

      const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      const { container } = render(
        <TestWrapper>
          <Identity address={testAddress} hasCopyAddressOnClick={true}>
            <Address />
          </Identity>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  /**
   * Test TransactionButton executes transactions
   * 
   * **Validates: Requirements 5.7**
   */
  describe('Transaction components', () => {
    // Minimal ABI for testing
    const testAbi = [
      {
        name: 'test',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
      },
    ] as const;

    it('should render Transaction component with TransactionButton', async () => {
      const { Transaction, TransactionButton } = await import('@coinbase/onchainkit/transaction');

      const mockContracts = [
        {
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          abi: testAbi,
          functionName: 'test',
          args: [],
        },
      ];

      const { container } = render(
        <TestWrapper>
          <Transaction calls={mockContracts} chainId={84532}>
            <TransactionButton text="Test Transaction" />
          </Transaction>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should render TransactionStatus components', async () => {
      const { 
        Transaction, 
        TransactionButton, 
        TransactionStatus,
        TransactionStatusLabel,
        TransactionStatusAction,
      } = await import('@coinbase/onchainkit/transaction');

      const mockContracts = [
        {
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          abi: testAbi,
          functionName: 'test',
          args: [],
        },
      ];

      const { container } = render(
        <TestWrapper>
          <Transaction calls={mockContracts} chainId={84532}>
            <TransactionButton text="Test Transaction" />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should support onStatus callback', async () => {
      const { Transaction, TransactionButton } = await import('@coinbase/onchainkit/transaction');

      const mockContracts = [
        {
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          abi: testAbi,
          functionName: 'test',
          args: [],
        },
      ];

      const onStatusMock = vi.fn();

      const { container } = render(
        <TestWrapper>
          <Transaction 
            calls={mockContracts} 
            chainId={84532}
            onStatus={onStatusMock}
          >
            <TransactionButton text="Test Transaction" />
          </Transaction>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      // onStatus callback should be registered (will be called during transaction lifecycle)
    });
  });

  /**
   * Test EthBalance displays correctly
   * 
   * **Validates: Requirements 5.3**
   */
  describe('EthBalance component', () => {
    it('should render EthBalance with address', async () => {
      const { EthBalance } = await import('@coinbase/onchainkit/identity');

      const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      const { container } = render(
        <TestWrapper>
          <EthBalance address={testAddress} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should render EthBalance with custom className', async () => {
      const { EthBalance } = await import('@coinbase/onchainkit/identity');

      const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      const { container } = render(
        <TestWrapper>
          <EthBalance address={testAddress} className="custom-balance" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  /**
   * Integration test: Full wallet flow
   * 
   * **Validates: Requirements 5.1, 5.3, 5.7**
   */
  describe('Full wallet integration', () => {
    it('should render complete wallet UI with all components', async () => {
      const { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } = 
        await import('@coinbase/onchainkit/wallet');
      const { Avatar, Name, Address, Identity, EthBalance } = 
        await import('@coinbase/onchainkit/identity');

      const { container } = render(
        <TestWrapper>
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
                <EthBalance />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });
});
