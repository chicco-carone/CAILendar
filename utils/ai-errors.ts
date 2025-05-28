// Error types for AI route
export enum AIErrorCode {
  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_IMAGE_FORMAT = "INVALID_IMAGE_FORMAT",
  INVALID_TEXT_CONTENT = "INVALID_TEXT_CONTENT",
  IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE",
  TEXT_TOO_LONG = "TEXT_TOO_LONG",

  // AI processing errors
  AI_MODEL_ERROR = "AI_MODEL_ERROR",
  AI_RESPONSE_INVALID = "AI_RESPONSE_INVALID",
  AI_PARSING_ERROR = "AI_PARSING_ERROR",
  AI_TIMEOUT = "AI_TIMEOUT",

  // Calendar context errors
  CALENDAR_READ_ERROR = "CALENDAR_READ_ERROR",
  CALENDAR_CONTEXT_ERROR = "CALENDAR_CONTEXT_ERROR",

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

export interface AIErrorDetails {
  code: AIErrorCode;
  message: string;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  context?: Record<string, unknown>;
}

export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(details: AIErrorDetails) {
    super(details.message);
    this.name = "AIError";
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.statusCode = details.statusCode;
    this.retryable = details.retryable;
    this.context = details.context;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        retryable: this.retryable,
        context: this.context,
      },
    };
  }
}

export class AIValidationError extends AIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: AIErrorCode.INVALID_INPUT,
      message: `Validation failed: ${message}`,
      userMessage: `Invalid input: ${message}`,
      statusCode: 400,
      retryable: false,
      context,
    });
  }
}

export class AIProcessingError extends AIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: AIErrorCode.AI_MODEL_ERROR,
      message: `AI processing failed: ${message}`,
      userMessage: "Failed to process your request with AI. Please try again.",
      statusCode: 500,
      retryable: true,
      context,
    });
  }
}

export class CalendarContextError extends AIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: AIErrorCode.CALENDAR_CONTEXT_ERROR,
      message: `Calendar context error: ${message}`,
      userMessage:
        "Failed to read calendar context. Using AI without existing events.",
      statusCode: 500,
      retryable: true,
      context,
    });
  }
}

export class RateLimitError extends AIError {
  constructor(retryAfter?: number) {
    super({
      code: AIErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Rate limit exceeded",
      userMessage: "Too many requests. Please wait before trying again.",
      statusCode: 429,
      retryable: true,
      context: { retryAfter },
    });
  }
}

export class ImageProcessingError extends AIError {
  constructor(reason: string, context?: Record<string, unknown>) {
    super({
      code: AIErrorCode.INVALID_IMAGE_FORMAT,
      message: `Image processing failed: ${reason}`,
      userMessage: `Image processing failed: ${reason}`,
      statusCode: 400,
      retryable: false,
      context,
    });
  }
}

// Error factory functions
export function createValidationError(
  field: string,
  issue: string,
): AIValidationError {
  return new AIValidationError(`${field}: ${issue}`, { field, issue });
}

export function createImageError(
  issue: string,
  imageSize?: number,
): ImageProcessingError {
  return new ImageProcessingError(issue, { imageSize });
}

export function createAIError(originalError: unknown): AIProcessingError {
  const message =
    originalError instanceof Error ? originalError.message : "Unknown AI error";
  return new AIProcessingError(message, {
    originalError: String(originalError),
  });
}

export function createCalendarError(
  operation: string,
  originalError: unknown,
): CalendarContextError {
  const message =
    originalError instanceof Error
      ? originalError.message
      : "Unknown calendar error";
  return new CalendarContextError(`${operation}: ${message}`, {
    operation,
    originalError: String(originalError),
  });
}

// Error mapping for Zod validation errors
export function mapZodError(error: any): AIValidationError {
  if (error.issues && Array.isArray(error.issues)) {
    const firstIssue = error.issues[0];
    const field = firstIssue.path?.join(".") || "unknown";
    const message = firstIssue.message || "Validation failed";

    return createValidationError(field, message);
  }

  return new AIValidationError(error.message || "Invalid input format");
}

// User-friendly error messages
export const ERROR_MESSAGES: Record<AIErrorCode, string> = {
  [AIErrorCode.INVALID_INPUT]: "Please check your input and try again.",
  [AIErrorCode.INVALID_IMAGE_FORMAT]:
    "Please upload a valid image file (JPEG, PNG, GIF, or WebP).",
  [AIErrorCode.INVALID_TEXT_CONTENT]: "Please provide valid text content.",
  [AIErrorCode.IMAGE_TOO_LARGE]:
    "Image file is too large. Please upload an image smaller than 5MB.",
  [AIErrorCode.TEXT_TOO_LONG]:
    "Text content is too long. Please limit to 10,000 characters.",
  [AIErrorCode.AI_MODEL_ERROR]:
    "AI service is temporarily unavailable. Please try again later.",
  [AIErrorCode.AI_RESPONSE_INVALID]:
    "AI generated an invalid response. Please try again.",
  [AIErrorCode.AI_PARSING_ERROR]:
    "Failed to understand AI response. Please try again.",
  [AIErrorCode.AI_TIMEOUT]: "AI request timed out. Please try again.",
  [AIErrorCode.CALENDAR_READ_ERROR]: "Failed to read calendar events.",
  [AIErrorCode.CALENDAR_CONTEXT_ERROR]:
    "Calendar context temporarily unavailable.",
  [AIErrorCode.RATE_LIMIT_EXCEEDED]:
    "Too many requests. Please wait a moment before trying again.",
  [AIErrorCode.INTERNAL_ERROR]:
    "An unexpected error occurred. Please try again.",
  [AIErrorCode.NETWORK_ERROR]:
    "Network connection issue. Please check your connection and try again.",
  [AIErrorCode.CONFIGURATION_ERROR]:
    "Service configuration error. Please contact support.",
};

export function getUserFriendlyMessage(errorCode: AIErrorCode): string {
  return (
    ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[AIErrorCode.INTERNAL_ERROR]
  );
}
