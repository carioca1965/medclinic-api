import { MedicalRecord } from "../entities/medical-record.entity";

export interface MedicalRecordPageQuery {
  patientId: number;
  page: number;
  pageSize: number;
}

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface MedicalRecordRepository {
  create(data: { patientId: number; doctorId: number; text: string }): Promise<MedicalRecord>;
  // Ordem decrescente de criacao.
  findPage(query: MedicalRecordPageQuery): Promise<{ items: MedicalRecord[]; total: number }>;
}
