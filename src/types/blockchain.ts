/**
 * Blockchain Types
 * 
 * Type definitions for blockchain integration.
 * Includes contract ABI, addresses, and on-chain data structures.
 * 
 * Requirements: 19.1, 19.2, 19.3
 */

import { Address } from 'viem';

/**
 * MemoryMatchProgress contract ABI
 * Generated from the deployed smart contract
 */
export const MEMORY_MATCH_PROGRESS_ABI = [
  {
    type: 'function',
    name: 'update',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'level', type: 'uint8' },
      { name: 'stars', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'batchUpdate',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'levels', type: 'uint8[]' },
      { name: 'stars', type: 'uint8[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getStars',
    stateMutability: 'view',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'level', type: 'uint8' },
    ],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'getTotal',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'getUpdated',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint32' }],
  },
  {
    type: 'event',
    name: 'Updated',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'level', type: 'uint8', indexed: false },
      { name: 'stars', type: 'uint8', indexed: false },
    ],
  },
] as const;

/**
 * Contract addresses by network
 */
export const CONTRACT_ADDRESSES = {
  mainnet: (import.meta.env.VITE_PROGRESS_CONTRACT_MAINNET || '0x0000000000000000000000000000000000000000') as Address,
  sepolia: (import.meta.env.VITE_PROGRESS_CONTRACT_SEPOLIA || '0x0000000000000000000000000000000000000000') as Address,
} as const;

/**
 * Get contract address for current network
 */
export function getContractAddress(): Address {
  const network = import.meta.env.VITE_NETWORK || 'sepolia';
  return network === 'mainnet' ? CONTRACT_ADDRESSES.mainnet : CONTRACT_ADDRESSES.sepolia;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Connected wallet address */
  address?: Address;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether wallet is connecting */
  isConnecting: boolean;
  /** Connection error if any */
  error?: string;
}

/**
 * On-chain progress data structure
 * Matches the contract's Progress struct
 */
export interface OnChainProgress {
  /** Total stars earned across all levels */
  total: number;
  /** Timestamp of last update */
  updated: number;
  /** Stars for each level (1-100), 0 means not completed */
  levelStars: Map<number, number>;
}

/**
 * Sync status for progress synchronization
 */
export interface SyncStatus {
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncTime?: number;
  /** Sync error if any */
  syncError?: string;
  /** Sync mode: 'blockchain' or 'local' */
  mode: 'blockchain' | 'local';
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  /** Player rank */
  rank: number;
  /** Player address */
  address: Address;
  /** Player basename (if available) */
  basename?: string;
  /** Total stars earned */
  totalStars: number;
  /** Number of levels completed */
  levelsCompleted: number;
}

/**
 * Transaction status for UI feedback
 */
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Transaction result
 */
export interface TransactionResult {
  status: TransactionStatus;
  hash?: string;
  error?: string;
}
