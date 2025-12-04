import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '../src/http-client';
import { mockFetch, mockFetchError, resetAllMocks } from '@tests/mocks';

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    resetAllMocks();
    client = new HttpClient({
      baseUrl: 'https://api.example.com',
      defaultHeaders: {
        'X-Custom-Header': 'test-value',
      },
    });
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const response = { data: 'test' };
      mockFetch(response);

      const result = await client.get<typeof response>('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(response);
    });

    it('should include query parameters', async () => {
      const response = { data: 'test' };
      mockFetch(response);

      await client.get('/test', {
        query: { page: 1, limit: 10 },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test?page=1&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const response = { id: '123' };
      mockFetch(response);

      const body = { name: 'test' };
      const result = await client.post<typeof response>('/test', { body });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(response);
    });
  });

  describe('Error handling', () => {
    it('should throw error on HTTP error status', async () => {
      mockFetch({ error: 'Not found' }, 404);

      await expect(client.get('/test')).rejects.toThrow('HTTP 404');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockFetchError(error);

      await expect(client.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      client = new HttpClient({
        baseUrl: 'https://api.example.com',
        timeout: 100,
      });

      global.fetch = vi.fn((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (options?.signal?.aborted) {
              const error = new Error('Request timeout after 100ms');
              error.name = 'AbortError';
              reject(error);
            } else {
              resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve('{}'),
                headers: new Headers({ 'content-type': 'application/json' }),
              } as Response);
            }
          }, 200);
          
          // Handle abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              const error = new Error('Request timeout after 100ms');
              error.name = 'AbortError';
              reject(error);
            });
          }
        });
      });

      await expect(client.get('/test')).rejects.toThrow('timeout');
    });
  });

  describe('URL building', () => {
    it('should handle absolute URLs', async () => {
      const response = { data: 'test' };
      mockFetch(response);

      await client.get('https://other.com/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://other.com/test',
        expect.any(Object)
      );
    });

    it('should remove trailing slash from baseUrl', async () => {
      client = new HttpClient({
        baseUrl: 'https://api.example.com/',
      });
      const response = { data: 'test' };
      mockFetch(response);

      await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      );
    });
  });

  describe('Headers', () => {
    it('should merge default and request headers', async () => {
      const response = { data: 'test' };
      mockFetch(response);

      await client.get('/test', {
        headers: {
          'X-Request-ID': 'req-123',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
            'X-Request-ID': 'req-123',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});

