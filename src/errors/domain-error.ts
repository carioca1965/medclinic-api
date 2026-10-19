export type ErrorCode =
  | "DADOS_INVALIDOS"
  | "NAO_AUTENTICADO"
  | "CREDENCIAIS_INVALIDAS"
  | "ACESSO_NEGADO"
  | "RECURSO_NAO_ENCONTRADO"
  | "EMAIL_JA_CADASTRADO"
  | "CPF_JA_CADASTRADO"
  | "CRM_JA_CADASTRADO"
  | "HORARIO_INDISPONIVEL"
  | "PACIENTE_INDISPONIVEL"
  | "HORARIO_FORA_DA_ESCALA"
  | "TRANSICAO_INVALIDA";

// Erro de dominio: a regra de negocio so conhece o codigo, nunca o status HTTP.
export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
