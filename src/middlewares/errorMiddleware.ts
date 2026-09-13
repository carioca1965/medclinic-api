import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Erro interno do servidor." });
}
