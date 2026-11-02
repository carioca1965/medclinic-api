import { DataSource, EntityManager, In, Repository } from "typeorm";
import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";
import { Doctor } from "../entities/doctor.entity";
import { Patient } from "../entities/patient.entity";
import {
  AppointmentFilters,
  AppointmentRepository,
  AppointmentTransaction,
  NewAppointment,
} from "./appointment.repository";

class TypeOrmAppointmentTransaction implements AppointmentTransaction {
  constructor(private readonly manager: EntityManager) {}

  // Todas as consultas passam pelo EntityManager da transacao (e nao pelo repositorio
  // injetado), senao a leitura ocorreria fora do bloqueio.
  listActiveByDoctor(doctorId: number, from: Date, to: Date): Promise<Appointment[]> {
    return this.manager
      .getRepository(Appointment)
      .createQueryBuilder("a")
      .where("a.doctorId = :doctorId", { doctorId })
      .andWhere("a.status <> :cancelled", { cancelled: AppointmentStatus.CANCELLED })
      .andWhere("a.startsAt < :to AND a.endsAt > :from", { from, to })
      .getMany();
  }

  listActiveByPatient(patientId: number, from: Date, to: Date): Promise<Appointment[]> {
    return this.manager
      .getRepository(Appointment)
      .createQueryBuilder("a")
      .where("a.patientId = :patientId", { patientId })
      .andWhere("a.status <> :cancelled", { cancelled: AppointmentStatus.CANCELLED })
      .andWhere("a.startsAt < :to AND a.endsAt > :from", { from, to })
      .getMany();
  }

  insert(data: NewAppointment): Promise<Appointment> {
    return this.manager.save(this.manager.create(Appointment, data));
  }
}

export class TypeOrmAppointmentRepository implements AppointmentRepository {
  private readonly repository: Repository<Appointment>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Appointment);
  }

  async withLocks<T>(
    doctorId: number,
    patientId: number,
    work: (tx: AppointmentTransaction) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      // Trava a linha do medico (existe mesmo com a agenda vazia) e depois a do
      // paciente, sempre nessa ordem, para nao haver impasse entre transacoes.
      await manager
        .getRepository(Doctor)
        .createQueryBuilder("d")
        .setLock("pessimistic_write")
        .where("d.id = :id", { id: doctorId })
        .getOne();
      await manager
        .getRepository(Patient)
        .createQueryBuilder("p")
        .setLock("pessimistic_write")
        .where("p.id = :id", { id: patientId })
        .getOne();
      return work(new TypeOrmAppointmentTransaction(manager));
    });
  }

  findById(id: number): Promise<Appointment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findPage(filters: AppointmentFilters): Promise<{ items: Appointment[]; total: number }> {
    const builder = this.repository
      .createQueryBuilder("a")
      .orderBy("a.startsAt", "ASC")
      .addOrderBy("a.id", "ASC")
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize);
    if (filters.doctorId !== undefined) {
      builder.andWhere("a.doctorId = :doctorId", { doctorId: filters.doctorId });
    }
    if (filters.patientId !== undefined) {
      builder.andWhere("a.patientId = :patientId", { patientId: filters.patientId });
    }
    if (filters.status !== undefined) {
      builder.andWhere("a.status = :status", { status: filters.status });
    }
    if (filters.from) {
      builder.andWhere("a.startsAt >= :from", { from: filters.from });
    }
    if (filters.to) {
      builder.andWhere("a.startsAt < :to", { to: filters.to });
    }
    const [items, total] = await builder.getManyAndCount();
    return { items, total };
  }

  findActiveStartingBetween(doctorId: number, from: Date, to: Date): Promise<Appointment[]> {
    return this.repository
      .createQueryBuilder("a")
      .where("a.doctorId = :doctorId", { doctorId })
      .andWhere("a.status <> :cancelled", { cancelled: AppointmentStatus.CANCELLED })
      .andWhere("a.startsAt >= :from AND a.startsAt < :to", { from, to })
      .orderBy("a.startsAt", "ASC")
      .addOrderBy("a.id", "ASC")
      .getMany();
  }

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    await this.repository.update({ id }, { status });
    return (await this.findById(id)) as Appointment;
  }

  async hasCareLink(doctorId: number, patientId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { doctorId, patientId, status: In([AppointmentStatus.IN_PROGRESS, AppointmentStatus.DONE]) },
    });
    return count > 0;
  }
}
