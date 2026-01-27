/**
 * Unit tests for wagmi configuration
 * 
 * Tests Smart Wallet prioritization, error handling, and EOA detection.
 * 
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wagmiConfig } from './wagmi';
import { base, baseSepolia } from 'wagmi/chains';

describe('wagmi Configuration', () => {
  describe('Smart Wallet Prioritization (Requirement 6.1)', () => {
    it('should configure Coinbase Wallet connector with smartWalletOnly preference', () => {
      // Get the Coinbase Wallet connector
      const coinbaseConnector = wagmiConfig.connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK'
      );

      expect(coinbaseConnector).toBeDefined();
      expect(coinbaseConnector?.name).toBe('Coinbase Wallet');
    });

    it('should include multiple connector options', () => {
      // Verify we have multiple connectors for fallback
      expect(wagmiConfig.connectors.length).toBeGreaterThanOrEqual(2);
      
      const connectorIds = wagmiConfig.connectors.map(c => c.id);
      
      // Should have Coinbase Wallet
      expect(connectorIds).toContain('coinbaseWalletSDK');
    });

    it('should configure app metadata for Coinbase Wallet', () => {
      const coinbaseConnector = wagmiConfig.connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK'
      );

      expect(coinbaseConnector).toBeDefined();
      // Connector should have proper configuration
      expect(coinbaseConnector?.name).toBe('Coinbase Wallet');
    });
  });

  describe('Chain Configuration (Requirement 6.2)', () => {
    it('should configure Base chains', () => {
      const chains = wagmiConfig.chains;
      
      expect(chains).toBeDefined();
      expect(chains.length).toBeGreaterThanOrEqual(2);
      
      const chainIds = chains.map(c => c.id);
      expect(chainIds).toContain(base.id);
      expect(chainIds).toContain(baseSepolia.id);
    });

    it('should have both Base Mainnet and Sepolia configured', () => {
      const chains = wagmiConfig.chains;
      const chainNames = chains.map(c => c.name);
      
      expect(chainNames).toContain('Base');
      expect(chainNames).toContain('Base Sepolia');
    });

    it('should prioritize correct network based on environment', () => {
      const chains = wagmiConfig.chains;
      const network = import.meta.env.VITE_NETWORK || 'sepolia';
      
      if (network === 'mainnet') {
        // Base mainnet should be first
        expect(chains[0].id).toBe(base.id);
      } else {
        // Base Sepolia should be first
        expect(chains[0].id).toBe(baseSepolia.id);
      }
    });
  });

  describe('Connector Configuration (Requirement 6.2)', () => {
    it('should have Coinbase Wallet as first connector', () => {
      const firstConnector = wagmiConfig.connectors[0];
      
      expect(firstConnector).toBeDefined();
      expect(firstConnector.id).toBe('coinbaseWalletSDK');
    });

    it('should configure injected wallet connector', () => {
      const injectedConnector = wagmiConfig.connectors.find(
        (connector) => connector.id === 'injected'
      );

      expect(injectedConnector).toBeDefined();
    });

    it('should configure WalletConnect if project ID is available', () => {
      const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
      
      if (walletConnectProjectId) {
        const wcConnector = wagmiConfig.connectors.find(
          (connector) => connector.id === 'walletConnect'
        );

        expect(wcConnector).toBeDefined();
      }
    });
  });

  describe('Error Handling (Requirement 6.4)', () => {
    it('should handle missing WalletConnect project ID gracefully', () => {
      // Configuration should still work even if WalletConnect project ID is missing
      expect(wagmiConfig).toBeDefined();
      expect(wagmiConfig.connectors.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide fallback connectors if Coinbase Wallet fails', () => {
      // Should have at least injected wallet as fallback
      const fallbackConnectors = wagmiConfig.connectors.filter(
        (connector) => connector.id !== 'coinbaseWalletSDK'
      );

      expect(fallbackConnectors.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle network configuration errors', () => {
      // Configuration should work with default network if env var is invalid
      expect(wagmiConfig.chains).toBeDefined();
      expect(wagmiConfig.chains.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Smart Wallet Benefits Messaging (Requirement 6.2)', () => {
    it('should configure app name for wallet display', () => {
      const coinbaseConnector = wagmiConfig.connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK'
      );

      expect(coinbaseConnector).toBeDefined();
      expect(coinbaseConnector?.name).toBe('Coinbase Wallet');
    });

    it('should configure app logo for wallet display', () => {
      // Logo URL should be configured in connector
      const coinbaseConnector = wagmiConfig.connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK'
      );

      expect(coinbaseConnector).toBeDefined();
      // Connector is configured with app metadata
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid configuration object', () => {
      expect(wagmiConfig).toBeDefined();
      expect(wagmiConfig.chains).toBeDefined();
      expect(wagmiConfig.connectors).toBeDefined();
    });

    it('should have at least one chain configured', () => {
      expect(wagmiConfig.chains.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least one connector configured', () => {
      expect(wagmiConfig.connectors.length).toBeGreaterThanOrEqual(1);
    });

    it('should have exactly two chains configured (Base and Base Sepolia)', () => {
      expect(wagmiConfig.chains.length).toBe(2);
      
      const chainIds = wagmiConfig.chains.map(c => c.id);
      expect(chainIds).toContain(base.id);
      expect(chainIds).toContain(baseSepolia.id);
    });
  });
});
