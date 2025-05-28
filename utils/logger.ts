import pino from "pino";

interface LogContext {
  timestamp?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
}

interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: any;
  code?: string | number;
}

class Logger {
  private logger: pino.Logger;
  private prefix: string;
  private context: LogContext = {};
  private isBrowser: boolean;
  private isDev: boolean;

  constructor(prefix: string, isBrowser: boolean = false) {
    this.prefix = prefix;
    this.isBrowser = isBrowser;
    this.isDev = process.env.NODE_ENV === "development";

    const level = process.env.LOG_LEVEL || (this.isDev ? "debug" : "info");

    // Initialize base context
    this.context = {
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "unknown",
    };

    if (isBrowser) {
      this.logger = pino({
        name: prefix,
        level: "info",
        browser: {
          asObject: true,
          serialize: true,
        },
        // Note: pino-pretty transport disabled in SSR to avoid worker thread issues
        transport: undefined,
        formatters: {
          level: (label) => ({ level: label }),
          log: (object) => this.formatLogObject(object),
        },
        serializers: {
          err: this.serializeError.bind(this),
          error: this.serializeError.bind(this),
        },
      });
    } else {
      this.logger = pino({
        name: prefix,
        level: level,
        // Note: pino-pretty transport disabled in SSR to avoid worker thread issues
        transport: undefined,
        formatters: {
          level: (label) => ({ level: label }),
          log: (object) => this.formatLogObject(object),
        },
        serializers: {
          err: this.serializeError.bind(this),
          error: this.serializeError.bind(this),
          req: pino.stdSerializers.req,
          res: pino.stdSerializers.res,
        },
        redact: {
          paths: [
            "password",
            "token",
            "authorization",
            "cookie",
            "secret",
            "key",
            "pass",
            "auth",
            "credential",
            "session",
            "jwt",
            "*.password",
            "*.token",
            "*.secret",
            "*.key",
          ],
          censor: "[REDACTED]",
        },
      });
    }
  }

  /**
   * Set additional context that will be included in all log messages
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear specific context keys or all context
   */
  clearContext(keys?: string[]): void {
    if (keys) {
      keys.forEach((key) => delete this.context[key as keyof LogContext]);
    } else {
      this.context = {
        environment: this.context.environment,
        version: this.context.version,
      };
    }
  }

  /**
   * Enhanced error serialization with circular reference handling
   */
  private serializeError(err: any): SerializedError {
    if (!err) return err;

    if (typeof err === "string") {
      return { name: "Error", message: err };
    }

    const serialized: SerializedError = {
      name: err.name || "Error",
      message: err.message || "Unknown error",
    };

    // Safely extract stack trace
    if (err.stack) {
      serialized.stack = err.stack;
    }

    // Handle error codes
    if (err.code !== undefined) {
      serialized.code = err.code;
    }

    // Handle error causes (recursive with depth limit)
    if (err.cause && typeof err.cause === "object") {
      try {
        serialized.cause = this.serializeError(err.cause);
      } catch {
        serialized.cause = "[Circular or unserializable cause]";
      }
    }

    return serialized;
  }

