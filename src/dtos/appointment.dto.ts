import { z } from "zod";
import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";
import { parseDateOnly } from "../utils/clinic-time";
import { paginationSchema } from "./common.dto";

const dateOnly = z.string().refine((value) => parseDateOnly(value) !== null);

export const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  patientId: z.number().int().positive(),
  startsAt: z.string().datetime({ offset: true }),
});

export const listAppointmentsSchema = paginationSchema
  .extend({
    doctorId: z.coerce.number().int().positive().optional(),
    patientId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to);

export const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
});

export const calendarQuerySchema = z
  .object({ from: dateOnly, to: dateOnly })
  .refine((query) => query.from <= query.to);

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

export interface AppointmentResponse {
  id: number;
  doctorId: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
}

export interface CalendarAppointment {
  id: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
}

export function toAppointmentResponse(a: Appointment): AppointmentResponse {
  return {
    id: a.id,
    doctorId: a.doctorId,
    patientId: a.patientId,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
  };
}

export function toCalendarAppointment(a: Appointment): CalendarAppointment {
  return { id: a.id, patientId: a.patientId, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status };
}
