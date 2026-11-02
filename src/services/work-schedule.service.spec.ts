import { describe, expect, it, vi } from "vitest";
import { Shift } from "../dtos/work-schedule.dto";
import { Doctor } from "../entities/doctor.entity";
import { DoctorRepository } from "../repositories/doctor.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";
import { WorkScheduleService } from "./work-schedule.service";

const shift = (weekDay: number, startTime: string, endTime: string, slot = 30): Shift => ({
  weekDay,
  startTime,
  endTime,
  slotDurationMinutes: slot,
});

function build(doctorExists = true) {
  const doctors: DoctorRepository = {
    createWithUser: vi.fn(),
    findById: vi.fn().mockResolvedValue(doctorExists ? ({ id: 3 } as Doctor) : null),
    findByCrm: vi.fn(),
    findByUserId: vi.fn(),
    findPage: vi.fn(),
  };
  const shifts: WorkShiftRepository = {
    replaceForDoctor: vi.fn().mockImplementation(async (_id: number, list: Shift[]) => list),
    findByDoctor: vi.fn().mockResolvedValue([shift(2, "08:00", "12:00")]),
  };
  return { service: new WorkScheduleService(doctors, shifts), shifts };
}

describe("WorkScheduleService.replace", () => {
  it("grava a escala e devolve os turnos enviados", async () => {
    const { service, shifts } = build();
    const input = { shifts: [shift(2, "08:00", "12:00"), shift(2, "14:00", "18:00", 20), shift(4, "08:00", "11:00")] };
    const result = await service.replace(3, input);
    expect(shifts.replaceForDoctor).toHaveBeenCalledWith(3, input.shifts);
    expect(result).toEqual(input);
  });

  it("aceita turnos encostados no mesmo dia (um termina quando o outro comeca)", async () => {
    const { service } = build();
    await expect(
      service.replace(3, { shifts: [shift(2, "08:00", "12:00"), shift(2, "12:00", "18:00")] }),
    ).resolves.toBeDefined();
  });

  it("recusa turnos sobrepostos no mesmo dia, mesmo enviados fora de ordem", async () => {
    const { service, shifts } = build();
    await expect(
      service.replace(3, { shifts: [shift(2, "10:00", "14:00"), shift(2, "08:00", "11:00")] }),
    ).rejects.toMatchObject({ code: "DADOS_INVALIDOS" });
    expect(shifts.replaceForDoctor).not.toHaveBeenCalled();
  });

  it("aceita horarios iguais em dias da semana diferentes", async () => {
    const { service } = build();
    await expect(
      service.replace(3, { shifts: [shift(1, "08:00", "12:00"), shift(2, "08:00", "12:00")] }),
    ).resolves.toBeDefined();
  });

  it("aceita lista vazia, que apaga a escala", async () => {
    const { service, shifts } = build();
    expect(await service.replace(3, { shifts: [] })).toEqual({ shifts: [] });
    expect(shifts.replaceForDoctor).toHaveBeenCalledWith(3, []);
  });

  it("recusa medico inexistente com RECURSO_NAO_ENCONTRADO", async () => {
    const { service } = build(false);
    await expect(service.replace(99, { shifts: [] })).rejects.toMatchObject({
      code: "RECURSO_NAO_ENCONTRADO",
    });
  });
});

describe("WorkScheduleService.get", () => {
  it("devolve a escala do medico", async () => {
    const { service } = build();
    expect(await service.get(3)).toEqual({ shifts: [shift(2, "08:00", "12:00")] });
  });

  it("recusa medico inexistente", async () => {
    const { service } = build(false);
    await expect(service.get(99)).rejects.toMatchObject({ code: "RECURSO_NAO_ENCONTRADO" });
  });
});
