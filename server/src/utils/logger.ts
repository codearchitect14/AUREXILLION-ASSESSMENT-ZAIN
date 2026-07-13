import winston from "winston";
import { config } from "../config/index.js";

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  silent: config.isTest,
});
