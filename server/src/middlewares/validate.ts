import type { RequestHandler } from "express";
import type { ZodError, ZodTypeAny } from "zod";
import { ValidationError, type FieldError } from "../domain/errors.js";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export interface Validated {
  body: unknown;
  query: unknown;
  params: unknown;
}

declare global {
  namespace Express {
    interface Request {
      validated: Validated;
    }
  }
}

function toFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/**
 * Validates request body/query/params against the given Zod schemas.
 * Parsed (and coerced) values are stored on req.validated so controllers
 * never touch unvalidated input.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const validated: Validated = { body: undefined, query: undefined, params: undefined };

    for (const key of ["params", "query", "body"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        next(new ValidationError("Validation failed", toFieldErrors(result.error)));
        return;
      }
      validated[key] = result.data;
    }

    req.validated = validated;
    next();
  };
}
