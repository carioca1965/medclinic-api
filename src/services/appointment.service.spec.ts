import { describe, expect, it, vi } from "vitest";
import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";
import { Doctor } from "../entities/doctor.entity";
import { Patient } from "../entities/patient.entity";
import { UserRole } from "../entities/user-role.enum";
import { Shift } from "../dtos/work-schedule.dto";
import { AppointmentRepository, AppointmentTransaction } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { PatientRepository } from "../repositories/patient.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";
import { Actor } from "../security/actor";
import { AppointmentService, periodsOverlap } from "./appointment.service";

// 2026-10-13 e uma terca-feira. A clinica fica em UTC-3, entao 08:00 local = 11:00Z.
const at = (hhmm: string) => new Date(`2026-10-13T${hhmm}:00.000Z`);
const local = (hhmm: string) => `2026-10-13T${hhmm}:00-03:00`;
const tuesdayShifts: Shift[] = [
  { weekDay: 2, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30 },
  { weekDay: 2, startTime: "14:00", endTime: "18:00", slotDurationMinutes: 20 },
];

const appt = (over: Partial<Appointment>): Appointment =>
  ({ id: 41, doctorId: 3, patientId: 10, startsAt: at("11:00"), endsAt: at("11:30"), status: AppointmentStatus.SCHEDULED, ...over }) as Appointment;

function build(options: { doctorBusy?: Appointment[]; patientBusy?: Appointment[]; shifts?: Shift[] } = {}) {
  const tx: AppointmentTransaction = {
    listActiveByDoctor: vi.fn().mockResolvedValue(options.doctorBusy ?? []),
    listActiveByPatient: vi.fn().mockResolvedValue(options.patientBusy ?? []),
    insert: vi.fn().mockImplementation(async (data) => ({ id: 99, status: AppointmentStatus.SCHEDULED, ...data })),
  };
  const appointments: AppointmentRepository = {
    withLocks: vi.fn().mockImplementation(async (_d, _p, work) => work(tx)),
    findById: vi.fn(),
    findPage: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findActiveStartingBetween: vi.fn(),
    updateStatus: vi.fn().mockImplementation(async (id, status) => appt({ id, status })),
    hasCareLink: vi.fn(),
  };
  const doctors: DoctorRepository = {
    createWithUser: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: 3 } as Doctor),
    findByCrm: vi.fn(),
    // usuario 7 e o medico 3; qualquer outro usuario medico e o medico 5.
    findByUserId: vi.fn().mockImplementation(async (userId: number) => ({ id: userId === 7 ? 3 : 5 }) as Doctor),
    findPage: vi.fn(),
  };
  const patients: PatientRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: 10 } as Patient),
    findByCpf: vi.fn(),
    findPage: vi.fn(),
    updateName: vi.fn(),
    remove: vi.fn(),
  };
  const shifts: WorkShiftRepository = {
    replaceForDoctor: vi.fn(),
    findByDoctor: vi.fn().mockResolvedValue(options.shifts ?? tuesdayShifts),
  };
  return { service: new AppointmentService(doctors, patients, shifts, appointments), appointments, doctors, patients, tx };
}

describe("periodsOverlap (RN08)", () => {
  const base = { startsAt: at("13:00"), endsAt: at("13:30") };
  it("um periodo antes do outro nao conflita", () => {
    expect(periodsOverlap(base, { startsAt: at("12:00"), endsAt: at("12:30") })).toBe(false);
  });
  it("um periodo depois do outro nao conflita", () => {
    expect(periodsOverlap(base, { startsAt: at("14:00"), endsAt: at("14:30") })).toBe(false);
  });
  it("periodos encostados nao conflitam", () => {
    expect(periodsOverlap(base, { startsAt: at("13:30"), endsAt: at("14:00") })).toBe(false);
    expect(periodsOverlap(base, { startsAt: at("12:30"), endsAt: at("13:00") })).toBe(false);
  });
  it("um periodo dentro do outro conflita", () => {
    expect(periodsOverlap({ startsAt: at("13:00"), endsAt: at("14:00") }, { startsAt: at("13:10"), endsAt: at("13:20") })).toBe(true);
  });
  it("periodos que se cruzam conflitam mesmo com inicios diferentes", () => {
    expect(periodsOverlap({ startsAt: at("13:00"), endsAt: at("13:30") }, { startsAt: at("13:20"), endsAt: at("13:50") })).toBe(true);
  });
});

