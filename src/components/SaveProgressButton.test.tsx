/**
 * SaveProgressButton Component Tests
 * 
 * Simplified tests for the SaveProgressButton component with OnchainKit Transaction mocks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveProgressButton } from './SaveProgressButton';
import { useAccount } from 'wagmi';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { base } from 'wagmi/chains';

// Mock OnchainKit Transaction components
vi.mock('@coinbase/onchainkit/transaction', () => ({
  Transaction: ({ children, onStatus }: any) => {
    // Store onStatus callback for testing
    (global as any).mockOnStatus = onStatus;
    return <div data-testid="transaction">{children}</div>;
  },
  TransactionButton: ({ text, className }: any) => (
    <button className={className} onClick={() => {
      // Simulate transaction flow
      const onStatus = (global as any).mockOnStatus;
      if (onStatus) {
        // Simulate pending
        onStatus({ statusName: 'transactionPending', statusData: {} });
        // Simulate success after a delay
        setTimeout(() => {
          onStatus({ statusName: 'success', statusData: {} });
        }, 100);
      }
    }}>
      {text}
    </button>
  ),
  TransactionStatus: ({ children }: any) => <div data-testid="transaction-status">{children}</div>,
  TransactionStatusLabel: () => <span>Status Label</span>,
  TransactionStatusAction: () => <span>Status Action</span>,
}));

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
  };
});

// Mock sound manager
vi.mock('../utils/soundManager', () => ({
  playSound: vi.fn(),
}));

// Mock environment variables
vi.stubEnv('VITE_ONCHAINKIT_API_KEY', 'test-api-key');
vi.stubEnv('VITE_CONTRACT_ADDRESS', '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5');

// Create test config
const testConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

// Test wrapper with providers
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={testConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

describe('SaveProgressButton', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useAccount as any).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    });
  });

  describe('Rendering', () => {
    it('should render when wallet is connected', () => {
      render(
        <SaveProgressButton
          level={1}
          stars={3}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole('button', { name: /Save to Blockchain/i })).toBeInTheDocument();
      expect(screen.getByText(/Gas-free transaction/i)).toBeInTheDocument();
    });

    it('should not render when wallet is not connected', () => {
      (useAccount as any).mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      const { container } = render(
        <SaveProgressButton
          level={1}
          stars={3}
        />,
        { wrapper: TestWrapper }
      );

      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SaveProgressButton
          level={1}
          stars={3}
          className="custom-class"
        />,
        { wrapper: TestWrapper }
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Transaction Flow', () => {
    it('should trigger transaction on button click', async () => {
      render(
        <SaveProgressButton
          level={5}
          stars={2}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: TestWrapper }
      );

      const button = screen.getByRole('button', { name: /Save to Blockchain/i });
      fireEvent.click(button);

      // Wait for success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Transaction Status Display', () => {
    it('should display transaction status components', () => {
      render(
        <SaveProgressButton
          level={1}
          stars={3}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('transaction-status')).toBeInTheDocument();
      expect(screen.getByText('Status Label')).toBeInTheDocument();
      expect(screen.getByText('Status Action')).toBeInTheDocument();
    });

    it('should display gas-free information', () => {
      render(
        <SaveProgressButton
          level={1}
          stars={3}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/Gas-free transaction/i)).toBeInTheDocument();
      expect(screen.getByText(/sponsored by Paymaster/i)).toBeInTheDocument();
    });
  });
});
