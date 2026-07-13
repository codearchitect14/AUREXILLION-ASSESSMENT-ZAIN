import type { RequestHandler } from "express";
import { logger } from "../utils/logger.js";

/** Logs every request with method, path, status code, and duration. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "http";
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      ip: req.ip,
    });
  });

  next();
};
