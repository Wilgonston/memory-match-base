/**
 * Services Index
 * 
 * Exports all service classes and utilities for the application.
 */

export {
  type GasPolicy,
  memoryMatchGasPolicy,
  MEMORY_MATCH_CONTRACTS,
  createGasPolicy,
  validateGasPolicy,
} from '../config/gas-policy';

export {
  WebhookHandler,
  createWebhookHandler,
  type WebhookEvent,
  type IWebhookHandler,
} from './WebhookHandler';

export {
  FrameImageGenerator,
  generateLevelFrame,
  generateFrameMetaTags,
  addFrameMetaToHead,
  removeFrameMetaFromHead,
  generateShareUrl,
  type FrameMetadata,
  type LevelCompletionFrame,
} from './FrameGenerator';

export {
  FrameActionHandler,
  createFrameActionHandler,
  type FrameActionData,
  type IFrameActionHandler,
} from './FrameActionHandler';

export {
  BatchTransactionService,
  batchTransactionService,
  type Operation,
  type BatchPreview,
} from './BatchTransactionService';

export {
  ETHService,
  ethService,
  ETH_DECIMALS,
  type TransferResult,
} from './ETHService';

