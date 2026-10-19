import { NextFunction, Request, RequestHandler, Response } from "express";
import { UserRole } from "../entities/user-role.enum";
import { DomainError } from "../errors/domain-error";

export function authorize(...allowed: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.user?.roles ?? [];
    if (!roles.some((role) => allowed.includes(role))) {
      throw new DomainError("ACESSO_NEGADO", "Perfil sem permissao para este recurso.");
    }
    next();
  };
}
