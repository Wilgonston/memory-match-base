import { base, baseSepolia } from 'wagmi/chains';

// Get environment variables
const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine the chain based on network configuration
export const defaultChain = network === 'mainnet' ? base : baseSepolia;

// Build Paymaster URL from API key
// Format: https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
const paymasterUrl = apiKey 
  ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
  : '';

// OnchainKit configuration with Paymaster
export const onchainKitConfig = {
  apiKey,
  chain: defaultChain,
  config: {
    appearance: {
      mode: 'auto' as const, // 'auto', 'light', or 'dark'
      theme: 'base' as const, // Use BASE theme
      name: 'Memory Match BASE',
      logo: `${window.location.origin}/icon-512.png`,
    },
    // Paymaster configuration for gas-free transactions
    paymaster: paymasterUrl ? {
      url: paymasterUrl,
    } : undefined,
  },
};

// Export chain for use in components
export { base, baseSepolia };
