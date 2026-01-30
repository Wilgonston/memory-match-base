/**
 * Hooks module exports
 * 
 * This module provides centralized exports for all custom hooks
 * used throughout the Memory Match BASE application.
 */

export { useGameState } from './useGameState';
export type { UseGameStateReturn } from './useGameState';

export { useProgress } from './useProgress';
export type { UseProgressReturn } from './useProgress';

export { useTimer } from './useTimer';
export type { UseTimerReturn, UseTimerOptions } from './useTimer';

export { useBasename, truncateAddress, clearBasenameCache } from './useBasename';
export type { UseBasenameResult } from './useBasename';

export { usePlayerProgress, useLevelStars } from './usePlayerProgress';
export type { UsePlayerProgressResult } from './usePlayerProgress';

export { useUpdateLevel } from './useUpdateLevel';
export type { UseUpdateLevelResult } from './useUpdateLevel';

export { useSyncManager } from './useSyncManager';
export type { UseSyncManagerResult } from './useSyncManager';

export { useBatchTransactions } from './useBatchTransactions';

export { usePaymasterTransaction } from './usePaymasterTransaction';
export type { UsePaymasterTransactionResult, UsePaymasterTransactionOptions } from './usePaymasterTransaction';

export { useSequentialUpdateLevels } from './useSequentialUpdateLevels';
export type { UseSequentialUpdateLevelsResult } from './useSequentialUpdateLevels';

export { useLoadBlockchainProgress } from './useLoadBlockchainProgress';
export type { UseLoadBlockchainProgressResult } from './useLoadBlockchainProgress';

