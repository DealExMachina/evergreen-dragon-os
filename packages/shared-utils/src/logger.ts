import type { Config } from '@evergreen/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
}

class ConsoleLogger implements Logger {
  constructor(private level: LogLevel) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext: LogContext = { ...context };
      if (error instanceof Error) {
        errorContext.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error) {
        errorContext.error = error;
      }
      console.error(this.formatMessage('error', message, errorContext));
    }
  }
}

class LangfuseLogger implements Logger {
  private langfuseClient: any;

  constructor(private level: LogLevel, langfuseConfig: { baseUrl?: string; secretKey: string }) {
    try {
      // Dynamic import to avoid requiring langfuse in all environments
      const { Langfuse } = require('langfuse');
      this.langfuseClient = new Langfuse({
        secretKey: langfuseConfig.secretKey,
        publicKey: langfuseConfig.secretKey, // Fallback if no public key
        baseUrl: langfuseConfig.baseUrl,
      });
    } catch {
      // Langfuse not available, fall back to console
      this.langfuseClient = null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      if (this.langfuseClient) {
        this.langfuseClient.debug(message, context);
      } else {
        console.debug(`[DEBUG] ${message}`, context);
      }
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      if (this.langfuseClient) {
        this.langfuseClient.info(message, context);
      } else {
        console.info(`[INFO] ${message}`, context);
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      if (this.langfuseClient) {
        this.langfuseClient.warn(message, context);
      } else {
        console.warn(`[WARN] ${message}`, context);
      }
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext: LogContext = { ...context };
      if (error instanceof Error) {
        errorContext.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error) {
        errorContext.error = error;
      }

      if (this.langfuseClient) {
        this.langfuseClient.error(message, errorContext);
      } else {
        console.error(`[ERROR] ${message}`, errorContext);
      }
    }
  }
}

let globalLogger: Logger | null = null;

/**
 * Creates a logger instance based on configuration
 */
export function createLogger(config: Config): Logger {
  if (config.langfuse?.secretKey) {
    return new LangfuseLogger(config.logLevel, {
      baseUrl: config.langfuse.baseUrl,
      secretKey: config.langfuse.secretKey,
    });
  }
  return new ConsoleLogger(config.logLevel);
}

/**
 * Gets or creates the global logger
 */
export function getLogger(config?: Config): Logger {
  if (!globalLogger && config) {
    globalLogger = createLogger(config);
  }
  if (!globalLogger) {
    // Fallback to console logger with info level
    globalLogger = new ConsoleLogger('info');
  }
  return globalLogger;
}

/**
 * Sets the global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