describe("AppointmentService.create", () => {
  it("cria a consulta e calcula o fim somando a duracao do turno", async () => {
    const { service, tx } = build();
    const result = await service.create({ doctorId: 3, patientId: 10, startsAt: local("08:00") });
    expect(tx.insert).toHaveBeenCalledWith({ doctorId: 3, patientId: 10, startsAt: at("11:00"), endsAt: at("11:30") });
    expect(result).toMatchObject({ doctorId: 3, patientId: 10, status: "scheduled" });
    expect(result.endsAt).toEqual(at("11:30"));
  });

  it("usa a duracao do turno da tarde (20 minutos)", async () => {
    const { service } = build();
    const result = await service.create({ doctorId: 3, patientId: 10, startsAt: local("14:20") });
    expect(result.endsAt).toEqual(new Date("2026-10-13T17:40:00.000Z"));
  });

  it("aceita o ultimo horario do turno quando a consulta cabe inteira", async () => {
    const { service } = build();
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("11:30") })).resolves.toBeDefined();
  });

  it("recusa medico inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service, doctors } = build();
    (doctors.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.create({ doctorId: 9, patientId: 10, startsAt: local("08:00") })).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });

  it("recusa paciente inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service, patients } = build();
    (patients.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.create({ doctorId: 3, patientId: 9, startsAt: local("08:00") })).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });

  it("recusa horario fora de qualquer turno (dia sem escala)", async () => {
    const { service } = build();
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: "2026-10-14T08:00:00-03:00" })).rejects.toMatchObject({ code: "HORARIO_FORA_DA_ESCALA" });
  });

  it("recusa horario antes do inicio do turno", async () => {
    const { service } = build();
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("07:30") })).rejects.toMatchObject({ code: "HORARIO_FORA_DA_ESCALA" });
  });

  it("recusa horario desalinhado da grade (08:20 com consultas de 30 minutos)", async () => {
    const { service } = build();
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("08:20") })).rejects.toMatchObject({ code: "HORARIO_FORA_DA_ESCALA" });
  });

  it("recusa consulta que nao cabe no fim do turno", async () => {
    const { service } = build({ shifts: [{ weekDay: 2, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 50 }] });
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("11:20") })).rejects.toMatchObject({ code: "HORARIO_FORA_DA_ESCALA" });
  });

  it("recusa horario com segundos, que nao esta na grade", async () => {
    const { service } = build();
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: "2026-10-13T08:00:30-03:00" })).rejects.toMatchObject({ code: "HORARIO_FORA_DA_ESCALA" });
  });

  it("recusa conflito com consulta ativa do medico com HORARIO_INDISPONIVEL", async () => {
    const { service, tx } = build({ doctorBusy: [appt({ startsAt: at("11:00"), endsAt: at("11:30") })] });
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("08:00") })).rejects.toMatchObject({ code: "HORARIO_INDISPONIVEL" });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("aceita consulta encostada na do medico (uma termina quando a outra comeca)", async () => {
    const { service } = build({ doctorBusy: [appt({ startsAt: at("11:00"), endsAt: at("11:30") })] });
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("08:30") })).resolves.toBeDefined();
  });

  it("recusa conflito com consulta do paciente com PACIENTE_INDISPONIVEL", async () => {
    const { service, tx } = build({ patientBusy: [appt({ doctorId: 5, startsAt: at("11:00"), endsAt: at("11:30") })] });
    await expect(service.create({ doctorId: 3, patientId: 10, startsAt: local("08:00") })).rejects.toMatchObject({ code: "PACIENTE_INDISPONIVEL" });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("verifica e grava dentro da transacao travada do medico e do paciente", async () => {
    const { service, appointments } = build();
    await service.create({ doctorId: 3, patientId: 10, startsAt: local("08:00") });
    expect(appointments.withLocks).toHaveBeenCalledWith(3, 10, expect.any(Function));
  });
});

const admin: Actor = { userId: 1, roles: [UserRole.ADMIN] };
const secretary: Actor = { userId: 2, roles: [UserRole.SECRETARY] };
const doctor: Actor = { userId: 7, roles: [UserRole.DOCTOR] };
const otherDoctor: Actor = { userId: 8, roles: [UserRole.DOCTOR] };

function withAppointment(status: AppointmentStatus, ownerId = 3) {
  const ctx = build();
  (ctx.appointments.findById as ReturnType<typeof vi.fn>).mockResolvedValue(appt({ status, doctorId: ownerId }));
  return ctx;
}

