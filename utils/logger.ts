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

    const level =
      process.env.PINO_LOG_LEVEL ||
      process.env.LOG_LEVEL ||
      (this.isDev ? "debug" : "info");

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
        timestamp: pino.stdTimeFunctions.isoTime,
      });
    }
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

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

  private serializeError(err: any): SerializedError {
    if (!err) return err;
    if (typeof err === "string") {
      return { name: "Error", message: err };
    }
    const serialized: SerializedError = {
      name: err.name || "Error",
      message: err.message || "Unknown error",
    };
    if (err.stack) {
      serialized.stack = err.stack;
    }
    if (err.code !== undefined) {
      serialized.code = err.code;
    }
    if (err.cause && typeof err.cause === "object") {
      try {
        serialized.cause = this.serializeError(err.cause);
      } catch {
        serialized.cause = "[Circular or unserializable cause]";
      }
    }
    return serialized;
  }

  private safeSerialize(
    obj: any,
    maxDepth: number = 3,
    currentDepth: number = 0,
    seen: WeakSet<any> = new WeakSet()
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
        this.safeSerialize(item, maxDepth, currentDepth + 1, seen)
      );
    }
    if (seen.has(obj)) {
      return "[Circular reference]";
    }
    seen.add(obj);
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = this.safeSerialize(
          value,
          maxDepth,
          currentDepth + 1,
          seen
        );
      } catch {
        result[key] = "[Unserializable]";
      }
    }
    return result;
  }

  private formatLogObject(logObj: any): any {
    const formatted = { ...logObj };
    if (Object.keys(this.context).length > 0) {
      formatted.context = this.context;
    }
    if (typeof window === "undefined" && global.process?.env.VERCEL_URL) {
      try {
        const { headers } = require("next/headers");
        const reqHeaders = headers();
        const requestId =
          reqHeaders.get("x-request-id") || reqHeaders.get("x-vercel-id");
        if (requestId) {
          formatted.requestId = requestId;
        }
      } catch {}
    }
    if (formatted.args && Array.isArray(formatted.args)) {
      formatted.args = formatted.args.map((arg: any) =>
        this.safeSerialize(arg)
      );
    }
    return formatted;
  }

  private log(level: pino.Level, message: string, ...args: any[]) {
    if (
      typeof this.logger.isLevelEnabled === "function" &&
      !this.logger.isLevelEnabled(level)
    ) {
      return;
    }
    try {
      const logData: any = {};
      if (args.length > 0) {
        logData.args = args;
      }
      const formattedMessage =
        this.isBrowser && this.isDev
          ? `🔧 ${this.prefix}: ${message}`
          : `${this.prefix}: ${message}`;
      this.logger[level](logData, formattedMessage);
    } catch (error) {
      if (this.isBrowser) {
        const consoleMethod =
          level === "debug" ? "log" : (level as keyof Console);
        if (typeof console[consoleMethod] === "function") {
          (console[consoleMethod] as any)(
            `[${this.prefix}] ${message}`,
            ...args
          );
        } else {
          console.log(`[${this.prefix}] ${message}`, ...args);
        }
      } else {
        process.stderr.write(
          `Logger Error: ${error}\nOriginal: [${this.prefix}] ${message}\n`
        );
      }
    }
  }

  info(message: string, ...args: any[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]) {
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
        if (this.isBrowser) {
          console.error(`[${this.prefix}] ${message}`, error, ...restArgs);
        } else {
          process.stderr.write(
            `[${this.prefix}] ${message}: ${error.message}\n${error.stack}\n`
          );
        }
      }
    } else {
      this.log("error", message, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log("debug", message, ...args);
  }

  child(bindings: any): Logger {
    const childLogger = new Logger(this.prefix, this.isBrowser);
    childLogger.logger = this.logger.child(bindings);
    childLogger.context = { ...this.context, ...bindings };
    return childLogger;
  }

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
