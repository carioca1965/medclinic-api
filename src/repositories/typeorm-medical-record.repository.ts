import { DataSource, Repository } from "typeorm";
import { MedicalRecord } from "../entities/medical-record.entity";
import { MedicalRecordPageQuery, MedicalRecordRepository } from "./medical-record.repository";

export class TypeOrmMedicalRecordRepository implements MedicalRecordRepository {
  private readonly repository: Repository<MedicalRecord>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MedicalRecord);
  }

  create(data: { patientId: number; doctorId: number; text: string }): Promise<MedicalRecord> {
    return this.repository.save(this.repository.create(data));
  }

  async findPage(query: MedicalRecordPageQuery): Promise<{ items: MedicalRecord[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      where: { patientId: query.patientId },
      order: { createdAt: "DESC", id: "DESC" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { items, total };
  }
}
