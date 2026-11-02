import { Shift } from "../dtos/work-schedule.dto";

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface WorkShiftRepository {
  // Substitui a escala inteira do medico numa transacao (apaga e regrava).
  replaceForDoctor(doctorId: number, shifts: Shift[]): Promise<Shift[]>;
  findByDoctor(doctorId: number): Promise<Shift[]>;
}
