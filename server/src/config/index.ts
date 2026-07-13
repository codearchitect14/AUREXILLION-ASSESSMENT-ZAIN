const isTest = process.env.NODE_ENV === "test";

export const config = {
  isTest,
  port: Number(process.env.PORT) || 4000,
  dbPath: process.env.DB_PATH,
  logLevel: process.env.LOG_LEVEL ?? (isTest ? "warn" : "http"),
  /** Comma-separated list of origins allowed by CORS. */
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Max JSON body size; largest valid payload (5000-char description) is ~6 KB. */
  jsonBodyLimit: "16kb",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpiresIn: "12h",
  /** Number of reverse proxies in front of the app (e.g. 1 for the nginx container). */
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    /** All requests per IP per window. */
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    /** Writes (POST/PATCH) per IP per window. */
    writeMax: Number(process.env.RATE_LIMIT_WRITE_MAX) || 60,
    /** Login attempts per IP per window (brute-force protection). */
    loginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 20,
  },
} as const;
