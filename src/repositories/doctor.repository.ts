import { Doctor } from "../entities/doctor.entity";

export interface NewDoctor {
  name: string;
  email: string;
  password: string;
  crm: string;
}

export interface DoctorPageQuery {
  name?: string;
  page: number;
  pageSize: number;
}

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface DoctorRepository {
  // Cria o usuario (perfil doctor) e o medico na mesma transacao.
  createWithUser(data: NewDoctor): Promise<Doctor>;
  findById(id: number): Promise<Doctor | null>;
  findByCrm(crm: string): Promise<Doctor | null>;
  findPage(query: DoctorPageQuery): Promise<{ items: Doctor[]; total: number }>;
}
