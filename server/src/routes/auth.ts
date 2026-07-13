import { Router } from "express";
import type { AuthController } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../domain/validation.js";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post("/login", validate({ body: loginSchema }), controller.login);
  return router;
}
