import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { DatabaseSync } from "node:sqlite";
import { config } from "./config/index.js";
import { TicketRepository } from "./repositories/ticketRepository.js";
import { UserRepository } from "./repositories/userRepository.js";
import { TicketService } from "./services/ticketService.js";
import { AuthService } from "./services/authService.js";
import { TicketController } from "./controllers/ticketController.js";
import { AuthController } from "./controllers/authController.js";
import { createTicketsRouter } from "./routes/tickets.js";
import { createAuthRouter } from "./routes/auth.js";
import { requireAuth } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";

export interface AppOptions {
  /** Override rate-limit thresholds (used by tests); false disables limiting. */
  rateLimit?: { windowMs: number; max: number; writeMax: number; loginMax: number } | false;
}

export function createApp(db: DatabaseSync, options: AppOptions = {}): express.Express {
  const app = express();

  // --- Security & infrastructure middleware ---
  app.disable("x-powered-by");
  // Behind a reverse proxy (nginx in Docker), trust X-Forwarded-For so rate
  // limiting keys on the real client IP instead of the proxy's.
  if (config.trustProxy > 0) app.set("trust proxy", config.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(requestLogger);

  const limits = options.rateLimit ?? config.rateLimit;
  let loginLimiter: express.RequestHandler = (_req, _res, next) => next();
  if (limits !== false) {
    const jsonLimitResponse = {
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    } as const;

    app.use(rateLimit({ windowMs: limits.windowMs, limit: limits.max, ...jsonLimitResponse }));

    // Stricter budget for writes to slow down abuse/spam of ticket creation.
    const writeLimiter = rateLimit({
      windowMs: limits.windowMs,
      limit: limits.writeMax,
      ...jsonLimitResponse,
    });
    app.use((req, res, next) => {
      if (req.method === "POST" || req.method === "PATCH") {
        writeLimiter(req, res, next);
        return;
      }
      next();
    });

    // Tightest budget on login to slow brute-force attempts.
    loginLimiter = rateLimit({
      windowMs: limits.windowMs,
      limit: limits.loginMax,
      ...jsonLimitResponse,
    });
  }

  // --- Application layers: routes -> validation -> controller -> service -> repository ---
  const ticketRepository = new TicketRepository(db);
  const ticketService = new TicketService(ticketRepository);
  const ticketController = new TicketController(ticketService);

  const userRepository = new UserRepository(db);
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  app.use("/api/auth", loginLimiter, createAuthRouter(authController));
  app.use("/api/tickets", requireAuth(authService), createTicketsRouter(ticketController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
