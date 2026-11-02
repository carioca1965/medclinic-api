import { z } from "zod";
import { MedicalRecord } from "../entities/medical-record.entity";

// Qualquer doctorId enviado no corpo e descartado: o autor vem do token.
export const createMedicalRecordSchema = z.object({
  text: z.string().trim().min(1),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;

export interface MedicalRecordResponse {
  id: number;
  patientId: number;
  doctorId: number;
  text: string;
  createdAt: Date;
}

export function toMedicalRecordResponse(record: MedicalRecord): MedicalRecordResponse {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    text: record.text,
    createdAt: record.createdAt,
  };
}
