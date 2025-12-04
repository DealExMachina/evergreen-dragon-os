import { getLogger } from './logger';
import { withRetry, type RetryOptions } from './retry';
import { withErrorHandling } from './error-handling';

/**
 * HTTP client options
 */
export interface HttpClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retry?: RetryOptions;
}

/**
 * Request options
 */
export interface RequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
}

/**
 * HTTP client with retry, error handling, and logging
 */
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retryOptions?: RetryOptions;
  private logger = getLogger();

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = options.defaultHeaders || {};
    this.timeout = options.timeout || 30000;
    this.retryOptions = options.retry;
  }

  /**
   * Makes an HTTP request
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.headers);
    const body = options.body ? JSON.stringify(options.body) : undefined;

    const operation = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }

        return await response.text() as unknown as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
    };

    if (this.retryOptions) {
      return withRetry(operation, this.retryOptions);
    }

    return withErrorHandling(operation, {
      operation: `HTTP ${options.method || 'GET'} ${options.path}`,
      url,
    });
  }

  /**
   * GET request
   */
  async get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return this.request<T>({ ...options, method: 'GET', path });
  }

  /**
   * POST request
   */
  async post<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return this.request<T>({ ...options, method: 'POST', path });
  }

  /**
   * PUT request
   */
  async put<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return this.request<T>({ ...options, method: 'PUT', path });
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return this.request<T>({ ...options, method: 'PATCH', path });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return this.request<T>({ ...options, method: 'DELETE', path });
  }

  /**
   * Builds full URL with query parameters
   */
  private buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}/${path.replace(/^\//, '')}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Builds headers merging defaults with request-specific headers
   */
  private buildHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...requestHeaders,
    };
  }
}

