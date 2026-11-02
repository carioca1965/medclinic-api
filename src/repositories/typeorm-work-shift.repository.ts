import { DataSource, Repository } from "typeorm";
import { Shift } from "../dtos/work-schedule.dto";
import { WorkShift } from "../entities/work-shift.entity";
import { WorkShiftRepository } from "./work-shift.repository";

// O PostgreSQL devolve "08:00:00"; o contrato usa "HH:MM".
function toHourMinute(time: string): string {
  return time.slice(0, 5);
}

function toShift(row: WorkShift): Shift {
  return {
    weekDay: row.weekDay,
    startTime: toHourMinute(row.startTime),
    endTime: toHourMinute(row.endTime),
    slotDurationMinutes: row.slotDurationMinutes,
  };
}

export class TypeOrmWorkShiftRepository implements WorkShiftRepository {
  private readonly repository: Repository<WorkShift>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(WorkShift);
  }

  async replaceForDoctor(doctorId: number, shifts: Shift[]): Promise<Shift[]> {
    return this.dataSource.transaction(async (manager) => {
      await manager.delete(WorkShift, { doctorId });
      const rows = shifts.map((shift) => manager.create(WorkShift, { doctorId, ...shift }));
      const saved = await manager.save(rows);
      return saved.map(toShift);
    });
  }

  async findByDoctor(doctorId: number): Promise<Shift[]> {
    const rows = await this.repository.find({ where: { doctorId }, order: { id: "ASC" } });
    return rows.map(toShift);
  }
}
