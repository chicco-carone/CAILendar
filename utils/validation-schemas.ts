import { z } from "zod";

export const LanguageSchema = z
  .enum(["en", "it", "es", "fr", "de", "pt"])
  .default("it");

export const ImageValidationSchema = z.object({
  data: z
    .string()
    .min(1, "Image data cannot be empty")
    .refine((data) => {
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      return base64Regex.test(data) || /^[A-Za-z0-9+/]+=*$/.test(data);
    }, "Invalid image format. Must be base64 encoded image data")
    .refine((data) => {
      const sizeInBytes = (data.length * 3) / 4;
      return sizeInBytes <= 5 * 1024 * 1024;
    }, "Image size must be less than 5MB"),
  format: z.enum(["jpeg", "jpg", "png", "gif", "webp"]).optional(),
});

export const TextValidationSchema = z.object({
  content: z
    .string()
    .min(1, "Text content cannot be empty")
    .max(10000, "Text content must be less than 10,000 characters")
    .refine((text) => {
      const specialCharRatio =
        (text.match(/[^a-zA-Z0-9\s\.,!?;:()\-'"]/g) || []).length / text.length;
      return specialCharRatio < 0.3;
    }, "Text contains too many special characters"),
  language: LanguageSchema.optional(),
});

export const DateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().optional(),
  })
  .refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, "Start date must be before end date");

export const AIRequestSchema = z
  .object({
    image: z.string().optional(),
    text: z.string().optional(),
    language: LanguageSchema,
    includeContext: z.boolean().default(true),
    contextRange: DateRangeSchema.optional(),
    timezone: z
      .string()
      .default(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
  })
  .refine(
    (data) => data.image || data.text,
    "Either image or text must be provided",
  )
  .refine((data) => {
    if (data.image) {
      try {
        ImageValidationSchema.parse({ data: data.image });
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, "Invalid image format or size")
  .refine((data) => {
    if (data.text) {
      try {
        TextValidationSchema.parse({ content: data.text });
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, "Invalid text content");

export const AIEventValidationSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    start: z
      .string()
      .refine((val) => {
        try {
          const date = new Date(val);
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      }, "Invalid start date format")
      .optional()
      .default(() => new Date().toISOString()),
    end: z
      .string()
      .refine((val) => {
        try {
          const date = new Date(val);
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      }, "Invalid end date format")
      .optional()
      .default(() => new Date(Date.now() + 60 * 60 * 1000).toISOString()),
    timezone: z
      .string()
      .optional()
      .default(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    location: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => val || ""),
    description: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => val || ""),
  })
  .refine((data) => {
    try {
      return new Date(data.start) <= new Date(data.end);
    } catch {
      return true;
    }
  }, "Start time must be before end time");

export const AIEventsResponseSchema = z.object({
  events: z
    .array(AIEventValidationSchema)
    .min(0)
    .max(50, "Too many events generated"),
});

export function preprocessImageData(image: string): string {
  if (!image.startsWith("data:")) {
    return `data:image/jpeg;base64,${image}`;
  }
  return image;
}

export function preprocessTextContent(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function validateAndNormalizeRequest(rawRequest: unknown) {
  const request = AIRequestSchema.parse(rawRequest);

  return {
    ...request,
    image: request.image ? preprocessImageData(request.image) : undefined,
    text: request.text ? preprocessTextContent(request.text) : undefined,
  };
}
