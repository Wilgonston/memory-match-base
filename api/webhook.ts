/**
 * Webhook Endpoint for Base App Events
 * 
 * Receives and processes events from Base App:
 * - miniapp.install: User installed the Mini App
 * - miniapp.uninstall: User uninstalled the Mini App
 * - miniapp.open: User opened the Mini App
 * - frame.button: User clicked a Frame button (optional)
 * 
 * Security:
 * - Verifies HMAC-SHA256 signature from X-Farcaster-Signature header
 * - Uses timing-safe comparison to prevent timing attacks
 * - Returns 401 for invalid signatures
 * 
 * Environment Variables:
 * - WEBHOOK_SECRET: Secret key for signature verification
 */

import crypto from 'crypto';

interface WebhookEvent {
  event: 'miniapp.install' | 'miniapp.uninstall' | 'miniapp.open' | 'frame.button';
  data: {
    fid: number;
    timestamp: number;
    [key: string]: any;
  };
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    // Generate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Handle miniapp.install event
 */
async function handleInstall(event: WebhookEvent): Promise<void> {
  const { fid, timestamp } = event.data;
  
  console.log(`[Install] User ${fid} installed the app at ${new Date(timestamp * 1000).toISOString()}`);
  
  // Track installation metrics
  // TODO: Add analytics tracking
  // analytics.track('miniapp_install', { fid, timestamp });
  
  // Optional: Send welcome notification
  // TODO: Implement notification system
  // await sendWelcomeNotification(fid);
}

/**
 * Handle miniapp.uninstall event
 */
async function handleUninstall(event: WebhookEvent): Promise<void> {
  const { fid, timestamp } = event.data;
  
  console.log(`[Uninstall] User ${fid} uninstalled the app at ${new Date(timestamp * 1000).toISOString()}`);
  
  // Track churn metrics
  // TODO: Add analytics tracking
  // analytics.track('miniapp_uninstall', { fid, timestamp });
  
  // Optional: Cleanup user data
  // TODO: Implement data cleanup if needed
  // await cleanupUserData(fid);
}

/**
 * Handle miniapp.open event
 */
async function handleOpen(event: WebhookEvent): Promise<void> {
  const { fid, timestamp } = event.data;
  
  console.log(`[Open] User ${fid} opened the app at ${new Date(timestamp * 1000).toISOString()}`);
  
  // Track engagement metrics
  // TODO: Add analytics tracking
  // analytics.track('miniapp_open', { fid, timestamp });
  
  // Optional: Update last active timestamp
  // TODO: Implement user activity tracking
  // await updateLastActive(fid, timestamp);
}

/**
 * Handle frame.button event
 */
async function handleFrameButton(event: WebhookEvent): Promise<void> {
  const { fid, timestamp, buttonIndex, ...rest } = event.data;
  
  console.log(`[Frame] User ${fid} clicked button ${buttonIndex} at ${new Date(timestamp * 1000).toISOString()}`);
  
  // Track Frame interactions
  // TODO: Add analytics tracking
  // analytics.track('frame_button_click', { fid, buttonIndex, timestamp });
  
  // Optional: Handle specific button actions
  // TODO: Implement Frame action handlers
  // await handleFrameAction(fid, buttonIndex, rest);
}

/**
 * Route event to appropriate handler
 */
async function handleEvent(event: WebhookEvent): Promise<void> {
  switch (event.event) {
    case 'miniapp.install':
      await handleInstall(event);
      break;
    
    case 'miniapp.uninstall':
      await handleUninstall(event);
      break;
    
    case 'miniapp.open':
      await handleOpen(event);
      break;
    
    case 'frame.button':
      await handleFrameButton(event);
      break;
    
    default:
      console.warn(`Unknown event type: ${(event as any).event}`);
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract signature from header
    const signature = req.headers['x-farcaster-signature'];
    
    if (!signature) {
      console.error('Missing X-Farcaster-Signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Get webhook secret from environment
    const secret = process.env.WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get request body as string
    const body = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);

    // Verify signature
    const isValid = verifySignature(body, signature, secret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event: WebhookEvent = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    // Validate event structure
    if (!event.event || !event.data || !event.data.fid || !event.data.timestamp) {
      console.error('Invalid event structure:', event);
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Handle event
    await handleEvent(event);

    // Return success
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