  /**
   * Safe object serialization with circular reference detection
   */
  private safeSerialize(
    obj: any,
    maxDepth: number = 3,
    currentDepth: number = 0,
  ): any {
    if (currentDepth >= maxDepth) {
      return "[Max depth reached]";
    }

    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Error) {
      return this.serializeError(obj);
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (obj instanceof RegExp) {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item: any) =>
        this.safeSerialize(item, maxDepth, currentDepth + 1),
      );
    }

    const result: any = {};
    const seen = new WeakSet();

    for (const [key, value] of Object.entries(obj)) {
      try {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            result[key] = "[Circular reference]";
            continue;
          }
          seen.add(value);
        }
        result[key] = this.safeSerialize(value, maxDepth, currentDepth + 1);
      } catch {
        result[key] = "[Unserializable]";
      }
    }

    return result;
  }

  /**
   * Format log object with context and sanitization
   */
  private formatLogObject(logObj: any): any {
    const formatted = { ...logObj };

    // Add context
    if (Object.keys(this.context).length > 0) {
      formatted.context = this.context;
    }

    // Add request correlation ID if available (Next.js)
    if (typeof window === "undefined" && global.process?.env.VERCEL_URL) {
      try {
        // Try to get request ID from async local storage or headers
        const { headers } = require("next/headers");
        const reqHeaders = headers();
        const requestId =
          reqHeaders.get("x-request-id") || reqHeaders.get("x-vercel-id");
        if (requestId) {
          formatted.requestId = requestId;
        }
      } catch {
        // Ignore if not in request context
      }
    }

    // Process arguments for safe serialization
    if (formatted.args && Array.isArray(formatted.args)) {
      formatted.args = formatted.args.map((arg: any) =>
        this.safeSerialize(arg),
      );
    }

    return formatted;
  }

  /**
   * Core logging method with performance optimizations
   */
  private log(level: pino.Level, message: string, ...args: any[]) {
    // Early return if log level won't be output (performance optimization)
    if (this.logger.isLevelEnabled && !this.logger.isLevelEnabled(level)) {
      return;
    }

    try {
      // Prepare log data with lazy evaluation
      const logData: any = {};

      // Only serialize args if there are any (performance optimization)
      if (args.length > 0) {
        logData.args = args;
      }

      // Enhanced message formatting
      const formattedMessage =
        this.isBrowser && this.isDev
          ? `🔧 ${this.prefix}: ${message}`
          : `${this.prefix}: ${message}`;

      this.logger[level](logData, formattedMessage);
    } catch (error) {
      // Fallback logging to prevent logger failures from breaking the application
      if (this.isBrowser) {
        const consoleMethod =
          level === "debug" ? "log" : (level as keyof Console);
        if (typeof console[consoleMethod] === "function") {
          (console[consoleMethod] as any)(
            `[${this.prefix}] ${message}`,
            ...args,
          );
        } else {
          console.log(`[${this.prefix}] ${message}`, ...args);
        }
      } else {
        process.stderr.write(
          `Logger Error: ${error}\nOriginal: [${this.prefix}] ${message}\n`,
        );
      }
    }
  }

  /**
   * Log info level messages
   */
  info(message: string, ...args: any[]) {
    this.log("info", message, ...args);
  }

  /**
   * Log warning level messages
   */
  warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args);
  }

  /**
   * Log error level messages with enhanced error handling
   */
  error(message: string, ...args: any[]) {
    // Enhanced error logging - if first arg is an Error object, serialize it properly
    if (args.length > 0 && args[0] instanceof Error) {
      const [error, ...restArgs] = args;
      const errorData: any = { err: error };
      if (restArgs.length > 0) {
        errorData.args = restArgs;
      }

      try {
        const formattedMessage =
          this.isBrowser && this.isDev
            ? `🚨 ${this.prefix}: ${message}`
            : `${this.prefix}: ${message}`;

        this.logger.error(errorData, formattedMessage);
      } catch (logError) {
        // Fallback error logging
        if (this.isBrowser) {
          console.error(`[${this.prefix}] ${message}`, error, ...restArgs);
        } else {
          process.stderr.write(
            `[${this.prefix}] ${message}: ${error.message}\n${error.stack}\n`,
          );
        }
      }
    } else {
      this.log("error", message, ...args);
    }
  }

  /**
   * Log debug level messages
   */
  debug(message: string, ...args: any[]) {
    this.log("debug", message, ...args);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: any): Logger {
    const childLogger = new Logger(this.prefix, this.isBrowser);
    childLogger.logger = this.logger.child(bindings);
    childLogger.context = { ...this.context, ...bindings };
    return childLogger;
  }

  /**
   * Flush any pending log messages (useful for serverless environments)
   */
  async flush(): Promise<void> {
    if (this.logger.flush) {
      await new Promise<void>((resolve) => {
        this.logger.flush!((err) => {
          if (err) {
            console.error("Logger flush error:", err);
          }
          resolve();
        });
      });
    }
  }
}

export { Logger };
