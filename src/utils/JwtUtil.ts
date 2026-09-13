import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../entities/UserRole";

export interface JwtPayload {
  id: string;
  role: UserRole;
}

const JWT_SECRET: string = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "1h";

export class JwtUtil {
  static generateToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }
}
