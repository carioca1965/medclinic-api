import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const shiftSchema = z
  .object({
    weekDay: z.number().int().min(0).max(6),
    startTime: time,
    endTime: time,
    slotDurationMinutes: z.number().int().positive(),
  })
  .refine((shift) => shift.startTime < shift.endTime);

export const replaceWorkScheduleSchema = z.object({
  shifts: z.array(shiftSchema),
});

export type Shift = z.infer<typeof shiftSchema>;
export type ReplaceWorkScheduleInput = z.infer<typeof replaceWorkScheduleSchema>;

export interface WorkScheduleResponse {
  shifts: Shift[];
}
