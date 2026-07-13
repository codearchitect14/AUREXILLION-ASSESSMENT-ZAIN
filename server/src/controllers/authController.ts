import type { RequestHandler } from "express";
import type { AuthService } from "../services/authService.js";
import type { LoginInput } from "../domain/validation.js";

export class AuthController {
  constructor(private service: AuthService) {}

  login: RequestHandler = (req, res, next) => {
    try {
      const { email, password } = req.validated.body as LoginInput;
      res.status(200).json(this.service.login(email, password));
    } catch (err) {
      next(err);
    }
  };
}
