import { describe, expect, it, vi } from "vitest";
import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";
import { Doctor } from "../entities/doctor.entity";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";
import { CalendarService } from "./calendar.service";

function build(doctorExists = true) {
  const doctors = { findById: vi.fn().mockResolvedValue(doctorExists ? ({ id: 3 } as Doctor) : null) } as unknown as DoctorRepository;
  const shifts: WorkShiftRepository = {
    replaceForDoctor: vi.fn(),
    findByDoctor: vi.fn().mockResolvedValue([{ weekDay: 2, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30 }]),
  };
  const appointments = {
    findActiveStartingBetween: vi.fn().mockResolvedValue([
      { id: 41, patientId: 10, doctorId: 3, startsAt: new Date("2026-10-13T11:00:00.000Z"), endsAt: new Date("2026-10-13T11:30:00.000Z"), status: AppointmentStatus.SCHEDULED },
    ] as Appointment[]),
  } as unknown as AppointmentRepository;
  return { service: new CalendarService(doctors, shifts, appointments), appointments };
}

describe("CalendarService.get", () => {
  it("devolve a escala e as consultas ativas do periodo", async () => {
    const { service } = build();
    const result = await service.get(3, { from: "2026-10-12", to: "2026-10-16" });
    expect(result.workSchedule.shifts).toHaveLength(1);
    expect(result.appointments).toEqual([
      { id: 41, patientId: 10, startsAt: new Date("2026-10-13T11:00:00.000Z"), endsAt: new Date("2026-10-13T11:30:00.000Z"), status: "scheduled" },
    ]);
  });

  it("considera o dia inteiro no horario local nas duas pontas (inclusivo)", async () => {
    const { service, appointments } = build();
    await service.get(3, { from: "2026-10-12", to: "2026-10-16" });
    expect(appointments.findActiveStartingBetween).toHaveBeenCalledWith(
      3,
      new Date("2026-10-12T03:00:00.000Z"),
      new Date("2026-10-17T03:00:00.000Z"),
    );
  });

  it("aceita periodo de ate 31 dias de distancia", async () => {
    const { service } = build();
    await expect(service.get(3, { from: "2026-10-01", to: "2026-11-01" })).resolves.toBeDefined();
  });

  it("recusa periodo maior que 31 dias com DADOS_INVALIDOS", async () => {
    const { service } = build();
    await expect(service.get(3, { from: "2026-10-01", to: "2026-11-15" })).rejects.toMatchObject({ code: "DADOS_INVALIDOS" });
  });

  it("recusa medico inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build(false);
    await expect(service.get(99, { from: "2026-10-12", to: "2026-10-16" })).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});