describe("AppointmentService.updateStatus (RN11 e RN12)", () => {
  it("o medico da consulta coloca em andamento e conclui", async () => {
    const start = withAppointment(AppointmentStatus.SCHEDULED);
    expect((await start.service.updateStatus(41, AppointmentStatus.IN_PROGRESS, doctor)).status).toBe("in_progress");
    const finish = withAppointment(AppointmentStatus.IN_PROGRESS);
    expect((await finish.service.updateStatus(41, AppointmentStatus.DONE, doctor)).status).toBe("done");
  });

  it("a administracao tambem inicia, conclui e cancela", async () => {
    await expect(withAppointment(AppointmentStatus.SCHEDULED).service.updateStatus(41, AppointmentStatus.IN_PROGRESS, admin)).resolves.toBeDefined();
    await expect(withAppointment(AppointmentStatus.IN_PROGRESS).service.updateStatus(41, AppointmentStatus.DONE, admin)).resolves.toBeDefined();
    await expect(withAppointment(AppointmentStatus.IN_PROGRESS).service.updateStatus(41, AppointmentStatus.CANCELLED, admin)).resolves.toBeDefined();
  });

  it("a secretaria cancela consulta agendada", async () => {
    await expect(withAppointment(AppointmentStatus.SCHEDULED).service.updateStatus(41, AppointmentStatus.CANCELLED, secretary)).resolves.toBeDefined();
  });

  it("a secretaria nao cancela consulta em andamento nem inicia consulta", async () => {
    await expect(withAppointment(AppointmentStatus.IN_PROGRESS).service.updateStatus(41, AppointmentStatus.CANCELLED, secretary)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
    await expect(withAppointment(AppointmentStatus.SCHEDULED).service.updateStatus(41, AppointmentStatus.IN_PROGRESS, secretary)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("medico que nao e o da consulta nao muda o status", async () => {
    const { service, appointments } = withAppointment(AppointmentStatus.SCHEDULED);
    await expect(service.updateStatus(41, AppointmentStatus.IN_PROGRESS, otherDoctor)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
    expect(appointments.updateStatus).not.toHaveBeenCalled();
  });

  it("recusa transicoes fora do ciclo com TRANSICAO_INVALIDA", async () => {
    const pulaEtapa = withAppointment(AppointmentStatus.SCHEDULED);
    await expect(pulaEtapa.service.updateStatus(41, AppointmentStatus.DONE, admin)).rejects.toMatchObject({ code: "TRANSICAO_INVALIDA" });
    const concluida = withAppointment(AppointmentStatus.DONE);
    await expect(concluida.service.updateStatus(41, AppointmentStatus.CANCELLED, admin)).rejects.toMatchObject({ code: "TRANSICAO_INVALIDA" });
    const cancelada = withAppointment(AppointmentStatus.CANCELLED);
    await expect(cancelada.service.updateStatus(41, AppointmentStatus.SCHEDULED, admin)).rejects.toMatchObject({ code: "TRANSICAO_INVALIDA" });
  });

  it("recusa agendamento inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service, appointments } = build();
    (appointments.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.updateStatus(99, AppointmentStatus.CANCELLED, admin)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});

describe("AppointmentService.getById", () => {
  it("o medico da consulta, a secretaria e a administracao enxergam", async () => {
    const { service } = withAppointment(AppointmentStatus.SCHEDULED);
    expect((await service.getById(41, doctor)).id).toBe(41);
    expect((await service.getById(41, secretary)).id).toBe(41);
    expect((await service.getById(41, admin)).id).toBe(41);
  });

  it("medico de outra consulta recebe ACESSO_NEGADO", async () => {
    const { service } = withAppointment(AppointmentStatus.SCHEDULED, 5);
    await expect(service.getById(41, doctor)).rejects.toMatchObject({ code: "ACESSO_NEGADO" });
  });

  it("recusa agendamento inexistente", async () => {
    const { service, appointments } = build();
    (appointments.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.getById(99, admin)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});

describe("AppointmentService.list (RF10)", () => {
  it("forca o filtro do proprio medico, ignorando o doctorId enviado", async () => {
    const { service, appointments } = build();
    await service.list({ page: 1, pageSize: 20, doctorId: 99 }, doctor);
    expect(appointments.findPage).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 3 }));
  });

  it("medico sem registro profissional recebe lista vazia", async () => {
    const { service, doctors, appointments } = build();
    (doctors.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await service.list({ page: 1, pageSize: 20 }, doctor);
    expect(result.data).toEqual([]);
    expect(appointments.findPage).not.toHaveBeenCalled();
  });

  it("administracao usa os filtros enviados e converte datas pelo horario da clinica", async () => {
    const { service, appointments } = build();
    await service.list({ page: 2, pageSize: 10, doctorId: 4, patientId: 6, status: AppointmentStatus.DONE, from: "2026-10-12", to: "2026-10-16" }, admin);
    expect(appointments.findPage).toHaveBeenCalledWith({
      doctorId: 4,
      patientId: 6,
      status: "done",
      from: new Date("2026-10-12T03:00:00.000Z"),
      to: new Date("2026-10-17T03:00:00.000Z"),
      page: 2,
      pageSize: 10,
    });
  });

  it("calcula os metadados de paginacao", async () => {
    const { service, appointments } = build();
    (appointments.findPage as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [appt({})], total: 45 });
    const result = await service.list({ page: 1, pageSize: 20 }, secretary);
    expect(result.meta).toEqual({ total: 45, page: 1, pageSize: 20, totalPages: 3 });
  });
});
