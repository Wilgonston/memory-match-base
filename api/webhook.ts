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
 * - Rate limiting: 10 requests per minute per FID
 * - Returns 401 for invalid signatures
 * - Returns 429 for rate limit exceeded
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
 * Simple in-memory rate limiter
 */
class WebhookRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxRequests = 10;
  private windowMs = 60000; // 1 minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxRequests) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const recent = attempts.filter(time => now - time < this.windowMs);
      if (recent.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recent);
      }
    }
  }
}

const rateLimiter = new WebhookRateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

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
}

/**
 * Handle miniapp.uninstall event
 */
async function handleUninstall(event: WebhookEvent): Promise<void> {
  const { fid, timestamp } = event.data;
  
  console.log(`[Uninstall] User ${fid} uninstalled the app at ${new Date(timestamp * 1000).toISOString()}`);
}

/**
 * Handle miniapp.open event
 */
async function handleOpen(event: WebhookEvent): Promise<void> {
  const { fid, timestamp } = event.data;
  
  console.log(`[Open] User ${fid} opened the app at ${new Date(timestamp * 1000).toISOString()}`);
}

/**
 * Handle frame.button event
 */
async function handleFrameButton(event: WebhookEvent): Promise<void> {
  const { fid, timestamp, buttonIndex } = event.data;
  
  console.log(`[Frame] User ${fid} clicked button ${buttonIndex} at ${new Date(timestamp * 1000).toISOString()}`);
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
    // Parse event first to get FID for rate limiting
    const body = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);
    
    const event: WebhookEvent = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    // Validate event structure
    if (!event.event || !event.data || !event.data.fid || !event.data.timestamp) {
      console.error('Invalid event structure:', event);
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Rate limiting check
    const identifier = `fid:${event.data.fid}`;
    if (!rateLimiter.isAllowed(identifier)) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

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

    // Verify signature
    const isValid = verifySignature(body, signature, secret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
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

