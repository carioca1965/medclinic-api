import { NextFunction, Request, RequestHandler, Response } from "express";
import { DomainError } from "../errors/domain-error";
import { TokenService } from "../security/token-service";

export function authenticate(tokens: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new DomainError("NAO_AUTENTICADO", "Token ausente ou malformado.");
    }
    try {
      const payload = tokens.verify(token);
      req.user = { id: payload.userId, roles: payload.roles };
    } catch {
      throw new DomainError("NAO_AUTENTICADO", "Token invalido ou expirado.");
    }
    next();
  };
}
