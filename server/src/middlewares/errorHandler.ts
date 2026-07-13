import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError, ValidationError } from "../domain/errors.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // body-parser errors: malformed JSON (400 SyntaxError) or payload too large (413)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON in request body" });
    return;
  }
  const bodyParserError = err as { statusCode?: number };
  if (
    typeof bodyParserError.statusCode === "number" &&
    bodyParserError.statusCode >= 400 &&
    bodyParserError.statusCode < 500
  ) {
    res.status(bodyParserError.statusCode).json({
      error: bodyParserError.statusCode === 413 ? "Request body too large" : "Invalid request body",
    });
    return;
  }

  // Log full details server-side but never leak internals to the client.
  logger.error(err instanceof Error ? err.stack ?? err.message : String(err));
  res.status(500).json({ error: "Internal server error" });
};
