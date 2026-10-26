import { Patient } from "../entities/patient.entity";

export interface PatientPageQuery {
  name?: string;
  page: number;
  pageSize: number;
}

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface PatientRepository {
  create(data: { name: string; cpf: string }): Promise<Patient>;
  findById(id: number): Promise<Patient | null>;
  findByCpf(cpf: string): Promise<Patient | null>;
  findPage(query: PatientPageQuery): Promise<{ items: Patient[]; total: number }>;
  updateName(id: number, name: string): Promise<Patient>;
  remove(id: number): Promise<void>;
}
