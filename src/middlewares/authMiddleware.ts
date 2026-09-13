import { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../utils/JwtUtil";
import { AppError } from "../utils/AppError";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token de autenticação não informado.", 401);
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Formato de token inválido.", 401);
  }

  try {
    const payload = JwtUtil.verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    throw new AppError("Token inválido ou expirado.", 401);
  }
}
