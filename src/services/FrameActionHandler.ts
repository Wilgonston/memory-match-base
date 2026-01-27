/**
 * Farcaster Frame Action Handler
 * 
 * This module handles actions from Farcaster Frames, including signature validation
 * and deep linking to specific game levels.
 * 
 * Frame Actions Specification: https://docs.farcaster.xyz/reference/frames/spec#handling-clicks
 */

import { verifyMessage, getAddress, type Address, type Hex } from 'viem';
import { generateLevelFrame, type FrameMetadata, type LevelCompletionFrame } from './FrameGenerator';

/**
 * Frame action data received from Farcaster
 */
export interface FrameActionData {
  /** Farcaster ID of the user */
  fid: number;
  /** URL of the frame that was clicked */
  url: string;
  /** Message hash */
  messageHash: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Network (1 for Ethereum mainnet) */
  network: number;
  /** Button index that was clicked (1-4) */
  buttonIndex: number;
  /** Input text if frame had input field */
  inputText?: string;
  /** State data passed from previous frame */
  state?: string;
  /** Transaction ID if button action was 'tx' */
  transactionId?: string;
  /** Cryptographic signature */
  signature: Hex;
}

/**
 * Frame action handler interface
 */
export interface IFrameActionHandler {
  /**
   * Validates the frame action signature
   * @param action - Frame action data
   * @param expectedSigner - Expected signer address
   * @returns Promise resolving to true if signature is valid
   */
  validateSignature(action: FrameActionData, expectedSigner: Address): Promise<boolean>;

  /**
   * Handles a frame action and returns next frame metadata
   * @param action - Frame action data
   * @returns Promise resolving to next frame metadata
   */
  handleAction(action: FrameActionData): Promise<FrameMetadata>;

  /**
   * Extracts level number from frame URL
   * @param url - Frame URL
   * @returns Level number or null if not found
   */
  extractLevelFromUrl(url: string): number | null;

  /**
   * Generates deep link URL for a specific level
   * @param level - Level number
   * @param baseUrl - Base URL of the application
   * @returns Deep link URL
   */
  generateDeepLink(level: number, baseUrl?: string): string;
}

/**
 * Default implementation of frame action handler
 */
export class FrameActionHandler implements IFrameActionHandler {
  /** Maximum age of frame actions in milliseconds (5 minutes) */
  private static readonly MAX_ACTION_AGE = 5 * 60 * 1000;

  /** Base URL of the application */
  private readonly baseUrl: string;

  /**
   * Creates a new frame action handler
   * @param baseUrl - Base URL of the application
   */
  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  /**
   * Validates the frame action signature using ECDSA signature verification
   * 
   * @param action - Frame action data
   * @param expectedSigner - Expected signer address
   * @returns true if signature is valid, false otherwise
   */
  async validateSignature(action: FrameActionData, expectedSigner: Address): Promise<boolean> {
    try {
      // Create the message that was signed
      const message = JSON.stringify({
        fid: action.fid,
        url: action.url,
        messageHash: action.messageHash,
        timestamp: action.timestamp,
        network: action.network,
        buttonIndex: action.buttonIndex,
        inputText: action.inputText,
        state: action.state,
        transactionId: action.transactionId,
      });

      // Verify the signature
      const isValid = await verifyMessage({
        address: getAddress(expectedSigner),
        message,
        signature: action.signature,
      });

      return isValid;
    } catch (error) {
      console.error('Frame action signature validation error:', error);
      return false;
    }
  }

  /**
   * Handles a frame action and returns next frame metadata
   * 
   * This method:
   * 1. Validates the timestamp
   * 2. Extracts the level from the URL
   * 3. Generates appropriate response frame
   * 
   * @param action - Frame action data
   * @returns Next frame metadata
   * @throws Error if action is invalid or too old
   */
  async handleAction(action: FrameActionData): Promise<FrameMetadata> {
    // Validate timestamp
    const now = Date.now();
    const actionAge = now - action.timestamp * 1000; // Convert seconds to milliseconds

    if (actionAge > FrameActionHandler.MAX_ACTION_AGE) {
      throw new Error(`Frame action too old: ${actionAge}ms > ${FrameActionHandler.MAX_ACTION_AGE}ms`);
    }

    if (actionAge < 0) {
      throw new Error('Frame action timestamp is in the future');
    }

    // Extract level from URL
    const level = this.extractLevelFromUrl(action.url);

    if (level === null) {
      throw new Error('Could not extract level from frame URL');
    }

    // Validate level range
    if (level < 1 || level > 100) {
      throw new Error(`Invalid level number: ${level}`);
    }

    // Generate response frame based on button clicked
    switch (action.buttonIndex) {
      case 1:
        // "Play This Level" button - generate frame with deep link
        return this.generatePlayLevelFrame(level);
      
      default:
        throw new Error(`Unknown button index: ${action.buttonIndex}`);
    }
  }

  /**
   * Extracts level number from frame URL
   * @param url - Frame URL
   * @returns Level number or null if not found
   */
  extractLevelFromUrl(url: string): number | null {
    try {
      const urlObj = new URL(url);
      const levelParam = urlObj.searchParams.get('level');
      
      if (levelParam === null) {
        return null;
      }

      const level = parseInt(levelParam, 10);
      
      if (isNaN(level)) {
        return null;
      }

      return level;
    } catch (error) {
      console.error('Error extracting level from URL:', error);
      return null;
    }
  }

  /**
   * Generates deep link URL for a specific level
   * @param level - Level number
   * @param baseUrl - Base URL of the application
   * @returns Deep link URL
   */
  generateDeepLink(level: number, baseUrl: string = this.baseUrl): string {
    return `${baseUrl}?level=${level}`;
  }

  /**
   * Generates a frame for playing a specific level
   * @param level - Level number
   * @returns Frame metadata
   */
  private generatePlayLevelFrame(level: number): FrameMetadata {
    // Create a mock completion for frame generation
    const completion: LevelCompletionFrame = {
      level,
      stars: 0,
      moves: 0,
      timestamp: Date.now(),
    };

    // Generate frame with deep link
    const frame = generateLevelFrame(completion, this.baseUrl);

    // Update button to redirect to game
    frame.button = {
      title: `Play Level ${level}`,
      action: 'link',
      target: this.generateDeepLink(level),
    };

    return frame;
  }
}

/**
 * Creates a frame action handler instance
 * @param baseUrl - Base URL of the application
 * @returns A new frame action handler instance
 */
export function createFrameActionHandler(baseUrl?: string): IFrameActionHandler {
  return new FrameActionHandler(baseUrl);
}
