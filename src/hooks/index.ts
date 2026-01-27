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

export { useBatchUpdateLevels } from './useBatchUpdateLevels';
export type { UseBatchUpdateLevelsResult } from './useBatchUpdateLevels';

export { useSyncManager } from './useSyncManager';
export type { UseSyncManagerResult } from './useSyncManager';

export { useSpendPermissions } from './useSpendPermissions';
export type { UseSpendPermissionsReturn } from './useSpendPermissions';

export { useMagicSpend } from './useMagicSpend';

export { useBatchTransactions } from './useBatchTransactions';
