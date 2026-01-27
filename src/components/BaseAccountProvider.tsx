/**
 * Base Account Provider Component
 * 
 * This component wraps the application with Base Account SDK context,
 * providing authentication and payment functionality throughout the app.
 * 
 * The Base Account SDK enables:
 * - Sign in with Base (SIWB) authentication
 * - Base Pay for USDC payments
 * - Base Subscriptions for recurring payments
 * - Integration with Smart Wallets
 * 
 * @see https://docs.base.org/base-account/quickstart/web-react
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { baseAccountConfig, validateBaseAccountConfig } from '../config/base-account';

/**
 * Base Account SDK Type
 * Inferred from the return type of createBaseAccountSDK
 */
type BaseAccountSDK = ReturnType<typeof createBaseAccountSDK>;

/**
 * Base Account Context Interface
 */
interface BaseAccountContextValue {
  /** The Base Account SDK instance */
  sdk: BaseAccountSDK | null;
  /** Whether the SDK is initialized */
  isInitialized: boolean;
  /** Whether a user is signed in */
  isSignedIn: boolean;
  /** The connected user's address (if signed in) */
  userAddress: string | null;
  /** Sign in with Base Account */
  signIn: () => Promise<void>;
  /** Sign out from Base Account */
  signOut: () => Promise<void>;
  /** Error state */
  error: Error | null;
}

/**
 * Base Account Context
 */
const BaseAccountContext = createContext<BaseAccountContextValue | undefined>(undefined);

/**
 * Base Account Provider Props
 */
export interface BaseAccountProviderProps {
  children: React.ReactNode;
}

/**
 * Base Account Provider Component
 * 
 * Wraps the application with Base Account SDK context.
 * Initializes the SDK and provides authentication state and methods.
 * 
 * @example
 * ```tsx
 * <BaseAccountProvider>
 *   <App />
 * </BaseAccountProvider>
 * ```
 */
export function BaseAccountProvider({ children }: BaseAccountProviderProps) {
  const [sdk, setSdk] = useState<BaseAccountSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize the Base Account SDK
   */
  useEffect(() => {
    try {
      // Validate configuration
      const isValid = validateBaseAccountConfig();
      
      if (!isValid) {
        console.warn('[Base Account SDK] Skipping initialization due to missing configuration');
        setIsInitialized(true); // Mark as initialized even if config is missing
        return;
      }

      // Create SDK instance
      const sdkInstance = createBaseAccountSDK({
        appName: baseAccountConfig.appName,
        appLogoUrl: baseAccountConfig.appLogoUrl,
      });

      setSdk(sdkInstance);
      setIsInitialized(true);

      console.log('[Base Account SDK] Initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Base Account SDK');
      console.error('[Base Account SDK] Initialization error:', error);
      setError(error);
      setIsInitialized(true); // Mark as initialized even on error
    }
  }, []);

  /**
   * Sign in with Base Account
   */
  const signIn = useCallback(async () => {
    if (!sdk) {
      const error = new Error('Base Account SDK not initialized');
      setError(error);
      throw error;
    }

    try {
      setError(null);
      
      // Request wallet connection
      const provider = sdk.getProvider();
      const accounts = await provider.request({ 
        method: 'wallet_connect' 
      }) as string[];

      if (accounts && accounts.length > 0) {
        setIsSignedIn(true);
        setUserAddress(accounts[0]);
        console.log('[Base Account SDK] Sign in successful:', accounts[0]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      console.error('[Base Account SDK] Sign in error:', error);
      setError(error);
      throw error;
    }
  }, [sdk]);

  /**
   * Sign out from Base Account
   */
  const signOut = useCallback(async () => {
    try {
      setError(null);
      setIsSignedIn(false);
      setUserAddress(null);
      console.log('[Base Account SDK] Sign out successful');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      console.error('[Base Account SDK] Sign out error:', error);
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Listen for account changes
   */
  useEffect(() => {
    if (!sdk) return;

    try {
      const provider = sdk.getProvider();
      
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsSignedIn(false);
          setUserAddress(null);
          console.log('[Base Account SDK] Account disconnected');
        } else {
          setIsSignedIn(true);
          setUserAddress(accounts[0]);
          console.log('[Base Account SDK] Account changed:', accounts[0]);
        }
      };

      // Subscribe to account changes
      provider.on('accountsChanged', handleAccountsChanged);

      // Cleanup
      return () => {
        provider.removeListener('accountsChanged', handleAccountsChanged);
      };
    } catch (err) {
      console.error('[Base Account SDK] Error setting up event listeners:', err);
    }
  }, [sdk]);

  const value: BaseAccountContextValue = {
    sdk,
    isInitialized,
    isSignedIn,
    userAddress,
    signIn,
    signOut,
    error,
  };

  return (
    <BaseAccountContext.Provider value={value}>
      {children}
    </BaseAccountContext.Provider>
  );
}

/**
 * Hook to use Base Account context
 * 
 * @throws {Error} If used outside of BaseAccountProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sdk, isSignedIn, signIn } = useBaseAccount();
 *   
 *   return (
 *     <button onClick={signIn} disabled={!sdk}>
 *       {isSignedIn ? 'Connected' : 'Sign in with Base'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBaseAccount(): BaseAccountContextValue {
  const context = useContext(BaseAccountContext);
  
  if (context === undefined) {
    throw new Error('useBaseAccount must be used within a BaseAccountProvider');
  }
  
  return context;
}
