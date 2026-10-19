import { describe, expect, it, vi } from "vitest";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";
import { UserService } from "./user.service";

const input = {
  name: "Joana",
  email: "joana@medclinic.com",
  password: "SenhaForte@123",
  roles: [UserRole.SECRETARY],
};

function build(overrides: Partial<UserRepository> = {}) {
  const users: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
    create: vi.fn().mockImplementation(async (data) => ({ id: 2, ...data }) as User),
    ...overrides,
  };
  const hasher: PasswordHasher = {
    hash: vi.fn().mockResolvedValue("hash-gerado"),
    compare: vi.fn(),
  };
  return { service: new UserService(users, hasher), users, hasher };
}

describe("UserService.create", () => {
  it("grava a senha como hash e nao a devolve na resposta", async () => {
    const { service, users } = build();
    const result = await service.create(input);
    expect(users.create).toHaveBeenCalledWith({ ...input, password: "hash-gerado" });
    expect(result).toEqual({ id: 2, name: "Joana", email: "joana@medclinic.com", roles: ["secretary"] });
    expect(result).not.toHaveProperty("password");
  });

  it("recusa e-mail ja cadastrado com EMAIL_JA_CADASTRADO", async () => {
    const { service, users } = build({ findByEmail: vi.fn().mockResolvedValue({ id: 9 } as User) });
    await expect(service.create(input)).rejects.toMatchObject({ code: "EMAIL_JA_CADASTRADO" });
    expect(users.create).not.toHaveBeenCalled();
  });
});

describe("UserService.getMe", () => {
  it("devolve os dados publicos do usuario", async () => {
    const found = { id: 1, name: "Admin", email: "a@a.com", password: "x", roles: [UserRole.ADMIN] } as User;
    const { service } = build({ findById: vi.fn().mockResolvedValue(found) });
    expect(await service.getMe(1)).toEqual({ id: 1, name: "Admin", email: "a@a.com", roles: ["admin"] });
  });

  it("recusa quando o usuario do token nao existe mais", async () => {
    const { service } = build({ findById: vi.fn().mockResolvedValue(null) });
    await expect(service.getMe(99)).rejects.toMatchObject({ code: "NAO_AUTENTICADO" });
  });
});
