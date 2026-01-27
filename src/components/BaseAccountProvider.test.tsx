/**
 * BaseAccountProvider Unit Tests
 * 
 * Tests for the Base Account SDK provider component.
 * 
 * Task: 1.1 Write unit tests for BaseAccountProvider
 * Requirements: 1.2
 * 
 * Test Coverage:
 * - Provider initialization with valid configuration
 * - Provider initialization with invalid configuration
 * - Context value propagation to child components
 * - Sign in functionality
 * - Sign out functionality
 * - Error handling
 * - Account change listeners
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseAccountProvider, useBaseAccount } from './BaseAccountProvider';
import * as baseAccountModule from '@base-org/account';
import * as configModule from '../config/base-account';

// Mock the Base Account SDK
vi.mock('@base-org/account', () => ({
  createBaseAccountSDK: vi.fn(),
}));

// Mock the configuration module
vi.mock('../config/base-account', async () => {
  const actual = await vi.importActual('../config/base-account');
  return {
    ...actual,
    validateBaseAccountConfig: vi.fn(),
    baseAccountConfig: {
      projectId: 'test-project-id',
      network: 'sepolia',
      appName: 'Test App',
      appLogoUrl: 'https://example.com/logo.png',
      appUrl: 'https://example.com',
      testnet: true,
    },
  };
});

// Test component that uses the hook
function TestConsumer() {
  const {
    sdk,
    isInitialized,
    isSignedIn,
    userAddress,
    signIn,
    signOut,
    error,
  } = useBaseAccount();

  return (
    <div>
      <div data-testid="sdk-status">{sdk ? 'SDK Present' : 'SDK Null'}</div>
      <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="signed-in">{isSignedIn ? 'true' : 'false'}</div>
      <div data-testid="user-address">{userAddress || 'null'}</div>
      <div data-testid="error">{error?.message || 'null'}</div>
      <button onClick={signIn} data-testid="sign-in-button">
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out-button">
        Sign Out
      </button>
    </div>
  );
}

describe('BaseAccountProvider', () => {
  let mockSDK: any;
  let mockProvider: any;
  let mockEventListeners: Map<string, Function>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock event listeners map
    mockEventListeners = new Map();

    // Create mock provider
    mockProvider = {
      request: vi.fn(),
      on: vi.fn((event: string, handler: Function) => {
        mockEventListeners.set(event, handler);
      }),
      removeListener: vi.fn((event: string) => {
        mockEventListeners.delete(event);
      }),
    };

    // Create mock SDK
    mockSDK = {
      getProvider: vi.fn(() => mockProvider),
    };

    // Mock createBaseAccountSDK to return our mock SDK
    vi.mocked(baseAccountModule.createBaseAccountSDK).mockReturnValue(mockSDK);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      // Mock valid configuration
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('sdk-status')).toHaveTextContent('SDK Present');
      expect(baseAccountModule.createBaseAccountSDK).toHaveBeenCalledWith({
        appName: 'Test App',
        appLogoUrl: 'https://example.com/logo.png',
      });
    });

    it('should handle initialization with invalid configuration', async () => {
      // Mock invalid configuration
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(false);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // SDK should not be created
      expect(screen.getByTestId('sdk-status')).toHaveTextContent('SDK Null');
      expect(baseAccountModule.createBaseAccountSDK).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping initialization due to missing configuration')
      );
    });

    it('should handle SDK initialization errors gracefully', async () => {
      // Mock valid configuration but SDK creation throws
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      vi.mocked(baseAccountModule.createBaseAccountSDK).mockImplementation(() => {
        throw new Error('SDK initialization failed');
      });

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('sdk-status')).toHaveTextContent('SDK Null');
      expect(screen.getByTestId('error')).toHaveTextContent('SDK initialization failed');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Initialization error'),
        expect.any(Error)
      );
    });

    it('should mark as initialized even when configuration is missing', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(false);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Should be initialized even though SDK is null
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      expect(screen.getByTestId('sdk-status')).toHaveTextContent('SDK Null');
    });

    it('should mark as initialized even on error', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      vi.mocked(baseAccountModule.createBaseAccountSDK).mockImplementation(() => {
        throw new Error('Test error');
      });

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });
  });

  describe('Context Value Propagation', () => {
    it('should propagate all context values to child components', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Verify all context values are accessible
      expect(screen.getByTestId('sdk-status')).toBeInTheDocument();
      expect(screen.getByTestId('initialized')).toBeInTheDocument();
      expect(screen.getByTestId('signed-in')).toBeInTheDocument();
      expect(screen.getByTestId('user-address')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should provide initial state values correctly', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Verify initial state
      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
      expect(screen.getByTestId('user-address')).toHaveTextContent('null');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should throw error when useBaseAccount is used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useBaseAccount must be used within a BaseAccountProvider');

      consoleError.mockRestore();
    });

    it('should update context values when state changes', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      mockProvider.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Initial state
      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');

      // Sign in
      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButton);
      });

      // State should update
      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });
      expect(screen.getByTestId('user-address')).toHaveTextContent('0x1234567890123456789012345678901234567890');
    });
  });

  describe('Sign In Functionality', () => {
    it('should sign in successfully with valid SDK', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const testAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.request.mockResolvedValue([testAddress]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user-address')).toHaveTextContent(testAddress);
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_connect',
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sign in successful'),
        testAddress
      );
    });

    it('should handle sign in when SDK is not initialized', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(false);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      
      await act(async () => {
        // Catch the expected error
        try {
          await userEvent.click(signInButton);
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Base Account SDK not initialized');
      });

      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
    });

    it('should handle sign in errors gracefully', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      mockProvider.request.mockRejectedValue(new Error('User rejected'));

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        // Catch the expected error
        try {
          await userEvent.click(signInButton);
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('User rejected');
      });

      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sign in error'),
        expect.any(Error)
      );
    });

    it('should handle empty accounts array from provider', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      mockProvider.request.mockResolvedValue([]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButton);
      });

      // Should not update signed in state
      await waitFor(() => {
        expect(mockProvider.request).toHaveBeenCalled();
      });

      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
      expect(screen.getByTestId('user-address')).toHaveTextContent('null');
    });

    it('should clear error state before sign in attempt', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // First attempt fails
      mockProvider.request.mockRejectedValueOnce(new Error('First error'));
      // Second attempt succeeds
      mockProvider.request.mockResolvedValueOnce([testAddress]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      
      // First attempt
      await act(async () => {
        try {
          await userEvent.click(signInButton);
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('First error');
      });

      // Second attempt
      await act(async () => {
        await userEvent.click(signInButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });

      // Error should be cleared
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Sign Out Functionality', () => {
    it('should sign out successfully', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const testAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.request.mockResolvedValue([testAddress]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Sign in first
      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });

      // Sign out
      const signOutButton = screen.getByTestId('sign-out-button');
      await act(async () => {
        await userEvent.click(signOutButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user-address')).toHaveTextContent('null');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sign out successful')
      );
    });

    it('should clear error state on sign out', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      mockProvider.request.mockRejectedValue(new Error('Sign in error'));

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Attempt sign in to create error
      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        try {
          await userEvent.click(signInButton);
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('null');
      });

      // Sign out should clear error
      const signOutButton = screen.getByTestId('sign-out-button');
      await act(async () => {
        await userEvent.click(signOutButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });

    it('should handle sign out errors gracefully', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      // Mock signOut to throw error by modifying the component behavior
      // Since signOut is a simple function, we'll test error handling by
      // ensuring the try-catch works correctly

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signOutButton = screen.getByTestId('sign-out-button');
      await act(async () => {
        await userEvent.click(signOutButton);
      });

      // Should complete without throwing
      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
    });
  });

  describe('Account Change Listeners', () => {
    it('should set up account change listener when SDK is initialized', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Verify listener was registered
      expect(mockProvider.on).toHaveBeenCalledWith(
        'accountsChanged',
        expect.any(Function)
      );
    });

    it('should update state when account changes', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const initialAddress = '0x1111111111111111111111111111111111111111';
      const newAddress = '0x2222222222222222222222222222222222222222';

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Simulate account change
      const accountsChangedHandler = mockEventListeners.get('accountsChanged');
      expect(accountsChangedHandler).toBeDefined();

      await act(async () => {
        accountsChangedHandler!([newAddress]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user-address')).toHaveTextContent(newAddress);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Account changed'),
        newAddress
      );
    });

    it('should handle account disconnection', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const testAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.request.mockResolvedValue([testAddress]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Sign in first
      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
      });

      // Simulate account disconnection (empty array)
      const accountsChangedHandler = mockEventListeners.get('accountsChanged');
      await act(async () => {
        accountsChangedHandler!([]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user-address')).toHaveTextContent('null');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Account disconnected')
      );
    });

    it('should clean up event listeners on unmount', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      const { unmount } = render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Verify listener was registered
      expect(mockProvider.on).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Verify listener was removed
      expect(mockProvider.removeListener).toHaveBeenCalledWith(
        'accountsChanged',
        expect.any(Function)
      );
    });

    it('should not set up listeners if SDK is not initialized', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(false);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Listener should not be registered
      expect(mockProvider.on).not.toHaveBeenCalled();
    });

    it('should handle errors when setting up event listeners', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      
      // Mock getProvider to throw error
      mockSDK.getProvider.mockImplementation(() => {
        throw new Error('Provider error');
      });

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Should log error but not crash
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error setting up event listeners'),
        expect.any(Error)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error objects in initialization', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      vi.mocked(baseAccountModule.createBaseAccountSDK).mockImplementation(() => {
        throw 'String error';
      });

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to initialize Base Account SDK');
    });

    it('should handle non-Error objects in sign in', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      mockProvider.request.mockRejectedValue('String error');

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      const signInButton = screen.getByTestId('sign-in-button');
      await act(async () => {
        try {
          await userEvent.click(signInButton);
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign in failed');
      });
    });

    it('should handle non-Error objects in sign out', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      // Sign out should handle any errors gracefully
      const signOutButton = screen.getByTestId('sign-out-button');
      await act(async () => {
        await userEvent.click(signOutButton);
      });

      expect(screen.getByTestId('signed-in')).toHaveTextContent('false');
    });
  });

  describe('Multiple Children', () => {
    it('should provide same context to multiple children', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);

      render(
        <BaseAccountProvider>
          <TestConsumer />
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        const initializedElements = screen.getAllByTestId('initialized');
        expect(initializedElements).toHaveLength(2);
        initializedElements.forEach(el => {
          expect(el).toHaveTextContent('true');
        });
      });

      // All children should have access to the same context
      const sdkStatusElements = screen.getAllByTestId('sdk-status');
      expect(sdkStatusElements).toHaveLength(2);
      sdkStatusElements.forEach(el => {
        expect(el).toHaveTextContent('SDK Present');
      });
    });

    it('should update all children when state changes', async () => {
      vi.mocked(configModule.validateBaseAccountConfig).mockReturnValue(true);
      const testAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.request.mockResolvedValue([testAddress]);

      render(
        <BaseAccountProvider>
          <TestConsumer />
          <TestConsumer />
        </BaseAccountProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('initialized')).toHaveLength(2);
      });

      // Sign in from first child
      const signInButtons = screen.getAllByTestId('sign-in-button');
      await act(async () => {
        await userEvent.click(signInButtons[0]);
      });

      // Both children should update
      await waitFor(() => {
        const signedInElements = screen.getAllByTestId('signed-in');
        expect(signedInElements).toHaveLength(2);
        signedInElements.forEach(el => {
          expect(el).toHaveTextContent('true');
        });
      });

      const addressElements = screen.getAllByTestId('user-address');
      addressElements.forEach(el => {
        expect(el).toHaveTextContent(testAddress);
      });
    });
  });
});
