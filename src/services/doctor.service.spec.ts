import { describe, expect, it, vi } from "vitest";
import { Doctor } from "../entities/doctor.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";
import { DoctorRepository } from "../repositories/doctor.repository";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";
import { DoctorService } from "./doctor.service";

const user = {
  id: 7,
  name: "Dra. Helena Souza",
  email: "helena@medclinic.com",
  password: "hash-gerado",
  roles: [UserRole.DOCTOR],
} as User;
const stored = { id: 3, crm: "CRM-SC-54321", user } as Doctor;
const input = {
  name: "Dra. Helena Souza",
  email: "helena@medclinic.com",
  password: "SenhaForte@123",
  crm: "CRM-SC-54321",
};

function build(
  doctorOverrides: Partial<DoctorRepository> = {},
  userOverrides: Partial<UserRepository> = {},
) {
  const users: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
    create: vi.fn(),
    ...userOverrides,
  };
  const doctors: DoctorRepository = {
    createWithUser: vi.fn().mockResolvedValue(stored),
    findById: vi.fn().mockResolvedValue(stored),
    findByCrm: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn(),
    findPage: vi.fn().mockResolvedValue({ items: [stored], total: 1 }),
    ...doctorOverrides,
  };
  const hasher: PasswordHasher = { hash: vi.fn().mockResolvedValue("hash-gerado"), compare: vi.fn() };
  return { service: new DoctorService(users, doctors, hasher), users, doctors, hasher };
}

describe("DoctorService.create", () => {
  it("cria o medico com a senha em hash e devolve usuario com perfil doctor, sem senha", async () => {
    const { service, doctors } = build();
    const result = await service.create(input);
    expect(doctors.createWithUser).toHaveBeenCalledWith({ ...input, password: "hash-gerado" });
    expect(result).toEqual({
      id: 3,
      crm: "CRM-SC-54321",
      user: { id: 7, name: "Dra. Helena Souza", email: "helena@medclinic.com", roles: ["doctor"] },
    });
    expect(result.user).not.toHaveProperty("password");
  });

  it("recusa e-mail ja cadastrado sem criar nada", async () => {
    const { service, doctors } = build({}, { findByEmail: vi.fn().mockResolvedValue(user) });
    await expect(service.create(input)).rejects.toMatchObject({ code: "EMAIL_JA_CADASTRADO" });
    expect(doctors.createWithUser).not.toHaveBeenCalled();
  });

  it("recusa CRM ja cadastrado sem criar usuario nem medico", async () => {
    const { service, doctors, hasher } = build({ findByCrm: vi.fn().mockResolvedValue(stored) });
    await expect(service.create(input)).rejects.toMatchObject({ code: "CRM_JA_CADASTRADO" });
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(doctors.createWithUser).not.toHaveBeenCalled();
  });
});

describe("DoctorService.getById", () => {
  it("devolve o medico existente", async () => {
    const { service } = build();
    expect((await service.getById(3)).crm).toBe("CRM-SC-54321");
  });

  it("recusa medico inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build({ findById: vi.fn().mockResolvedValue(null) });
    await expect(service.getById(99)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});

describe("DoctorService.list", () => {
  it("calcula os metadados e repassa o filtro de nome", async () => {
    const { service, doctors } = build({
      findPage: vi.fn().mockResolvedValue({ items: [stored], total: 41 }),
    });
    const result = await service.list({ page: 2, pageSize: 20, name: "hel" });
    expect(doctors.findPage).toHaveBeenCalledWith({ page: 2, pageSize: 20, name: "hel" });
    expect(result.meta).toEqual({ total: 41, page: 2, pageSize: 20, totalPages: 3 });
    expect(result.data[0].user.roles).toEqual(["doctor"]);
  });
});
