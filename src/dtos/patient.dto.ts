import { z } from "zod";
import { Patient } from "../entities/patient.entity";
import { paginationSchema } from "./common.dto";

export const createPatientSchema = z.object({
  name: z.string().trim().min(1),
  cpf: z.string().regex(/^\d{11}$/),
});

export const updatePatientSchema = z.object({
  name: z.string().trim().min(1),
});

export const listPatientsSchema = paginationSchema.extend({
  name: z.string().trim().min(1).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsInput = z.infer<typeof listPatientsSchema>;

export interface PatientResponse {
  id: number;
  name: string;
  cpf: string;
  createdAt: Date;
}

export function toPatientResponse(patient: Patient): PatientResponse {
  return { id: patient.id, name: patient.name, cpf: patient.cpf, createdAt: patient.createdAt };
}
