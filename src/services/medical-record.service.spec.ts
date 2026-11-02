import { describe, expect, it, vi } from "vitest";
import { Doctor } from "../entities/doctor.entity";
import { MedicalRecord } from "../entities/medical-record.entity";
import { Patient } from "../entities/patient.entity";
import { UserRole } from "../entities/user-role.enum";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import { PatientRepository } from "../repositories/patient.repository";
import { Actor } from "../security/actor";
import { MedicalRecordService } from "./medical-record.service";

const doctor: Actor = { userId: 7, roles: [UserRole.DOCTOR] };
const admin: Actor = { userId: 1, roles: [UserRole.ADMIN] };
const secretary: Actor = { userId: 2, roles: [UserRole.SECRETARY] };
const record = { id: 5, patientId: 10, doctorId: 3, text: "Dor lombar", createdAt: new Date("2026-10-13T11:25:00.000Z") } as MedicalRecord;

function build(options: { linked?: boolean; patientExists?: boolean; doctorRecord?: boolean } = {}) {
  const { linked = true, patientExists = true, doctorRecord = true } = options;
  const doctors = { findByUserId: vi.fn().mockResolvedValue(doctorRecord ? ({ id: 3 } as Doctor) : null) } as unknown as DoctorRepository;
  const patients = { findById: vi.fn().mockResolvedValue(patientExists ? ({ id: 10 } as Patient) : null) } as unknown as PatientRepository;
  const appointments = { hasCareLink: vi.fn().mockResolvedValue(linked) } as unknown as AppointmentRepository;
  const records: MedicalRecordRepository = {
    create: vi.fn().mockResolvedValue(record),
    findPage: vi.fn().mockResolvedValue({ items: [record], total: 1 }),
  };
  return { service: new MedicalRecordService(doctors, patients, appointments, records), records, appointments };
}

describe("MedicalRecordService.create", () => {
  it("medico com vinculo escreve, e o autor vem do usuario autenticado", async () => {
    const { service, records, appointments } = build();
    const result = await service.create(10, { text: "Dor lombar" }, doctor);
    expect(appointments.hasCareLink).toHaveBeenCalledWith(3, 10);
    expect(records.create).toHaveBeenCalledWith({ patientId: 10, doctorId: 3, text: "Dor lombar" });
    expect(result).toEqual({ id: 5, patientId: 10, doctorId: 3, text: "Dor lombar", createdAt: record.createdAt });
  });

  it("medico sem vinculo recebe ACESSO_NEGADO e nada e gravado", async () => {
    const { service, records } = build({ linked: false });
    await expect(service.create(10, { text: "x" }, doctor)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
    expect(records.create).not.toHaveBeenCalled();
  });

  it("administracao e secretaria nao escrevem", async () => {
    const { service } = build();
    await expect(service.create(10, { text: "x" }, admin)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
    await expect(service.create(10, { text: "x" }, secretary)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("usuario com perfil doctor mas sem registro de medico e recusado", async () => {
    const { service } = build({ doctorRecord: false });
    await expect(service.create(10, { text: "x" }, doctor)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("paciente inexistente devolve RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build({ patientExists: false });
    await expect(service.create(99, { text: "x" }, doctor)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});

describe("MedicalRecordService.list", () => {
  it("medico com vinculo le o prontuario com metadados de paginacao", async () => {
    const { service } = build();
    const result = await service.list(10, { page: 1, pageSize: 20 }, doctor);
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ total: 1, page: 1, pageSize: 20, totalPages: 1 });
  });

  it("administracao le para auditoria, sem precisar de vinculo", async () => {
    const { service, appointments } = build({ linked: false });
    const result = await service.list(10, { page: 1, pageSize: 20 }, admin);
    expect(result.data).toHaveLength(1);
    expect(appointments.hasCareLink).not.toHaveBeenCalled();
  });

  it("medico sem vinculo recebe ACESSO_NEGADO", async () => {
    const { service } = build({ linked: false });
    await expect(service.list(10, { page: 1, pageSize: 20 }, doctor)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("secretaria nao le o prontuario", async () => {
    const { service } = build();
    await expect(service.list(10, { page: 1, pageSize: 20 }, secretary)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("paciente inexistente devolve RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build({ patientExists: false });
    await expect(service.list(99, { page: 1, pageSize: 20 }, admin)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});
