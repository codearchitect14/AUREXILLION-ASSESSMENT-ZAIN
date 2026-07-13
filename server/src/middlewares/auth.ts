import type { RequestHandler } from "express";
import type { AuthService, AuthUser } from "../services/authService.js";
import { HttpError } from "../domain/errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Rejects requests without a valid `Authorization: Bearer <jwt>` header. */
export function requireAuth(authService: AuthService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new HttpError(401, "Authentication required"));
      return;
    }
    try {
      req.user = authService.verifyToken(header.slice("Bearer ".length));
      next();
    } catch (err) {
      next(err);
    }
  };
}
