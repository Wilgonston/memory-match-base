import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
});

// Mock wagmi hooks globally
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    })),
    useChainId: vi.fn(() => 8453), // Base Mainnet
    useSwitchChain: vi.fn(() => ({
      switchChain: vi.fn(),
      isPending: false,
    })),
    useConnect: vi.fn(() => ({
      connect: vi.fn(),
      connectors: [],
      isPending: false,
    })),
    useSignMessage: vi.fn(() => ({
      signMessageAsync: vi.fn().mockResolvedValue('0xmockedsignature'),
    })),
  };
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
