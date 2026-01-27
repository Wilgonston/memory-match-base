import { base, baseSepolia } from 'wagmi/chains';

// Get environment variables
const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine the chain based on network configuration
export const defaultChain = network === 'mainnet' ? base : baseSepolia;

// Build Paymaster URL from API key following ERC-7677 standard
// Format: https://api.developer.coinbase.com/rpc/v1/base/{API_KEY}
const paymasterUrl = apiKey && network === 'mainnet'
  ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
  : undefined;

// OnchainKit configuration with Paymaster and Smart Wallet support
export const onchainKitConfig = {
  apiKey,
  chain: defaultChain,
  config: {
    appearance: {
      mode: 'auto' as const,
      theme: 'base' as const,
      name: 'Memory Match BASE',
      logo: 'https://memory-match-base.vercel.app/assets/miniapp/icon-512-improved.svg',
    },
    wallet: {
      display: 'modal' as const,
    },
    paymaster: paymasterUrl,
  },
};

// Export chain for use in components
export { base, baseSepolia };
