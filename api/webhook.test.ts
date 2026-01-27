import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import handler from './webhook';

describe('Webhook Handler', () => {
  const mockSecret = 'test-webhook-secret-12345';
  
  beforeEach(() => {
    process.env.WEBHOOK_SECRET = mockSecret;
    vi.clearAllMocks();
  });

  function generateSignature(body: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    return hmac.digest('hex');
  }

  function createMockRequest(event: any, signature?: string) {
    const body = JSON.stringify(event);
    const sig = signature || generateSignature(body, mockSecret);

    return {
      method: 'POST',
      headers: {
        'x-farcaster-signature': sig,
      },
      body,
    };
  }

  function createMockResponse() {
    const res: any = {
      statusCode: 200,
      body: null,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res;
  }

  describe('Method validation', () => {
    it('rejects non-POST requests', async () => {
      const req = { method: 'GET', headers: {}, body: '' };
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });

  describe('Signature validation', () => {
    it('rejects requests without signature', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ event: 'miniapp.open', data: { fid: 123, timestamp: 1234567890 } }),
      };
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature' });
    });

    it('rejects requests with invalid signature', async () => {
      const event = { event: 'miniapp.open', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event, 'invalid-signature');
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('accepts requests with valid signature', async () => {
      const event = { event: 'miniapp.open', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Event validation', () => {
    it('rejects events without event field', async () => {
      const event = { data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event structure' });
    });

    it('rejects events without data field', async () => {
      const event = { event: 'miniapp.open' };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event structure' });
    });

    it('rejects events without fid', async () => {
      const event = { event: 'miniapp.open', data: { timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event structure' });
    });

    it('rejects events without timestamp', async () => {
      const event = { event: 'miniapp.open', data: { fid: 123 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event structure' });
    });
  });

  describe('Event handling', () => {
    it('handles miniapp.install event', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const event = { event: 'miniapp.install', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Install]'));
    });

    it('handles miniapp.uninstall event', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const event = { event: 'miniapp.uninstall', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Uninstall]'));
    });

    it('handles miniapp.open event', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const event = { event: 'miniapp.open', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Open]'));
    });

    it('handles frame.button event', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const event = { 
        event: 'frame.button', 
        data: { fid: 123, timestamp: 1234567890, buttonIndex: 1 } 
      };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Frame]'));
    });

    it('warns about unknown event types', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const event = { event: 'unknown.event', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown event type'));
    });
  });

  describe('Error handling', () => {
    it('returns 500 when WEBHOOK_SECRET not configured', async () => {
      delete process.env.WEBHOOK_SECRET;
      const event = { event: 'miniapp.open', data: { fid: 123, timestamp: 1234567890 } };
      const req = createMockRequest(event);
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    });

    it('handles JSON parse errors', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-farcaster-signature': 'test',
        },
        body: 'invalid json',
      };
      const res = createMockResponse();

      await handler(req, res);

      // Invalid JSON will fail signature verification first
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });
  });
});
