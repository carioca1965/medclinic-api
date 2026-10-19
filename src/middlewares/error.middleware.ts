import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError, ErrorCode } from "../errors/domain-error";

// Unico ponto que conhece HTTP: traduz codigo de dominio em status.
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  DADOS_INVALIDOS: 400,
  NAO_AUTENTICADO: 401,
  CREDENCIAIS_INVALIDAS: 401,
  ACESSO_NEGADO: 403,
  RECURSO_NAO_ENCONTRADO: 404,
  EMAIL_JA_CADASTRADO: 409,
  CPF_JA_CADASTRADO: 409,
  CRM_JA_CADASTRADO: 409,
  HORARIO_INDISPONIVEL: 409,
  PACIENTE_INDISPONIVEL: 409,
  HORARIO_FORA_DA_ESCALA: 422,
  TRANSICAO_INVALIDA: 422,
};

function send(res: Response, statusCode: number, error: string, message: string): void {
  res.status(statusCode).json({ statusCode, error, message });
}

export function notFoundHandler(_req: Request, res: Response): void {
  send(res, 404, "RECURSO_NAO_ENCONTRADO", "Rota nao encontrada.");
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    send(res, STATUS_BY_CODE[err.code], err.code, err.message);
    return;
  }
  if (err instanceof ZodError) {
    send(res, 400, "DADOS_INVALIDOS", "Dados de entrada invalidos.");
    return;
  }
  // JSON malformado no corpo da requisicao
  if (err instanceof SyntaxError && "body" in err) {
    send(res, 400, "DADOS_INVALIDOS", "JSON invalido.");
    return;
  }
  console.error(err);
  send(res, 500, "ERRO_INTERNO", "Erro interno do servidor.");
}
