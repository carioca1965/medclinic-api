// Horario local da clinica (America/Sao_Paulo). Toda conversao entre instante (UTC)
// e relogio de parede da clinica passa por aqui (RN06, RP05).
const TIME_ZONE = "America/Sao_Paulo";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export interface ClinicParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekDay: number; // 0 = domingo
}

export interface DateOnly {
  year: number;
  month: number;
  day: number;
}

export function toClinicParts(date: Date): ClinicParts {
  const values: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour) % 24,
    minute: Number(values.minute),
    second: Number(values.second),
    weekDay: WEEKDAYS[values.weekday],
  };
}

function offsetMs(date: Date): number {
  const p = toClinicParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// Converte um horario de parede da clinica no instante UTC correspondente.
export function clinicLocalToUtc(day: DateOnly, hour = 0, minute = 0): Date {
  const guess = Date.UTC(day.year, day.month - 1, day.day, hour, minute);
  const first = guess - offsetMs(new Date(guess));
  const second = guess - offsetMs(new Date(first));
  return new Date(second);
}

export function addDays(day: DateOnly, amount: number): DateOnly {
  const moved = new Date(Date.UTC(day.year, day.month - 1, day.day + amount));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: moved.getUTCDate() };
}

// Aceita somente YYYY-MM-DD com data real (rejeita 2026-02-31).
export function parseDateOnly(value: string): DateOnly | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const day = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(day.year, day.month - 1, day.day));
  const valid =
    check.getUTCFullYear() === day.year &&
    check.getUTCMonth() === day.month - 1 &&
    check.getUTCDate() === day.day;
  return valid ? day : null;
}

export function daysBetween(from: DateOnly, to: DateOnly): number {
  const ms = Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day);
  return Math.round(ms / 86_400_000);
}
