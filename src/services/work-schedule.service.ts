import { ReplaceWorkScheduleInput, Shift, WorkScheduleResponse } from "../dtos/work-schedule.dto";
import { DomainError } from "../errors/domain-error";
import { DoctorRepository } from "../repositories/doctor.repository";
import { WorkShiftRepository } from "../repositories/work-shift.repository";

export class WorkScheduleService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly shifts: WorkShiftRepository,
  ) {}

  async replace(doctorId: number, input: ReplaceWorkScheduleInput): Promise<WorkScheduleResponse> {
    await this.ensureDoctorExists(doctorId);
    if (this.hasOverlap(input.shifts)) {
      throw new DomainError("DADOS_INVALIDOS", "Turnos do mesmo dia da semana nao podem se sobrepor.");
    }
    return { shifts: await this.shifts.replaceForDoctor(doctorId, input.shifts) };
  }

  async get(doctorId: number): Promise<WorkScheduleResponse> {
    await this.ensureDoctorExists(doctorId);
    return { shifts: await this.shifts.findByDoctor(doctorId) };
  }

  private async ensureDoctorExists(doctorId: number): Promise<void> {
    if (!(await this.doctors.findById(doctorId))) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Medico nao encontrado.");
    }
  }

  // RN05: turnos do mesmo dia nao se sobrepoem; turnos encostados sao validos.
  private hasOverlap(shifts: Shift[]): boolean {
    const byDay = new Map<number, Shift[]>();
    for (const shift of shifts) {
      byDay.set(shift.weekDay, [...(byDay.get(shift.weekDay) ?? []), shift]);
    }
    for (const dayShifts of byDay.values()) {
      const ordered = [...dayShifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].startTime < ordered[i - 1].endTime) {
          return true;
        }
      }
    }
    return false;
  }
}
