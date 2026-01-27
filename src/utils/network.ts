import { base, baseSepolia } from 'wagmi/chains';

export type NetworkType = 'mainnet' | 'sepolia';

export function getNetwork(): NetworkType {
  return (import.meta.env.VITE_NETWORK || 'sepolia') as NetworkType;
}

export function isMainnet(): boolean {
  return getNetwork() === 'mainnet';
}

export function getChain() {
  return isMainnet() ? base : baseSepolia;
}

export function getChainId(): number {
  return isMainnet() ? 8453 : 84532;
}
