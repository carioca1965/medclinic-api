import { describe, expect, it, vi } from "vitest";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";
import { DomainError } from "../errors/domain-error";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";
import { TokenService } from "../security/token-service";
import { AuthService } from "./auth.service";

const storedUser = {
  id: 1,
  name: "Admin",
  email: "admin@medclinic.com",
  password: "hash-armazenado",
  roles: [UserRole.ADMIN],
} as User;

function build(user: User | null, passwordMatches: boolean) {
  const users: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn(),
    create: vi.fn(),
  };
  const hasher: PasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn().mockResolvedValue(passwordMatches),
  };
  const tokens: TokenService = { sign: vi.fn().mockReturnValue("token-assinado"), verify: vi.fn() };
  return { service: new AuthService(users, hasher, tokens), hasher, tokens };
}

describe("AuthService.login", () => {
  it("devolve accessToken quando as credenciais estao corretas", async () => {
    const { service, tokens } = build(storedUser, true);
    const result = await service.login({ email: storedUser.email, password: "SenhaForte@123" });
    expect(result).toEqual({ accessToken: "token-assinado" });
    expect(tokens.sign).toHaveBeenCalledWith({ userId: 1, roles: [UserRole.ADMIN] });
  });

  it("compara a senha informada com o hash armazenado", async () => {
    const { service, hasher } = build(storedUser, true);
    await service.login({ email: storedUser.email, password: "SenhaForte@123" });
    expect(hasher.compare).toHaveBeenCalledWith("SenhaForte@123", "hash-armazenado");
  });

  it("recusa senha incorreta com CREDENCIAIS_INVALIDAS", async () => {
    const { service } = build(storedUser, false);
    await expect(service.login({ email: storedUser.email, password: "errada" })).rejects.toMatchObject({
      code: "CREDENCIAIS_INVALIDAS",
    });
  });

  it("recusa e-mail inexistente com o mesmo erro, sem comparar senha", async () => {
    const { service, hasher } = build(null, false);
    const attempt = service.login({ email: "x@x.com", password: "qualquer" });
    await expect(attempt).rejects.toBeInstanceOf(DomainError);
    await expect(attempt).rejects.toMatchObject({ code: "CREDENCIAIS_INVALIDAS" });
    expect(hasher.compare).not.toHaveBeenCalled();
  });
});
