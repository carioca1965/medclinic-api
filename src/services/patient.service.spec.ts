import { describe, expect, it, vi } from "vitest";
import { Patient } from "../entities/patient.entity";
import { PatientRepository } from "../repositories/patient.repository";
import { PatientService } from "./patient.service";

const stored = {
  id: 10,
  name: "Carlos Pereira",
  cpf: "12345678901",
  createdAt: new Date("2026-10-20T14:03:11.000Z"),
} as Patient;

function build(overrides: Partial<PatientRepository> = {}) {
  const patients: PatientRepository = {
    create: vi.fn().mockResolvedValue(stored),
    findById: vi.fn().mockResolvedValue(stored),
    findByCpf: vi.fn().mockResolvedValue(null),
    findPage: vi.fn().mockResolvedValue({ items: [stored], total: 1 }),
    updateName: vi.fn().mockResolvedValue({ ...stored, name: "Carlos P." }),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { service: new PatientService(patients), patients };
}

describe("PatientService.create", () => {
  it("cria o paciente e devolve os campos do contrato", async () => {
    const { service, patients } = build();
    const result = await service.create({ name: "Carlos Pereira", cpf: "12345678901" });
    expect(patients.create).toHaveBeenCalledWith({ name: "Carlos Pereira", cpf: "12345678901" });
    expect(result).toEqual({
      id: 10,
      name: "Carlos Pereira",
      cpf: "12345678901",
      createdAt: stored.createdAt,
    });
  });

  it("recusa CPF repetido com CPF_JA_CADASTRADO e nao grava", async () => {
    const { service, patients } = build({ findByCpf: vi.fn().mockResolvedValue(stored) });
    await expect(service.create({ name: "Outro", cpf: "12345678901" })).rejects.toMatchObject({
      code: "CPF_JA_CADASTRADO",
    });
    expect(patients.create).not.toHaveBeenCalled();
  });
});

describe("PatientService.getById", () => {
  it("devolve o paciente existente", async () => {
    const { service } = build();
    expect((await service.getById(10)).id).toBe(10);
  });

  it("recusa paciente inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build({ findById: vi.fn().mockResolvedValue(null) });
    await expect(service.getById(99)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});

describe("PatientService.list", () => {
  it("calcula os metadados de paginacao", async () => {
    const { service, patients } = build({
      findPage: vi.fn().mockResolvedValue({ items: [stored], total: 57 }),
    });
    const result = await service.list({ page: 1, pageSize: 20, name: "car" });
    expect(patients.findPage).toHaveBeenCalledWith({ page: 1, pageSize: 20, name: "car" });
    expect(result.meta).toEqual({ total: 57, page: 1, pageSize: 20, totalPages: 3 });
    expect(result.data).toHaveLength(1);
  });

  it("devolve zero paginas quando nao ha registros", async () => {
    const { service } = build({ findPage: vi.fn().mockResolvedValue({ items: [], total: 0 }) });
    const result = await service.list({ page: 1, pageSize: 20 });
    expect(result).toEqual({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } });
  });
});

describe("PatientService.update", () => {
  it("altera o nome do paciente", async () => {
    const { service, patients } = build();
    const result = await service.update(10, { name: "Carlos P." });
    expect(patients.updateName).toHaveBeenCalledWith(10, "Carlos P.");
    expect(result.name).toBe("Carlos P.");
  });

  it("recusa paciente inexistente sem alterar nada", async () => {
    const { service, patients } = build({ findById: vi.fn().mockResolvedValue(null) });
    await expect(service.update(99, { name: "X" })).rejects.toMatchObject({
      code: "RECURSO_NAO_ENCONTRADO",
    });
    expect(patients.updateName).not.toHaveBeenCalled();
  });
});

describe("PatientService.remove", () => {
  it("remove o paciente existente", async () => {
    const { service, patients } = build();
    await service.remove(10);
    expect(patients.remove).toHaveBeenCalledWith(10);
  });

  it("recusa paciente inexistente sem remover nada", async () => {
    const { service, patients } = build({ findById: vi.fn().mockResolvedValue(null) });
    await expect(service.remove(99)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
    expect(patients.remove).not.toHaveBeenCalled();
  });
});
