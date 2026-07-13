import jwt from "jsonwebtoken";
import type { UserRepository } from "../repositories/userRepository.js";
import { verifyPassword } from "../utils/password.js";
import { HttpError } from "../domain/errors.js";
import { config } from "../config/index.js";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export class AuthService {
  constructor(private users: UserRepository) {}

  login(email: string, password: string): LoginResult {
    const user = this.users.findByEmail(email);
    // Same error for unknown email and wrong password: no account enumeration.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "Invalid email or password");
    }

    const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(
      { sub: String(user.id), name: user.name, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return { token, user: authUser };
  }

  verifyToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
      return {
        id: Number(payload.sub),
        name: String(payload.name),
        email: String(payload.email),
      };
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }
  }
}
