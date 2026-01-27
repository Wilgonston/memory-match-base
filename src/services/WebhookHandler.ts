/**
 * Webhook Handler for Farcaster Mini App Events
 * 
 * This module handles webhook events from Farcaster when users interact with the Mini App.
 * It validates webhook signatures using HMAC and processes different event types.
 * 
 * Event Types:
 * - install: User installs the Mini App
 * - uninstall: User uninstalls the Mini App
 * - notification: Custom notification events
 * 
 * Security:
 * - All webhook events must have valid signatures
 * - Timestamps are validated to prevent replay attacks
 * - Events older than 5 minutes are rejected
 */

import { verifyMessage, getAddress, type Address, type Hex } from 'viem';

/**
 * Webhook event structure received from Farcaster
 */
export interface WebhookEvent {
  /** Event type */
  type: 'install' | 'uninstall' | 'notification';
  /** Unix timestamp in milliseconds when event occurred */
  timestamp: number;
  /** User ID (Farcaster FID as string) */
  userId: string;
  /** Event-specific data */
  data: Record<string, unknown>;
  /** Cryptographic signature for verification */
  signature: string;
}

/**
 * Webhook handler interface for processing Mini App events
 */
export interface IWebhookHandler {
  /**
   * Validates the webhook signature to ensure authenticity
   * @param event - The webhook event to validate
   * @param secret - The webhook secret for signature verification
   * @returns Promise resolving to true if signature is valid, false otherwise
   */
  validateSignature(event: WebhookEvent, secret: string): Promise<boolean>;

  /**
   * Handles a webhook event after validation
   * @param event - The webhook event to handle
   * @throws Error if signature is invalid or event is too old
   */
  handleEvent(event: WebhookEvent): Promise<void>;
}

/**
 * Default implementation of the webhook handler
 */
export class WebhookHandler implements IWebhookHandler {
  /** Maximum age of webhook events in milliseconds (5 minutes) */
  private static readonly MAX_EVENT_AGE = 5 * 60 * 1000;

  /** Webhook secret for signature verification */
  private readonly secret: string;

  /**
   * Creates a new webhook handler
   * @param secret - The webhook secret for signature verification
   */
  constructor(secret: string) {
    if (!secret) {
      throw new Error('Webhook secret is required');
    }
    this.secret = secret;
  }

  /**
   * Validates the webhook signature using ECDSA signature verification
   * 
   * The signature is created by signing a JSON message containing:
   * - type: Event type
   * - timestamp: Event timestamp
   * - userId: User ID
   * - data: Event data
   * 
   * @param event - The webhook event to validate
   * @param secret - The webhook secret (expected signer address)
   * @returns true if signature is valid, false otherwise
   */
  async validateSignature(event: WebhookEvent, secret: string): Promise<boolean> {
    try {
      // Create the message that was signed
      const message = JSON.stringify({
        type: event.type,
        timestamp: event.timestamp,
        userId: event.userId,
        data: event.data,
      });

      // Verify the signature and recover the signer address
      const isValid = await verifyMessage({
        address: getAddress(secret as Address),
        message,
        signature: event.signature as Hex,
      });

      return isValid;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Handles a webhook event after validation
   * 
   * This method:
   * 1. Validates the signature
   * 2. Checks the timestamp to prevent replay attacks
   * 3. Routes the event to the appropriate handler
   * 
   * @param event - The webhook event to handle
   * @throws Error if signature is invalid or event is too old
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    // Validate signature first
    if (!(await this.validateSignature(event, this.secret))) {
      throw new Error('Invalid webhook signature');
    }

    // Check timestamp to prevent replay attacks
    const now = Date.now();
    const eventAge = now - event.timestamp;

    if (eventAge > WebhookHandler.MAX_EVENT_AGE) {
      throw new Error(`Webhook event too old: ${eventAge}ms > ${WebhookHandler.MAX_EVENT_AGE}ms`);
    }

    if (eventAge < 0) {
      throw new Error('Webhook event timestamp is in the future');
    }

    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'install':
        await this.handleInstall(event);
        break;
      case 'uninstall':
        await this.handleUninstall(event);
        break;
      case 'notification':
        await this.handleNotification(event);
        break;
      default:
        console.warn('Unknown webhook event type:', (event as any).type);
    }
  }

  /**
   * Handles install events when a user installs the Mini App
   * @param event - The install event
   */
  private async handleInstall(event: WebhookEvent): Promise<void> {
    console.log('User installed Mini App:', {
      userId: event.userId,
      fid: event.data.fid,
      username: event.data.username,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // Track installation in analytics
    // Send welcome notification
    // Initialize user data
    
    // Example: Store in database
    // await db.users.create({
    //   fid: event.data.fid as number,
    //   username: event.data.username as string,
    //   installedAt: new Date(event.timestamp),
    // });
  }

  /**
   * Handles uninstall events when a user uninstalls the Mini App
   * @param event - The uninstall event
   */
  private async handleUninstall(event: WebhookEvent): Promise<void> {
    console.log('User uninstalled Mini App:', {
      userId: event.userId,
      fid: event.data.fid,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // Track uninstallation in analytics
    // Clean up user data if needed
    // Send feedback survey
    
    // Example: Update database
    // await db.users.update({
    //   where: { fid: event.data.fid as number },
    //   data: { uninstalledAt: new Date(event.timestamp) },
    // });
  }

  /**
   * Handles notification events for custom Mini App notifications
   * @param event - The notification event
   */
  private async handleNotification(event: WebhookEvent): Promise<void> {
    console.log('Notification event:', {
      userId: event.userId,
      notificationType: event.data.notificationType,
      data: event.data,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // Handle custom notification events
    const notificationType = event.data.notificationType as string;

    switch (notificationType) {
      case 'level_complete':
        // Track level completion
        // Update leaderboard
        // Send congratulations
        console.log('Level completed:', {
          level: event.data.level,
          stars: event.data.stars,
        });
        break;
      case 'achievement_unlocked':
        // Track achievement
        // Send notification to Farcaster
        console.log('Achievement unlocked:', event.data);
        break;
      default:
        console.warn('Unknown notification type:', notificationType);
    }
  }
}

/**
 * Creates a webhook handler instance
 * @param secret - The webhook secret for signature verification
 * @returns A new webhook handler instance
 */
export function createWebhookHandler(secret: string): IWebhookHandler {
  return new WebhookHandler(secret);
}
