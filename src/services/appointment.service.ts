import { Paginated } from "../dtos/common.dto";
import {
  AppointmentResponse,
  CreateAppointmentInput,
  ListAppointmentsInput,
  toAppointmentResponse,
} from "../dtos/appointment.dto";
import { Shift } from "../dtos/work-schedule.dto";
import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";
import { UserRole } from "../entities/user-role.enum";
import { DomainError } from "../errors/domain-error";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { PatientRepository } from "../repositories/patient.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";
import { Actor } from "../security/actor";
import { addDays, clinicLocalToUtc, parseDateOnly, toClinicParts } from "../utils/clinic-time";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export interface Period {
  startsAt: Date;
  endsAt: Date;
}

// RN08/RN09: dois periodos se sobrepoem quando um comeca antes do outro terminar.
// A comparacao e estrita, entao periodos encostados nao conflitam.
export function periodsOverlap(a: Period, b: Period): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

interface Transition {
  from: AppointmentStatus;
  to: AppointmentStatus;
  admin: boolean;
  secretary: boolean;
  appointmentDoctor: boolean;
}

// RN11 e RN12: ciclo de vida e quem tem autoridade em cada transicao.
const TRANSITIONS: Transition[] = [
  { from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.IN_PROGRESS, admin: true, secretary: false, appointmentDoctor: true },
  { from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.CANCELLED, admin: true, secretary: true, appointmentDoctor: true },
  { from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.DONE, admin: true, secretary: false, appointmentDoctor: true },
  { from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.CANCELLED, admin: true, secretary: false, appointmentDoctor: true },
];

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export class AppointmentService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly patients: PatientRepository,
    private readonly shifts: WorkShiftRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async create(input: CreateAppointmentInput): Promise<AppointmentResponse> {
    const doctor = await this.doctors.findById(input.doctorId);
    const patient = await this.patients.findById(input.patientId);
    if (!doctor || !patient) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Medico ou paciente nao encontrado.");
    }

    const startsAt = new Date(input.startsAt);
    const slotMinutes = this.findSlotMinutes(await this.shifts.findByDoctor(doctor.id), startsAt);
    if (slotMinutes === null) {
      throw new DomainError("HORARIO_FORA_DA_ESCALA", "O horario nao existe na escala do medico.");
    }
    const period: Period = { startsAt, endsAt: new Date(startsAt.getTime() + slotMinutes * MINUTE_MS) };

    // Verificar e gravar dentro da mesma transacao, com as linhas travadas (RN10).
    const created = await this.appointments.withLocks(doctor.id, patient.id, async (tx) => {
      const from = new Date(period.startsAt.getTime() - DAY_MS);
      const to = new Date(period.endsAt.getTime() + DAY_MS);
      const doctorAppointments = await tx.listActiveByDoctor(doctor.id, from, to);
      if (doctorAppointments.some((existing) => periodsOverlap(existing, period))) {
        throw new DomainError("HORARIO_INDISPONIVEL", "Este horario acabou de ser ocupado.");
      }
      const patientAppointments = await tx.listActiveByPatient(patient.id, from, to);
      if (patientAppointments.some((existing) => periodsOverlap(existing, period))) {
        throw new DomainError("PACIENTE_INDISPONIVEL", "O paciente ja tem consulta neste periodo.");
      }
      return tx.insert({ doctorId: doctor.id, patientId: patient.id, ...period });
    });
    return toAppointmentResponse(created);
  }

  async getById(id: number, actor: Actor): Promise<AppointmentResponse> {
    const appointment = await this.findOrFail(id);
    const allowed =
      actor.roles.includes(UserRole.ADMIN) ||
      actor.roles.includes(UserRole.SECRETARY) ||
      (await this.isAppointmentDoctor(actor, appointment));
    if (!allowed) {
      throw new DomainError("ACESSO_NEGADO", "Voce nao tem acesso a este agendamento.");
    }
    return toAppointmentResponse(appointment);
  }

  async list(input: ListAppointmentsInput, actor: Actor): Promise<Paginated<AppointmentResponse>> {
    let doctorId = input.doctorId;
    // Medico (sem perfil admin) enxerga so as proprias consultas, seja qual for o filtro.
    if (actor.roles.includes(UserRole.DOCTOR) && !actor.roles.includes(UserRole.ADMIN)) {
      const own = await this.doctors.findByUserId(actor.userId);
      if (!own) {
        return { data: [], meta: { total: 0, page: input.page, pageSize: input.pageSize, totalPages: 0 } };
      }
      doctorId = own.id;
    }
    const { items, total } = await this.appointments.findPage({
      doctorId,
      patientId: input.patientId,
      status: input.status,
      from: input.from ? this.startOfClinicDay(input.from, 0) : undefined,
      to: input.to ? this.startOfClinicDay(input.to, 1) : undefined,
      page: input.page,
      pageSize: input.pageSize,
    });
    return {
      data: items.map(toAppointmentResponse),
      meta: { total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) },
    };
  }

  async updateStatus(id: number, status: AppointmentStatus, actor: Actor): Promise<AppointmentResponse> {
    const appointment = await this.findOrFail(id);
    const transition = TRANSITIONS.find((t) => t.from === appointment.status && t.to === status);
    if (!transition) {
      throw new DomainError("TRANSICAO_INVALIDA", "Esta mudanca de status nao e permitida.");
    }
    const allowed =
      (transition.admin && actor.roles.includes(UserRole.ADMIN)) ||
      (transition.secretary && actor.roles.includes(UserRole.SECRETARY)) ||
      (transition.appointmentDoctor && (await this.isAppointmentDoctor(actor, appointment)));
    if (!allowed) {
      throw new DomainError("ACESSO_NEGADO", "Seu perfil nao pode fazer esta mudanca de status.");
    }
    return toAppointmentResponse(await this.appointments.updateStatus(id, status));
  }

  private async findOrFail(id: number): Promise<Appointment> {
    const appointment = await this.appointments.findById(id);
    if (!appointment) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Agendamento nao encontrado.");
    }
    return appointment;
  }

  private async isAppointmentDoctor(actor: Actor, appointment: Appointment): Promise<boolean> {
    if (!actor.roles.includes(UserRole.DOCTOR)) {
      return false;
    }
    const own = await this.doctors.findByUserId(actor.userId);
    return own?.id === appointment.doctorId;
  }

  private startOfClinicDay(date: string, plusDays: number): Date {
    const day = parseDateOnly(date) as NonNullable<ReturnType<typeof parseDateOnly>>;
    return clinicLocalToUtc(addDays(day, plusDays));
  }

  // RN07: o horario precisa estar dentro de um turno, alinhado a grade e caber inteiro nele.
  // Devolve a duracao da consulta do turno, ou null se o horario nao existe na escala.
  private findSlotMinutes(shifts: Shift[], startsAt: Date): number | null {
    if (startsAt.getUTCSeconds() !== 0 || startsAt.getUTCMilliseconds() !== 0) {
      return null;
    }
    const local = toClinicParts(startsAt);
    const startMinutes = local.hour * 60 + local.minute;
    for (const shift of shifts) {
      if (shift.weekDay !== local.weekDay) {
        continue;
      }
      const offset = startMinutes - toMinutes(shift.startTime);
      const fits = startMinutes + shift.slotDurationMinutes <= toMinutes(shift.endTime);
      if (offset >= 0 && offset % shift.slotDurationMinutes === 0 && fits) {
        return shift.slotDurationMinutes;
      }
    }
    return null;
  }
}
