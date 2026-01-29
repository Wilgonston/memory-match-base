/**
 * Tests for Fetch Retry Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry, fetchJSON, setupGlobalFetchRetry } from './fetchRetry';

describe('fetchWithRetry', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const response = await fetchWithRetry('https://api.example.com/data');
    
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on network failure', async () => {
    const mockError = new Error('Failed to fetch');
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
    });

    global.fetch = vi.fn()
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockResponse);

    const response = await fetchWithRetry('https://api.example.com/data', undefined, {
      maxRetries: 3,
      retryDelay: 10,
    });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should suppress analytics errors', async () => {
    const mockError = new Error('Failed to fetch');

    global.fetch = vi.fn().mockRejectedValue(mockError);

    const response = await fetchWithRetry('https://analytics.coinbase.com/track', undefined, {
      maxRetries: 2,
      retryDelay: 10,
      suppressAnalyticsErrors: true,
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });

  it('should throw after max retries for non-analytics', async () => {
    const mockError = new Error('Failed to fetch');

    global.fetch = vi.fn().mockRejectedValue(mockError);

    await expect(
      fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 2,
        retryDelay: 10,
        suppressAnalyticsErrors: false,
      })
    ).rejects.toThrow('Fetch failed after 2 attempts');

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 4xx client errors', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
    });

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const response = await fetchWithRetry('https://api.example.com/data', undefined, {
      maxRetries: 3,
      retryDelay: 10,
    });

    expect(response.status).toBe(404);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const mockError = new Error('Failed to fetch');
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
    });

    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;
    
    global.setTimeout = ((callback: () => void, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(callback, 0);
    }) as typeof setTimeout;

    global.fetch = vi.fn()
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockResponse);

    await fetchWithRetry('https://api.example.com/data', undefined, {
      maxRetries: 3,
      retryDelay: 100,
      exponentialBackoff: true,
    });

    global.setTimeout = originalSetTimeout;

    // Should have exponential delays: 100, 200
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200);
  });
});

describe('fetchJSON', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should parse JSON response', async () => {
    const mockData = { result: 'success', value: 42 };
    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const data = await fetchJSON<typeof mockData>('https://api.example.com/data');

    expect(data).toEqual(mockData);
  });

  it('should throw on non-ok response', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      statusText: 'Internal Server Error',
    });

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(
      fetchJSON('https://api.example.com/data')
    ).rejects.toThrow('HTTP 500: Internal Server Error');
  });
});

describe('setupGlobalFetchRetry', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should override global fetch', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    setupGlobalFetchRetry();

    expect(global.fetch).not.toBe(originalFetch);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchRetry] Global fetch interceptor installed with retry logic'
    );

    consoleSpy.mockRestore();
  });
});
