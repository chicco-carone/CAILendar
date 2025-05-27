import pino from "pino";

type LogLevel = "info" | "warn" | "error" | "debug";

class FrontendLogger {
  private logger: pino.Logger;

  constructor(file: string) {
    this.logger = pino({
      name: file,
      level: "info",
      browser: {
        asObject: true,
      },
    });
  }

  info(message: string, ...args: any[]) {
    this.logger.info({ args }, message);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn({ args }, message);
  }

  error(message: string, ...args: any[]) {
    this.logger.error({ args }, message);
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug({ args }, message);
  }
}

class BackendLogger {
  private logger: pino.Logger;

  constructor(file: string) {
    const isDev = process.env.NODE_ENV === "development";
    this.logger = pino({
      name: file,
      level: isDev ? "debug" : "info",
    });
  }

  info(message: string, ...args: any[]) {
    this.logger.info({ args }, message);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn({ args }, message);
  }

  error(message: string, ...args: any[]) {
    this.logger.error({ args }, message);
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug({ args }, message);
  }
}
