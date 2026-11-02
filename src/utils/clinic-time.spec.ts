import { describe, expect, it } from "vitest";
import { addDays, clinicLocalToUtc, daysBetween, parseDateOnly, toClinicParts } from "./clinic-time";

describe("clinic-time", () => {
  it("converte um instante UTC para o relogio local da clinica (UTC-3)", () => {
    const parts = toClinicParts(new Date("2026-10-13T11:00:00.000Z"));
    expect(parts).toMatchObject({ hour: 8, minute: 0, weekDay: 2, day: 13 });
  });

  it("volta ao dia anterior quando a hora UTC passa da meia-noite local", () => {
    const parts = toClinicParts(new Date("2026-10-14T01:30:00.000Z"));
    expect(parts).toMatchObject({ day: 13, hour: 22, minute: 30 });
  });

  it("converte horario local da clinica em instante UTC", () => {
    expect(clinicLocalToUtc({ year: 2026, month: 10, day: 13 }, 8, 0).toISOString()).toBe(
      "2026-10-13T11:00:00.000Z",
    );
  });

  it("valida datas reais no formato YYYY-MM-DD", () => {
    expect(parseDateOnly("2026-10-12")).toEqual({ year: 2026, month: 10, day: 12 });
    expect(parseDateOnly("2026-02-31")).toBeNull();
    expect(parseDateOnly("12/10/2026")).toBeNull();
  });

  it("soma dias e conta a distancia entre datas", () => {
    expect(addDays({ year: 2026, month: 10, day: 31 }, 1)).toEqual({ year: 2026, month: 11, day: 1 });
    expect(daysBetween({ year: 2026, month: 10, day: 1 }, { year: 2026, month: 10, day: 12 })).toBe(11);
  });
});
