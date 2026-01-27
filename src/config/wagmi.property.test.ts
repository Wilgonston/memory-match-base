/**
 * Property-Based Tests for wagmi Configuration
 * 
 * Tests universal properties of network configuration and RPC endpoint mapping
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { base, baseSepolia } from 'wagmi/chains';
import { wagmiConfig } from './wagmi';

describe('wagmi Configuration Property Tests', () => {
  /**
   * Property 17: Network RPC Endpoint Mapping
   * 
   * Feature: base-ecosystem-integration
   * Validates: Requirements 10.6
   * 
   * For any network (Base Mainnet or Base Sepolia), the system should use
   * the correct RPC endpoint URL for that network.
   */
  it('should map each network to its correct RPC endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(base.id, baseSepolia.id),
        async (chainId) => {
          // Get the transport for this chain
          const transport = wagmiConfig.getClient({ chainId })?.transport;
          
          // Verify transport exists
          expect(transport).toBeDefined();
          
          // Verify the chain is configured
          const chain = wagmiConfig.chains.find(c => c.id === chainId);
          expect(chain).toBeDefined();
          
          // Verify chain has correct properties
          if (chainId === base.id) {
            expect(chain?.name).toBe('Base');
            expect(chain?.id).toBe(8453);
          } else if (chainId === baseSepolia.id) {
            expect(chain?.name).toBe('Base Sepolia');
            expect(chain?.id).toBe(84532);
          }
          
          // Verify RPC URLs are defined
          expect(chain?.rpcUrls).toBeDefined();
          expect(chain?.rpcUrls.default).toBeDefined();
          expect(chain?.rpcUrls.default.http).toBeDefined();
          expect(chain?.rpcUrls.default.http.length).toBeGreaterThan(0);
          
          // Verify RPC URL is a valid HTTP(S) URL
          const rpcUrl = chain?.rpcUrls.default.http[0];
          expect(rpcUrl).toMatch(/^https?:\/\/.+/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have distinct RPC endpoints for mainnet and testnet', () => {
    const baseChain = wagmiConfig.chains.find(c => c.id === base.id);
    const sepoliaChain = wagmiConfig.chains.find(c => c.id === baseSepolia.id);
    
    expect(baseChain).toBeDefined();
    expect(sepoliaChain).toBeDefined();
    
    const baseRpc = baseChain?.rpcUrls.default.http[0];
    const sepoliaRpc = sepoliaChain?.rpcUrls.default.http[0];
    
    // Mainnet and testnet should have different RPC endpoints
    expect(baseRpc).not.toBe(sepoliaRpc);
  });

  it('should have both networks configured in wagmi config', () => {
    const chainIds = wagmiConfig.chains.map(c => c.id);
    
    expect(chainIds).toContain(base.id);
    expect(chainIds).toContain(baseSepolia.id);
    expect(chainIds.length).toBeGreaterThanOrEqual(2);
  });

  it('should have transports configured for all chains', () => {
    wagmiConfig.chains.forEach(chain => {
      const client = wagmiConfig.getClient({ chainId: chain.id });
      expect(client).toBeDefined();
      expect(client?.transport).toBeDefined();
    });
  });
});
