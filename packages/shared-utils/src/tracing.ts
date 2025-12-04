/**
 * Tracing utilities for OpenTelemetry-compatible instrumentation
 */

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
}

export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: { code: number; message?: string }): void;
  end(): void;
  context(): SpanContext;
}

export interface Tracer {
  startSpan(name: string, options?: { parent?: SpanContext }): Span;
  getActiveSpan(): Span | undefined;
}

class NoOpSpan implements Span {
  setAttribute(): void {}
  setStatus(): void {}
  end(): void {}
  context(): SpanContext {
    return { traceId: '', spanId: '' };
  }
}

class NoOpTracer implements Tracer {
  startSpan(): Span {
    return new NoOpSpan();
  }
  getActiveSpan(): Span | undefined {
    return undefined;
  }
}

let globalTracer: Tracer = new NoOpTracer();

/**
 * Sets the global tracer instance
 */
export function setTracer(tracer: Tracer): void {
  globalTracer = tracer;
}

/**
 * Gets the global tracer instance
 */
export function getTracer(): Tracer {
  return globalTracer;
}

/**
 * Creates a span and executes a function within it
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  parent?: SpanContext
): Promise<T> {
  const span = globalTracer.startSpan(name, { parent });
  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Synchronous version of withSpan
 */
export function withSpanSync<T>(name: string, fn: (span: Span) => T, parent?: SpanContext): T {
  const span = globalTracer.startSpan(name, { parent });
  try {
    const result = fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}

