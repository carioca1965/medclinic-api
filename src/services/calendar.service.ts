import { CalendarAppointment, CalendarQuery, toCalendarAppointment } from "../dtos/appointment.dto";
import { WorkScheduleResponse } from "../dtos/work-schedule.dto";
import { DomainError } from "../errors/domain-error";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";
import { addDays, clinicLocalToUtc, daysBetween, parseDateOnly } from "../utils/clinic-time";

const MAX_RANGE_DAYS = 31;

export interface CalendarResponse {
  workSchedule: WorkScheduleResponse;
  appointments: CalendarAppointment[];
}

// RF05: entrega a escala e as consultas ativas do periodo. Quem monta a grade de
// horarios livres e o front-end.
export class CalendarService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly shifts: WorkShiftRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async get(doctorId: number, query: CalendarQuery): Promise<CalendarResponse> {
    const from = parseDateOnly(query.from) as NonNullable<ReturnType<typeof parseDateOnly>>;
    const to = parseDateOnly(query.to) as NonNullable<ReturnType<typeof parseDateOnly>>;
    if (daysBetween(from, to) > MAX_RANGE_DAYS) {
      throw new DomainError("DADOS_INVALIDOS", "O periodo nao pode passar de 31 dias.");
    }
    if (!(await this.doctors.findById(doctorId))) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Medico nao encontrado.");
    }
    // Periodo inclusivo nas duas pontas, considerando o dia inteiro no horario local.
    const start = clinicLocalToUtc(from);
    const end = clinicLocalToUtc(addDays(to, 1));
    const [shifts, appointments] = await Promise.all([
      this.shifts.findByDoctor(doctorId),
      this.appointments.findActiveStartingBetween(doctorId, start, end),
    ]);
    return { workSchedule: { shifts }, appointments: appointments.map(toCalendarAppointment) };
  }
}
