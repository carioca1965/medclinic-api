import { z } from "zod";
import { Doctor } from "../entities/doctor.entity";
import { UserResponse, toUserResponse } from "./user.dto";
import { paginationSchema } from "./common.dto";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  crm: z.string().trim().min(1).max(30),
});

export const listDoctorsSchema = paginationSchema.extend({
  name: z.string().trim().min(1).optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type ListDoctorsInput = z.infer<typeof listDoctorsSchema>;

export interface DoctorResponse {
  id: number;
  crm: string;
  user: UserResponse;
}

export function toDoctorResponse(doctor: Doctor): DoctorResponse {
  return { id: doctor.id, crm: doctor.crm, user: toUserResponse(doctor.user) };
}
