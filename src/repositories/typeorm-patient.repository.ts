import { DataSource, QueryFailedError, Repository } from "typeorm";
import { Patient } from "../entities/patient.entity";
import { DomainError } from "../errors/domain-error";
import { PatientPageQuery, PatientRepository } from "./patient.repository";

const UNIQUE_VIOLATION = "23505";

// Escapa os curingas do LIKE para a busca por nome ser literal.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export class TypeOrmPatientRepository implements PatientRepository {
  private readonly repository: Repository<Patient>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Patient);
  }

  async create(data: { name: string; cpf: string }): Promise<Patient> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new DomainError("CPF_JA_CADASTRADO", "CPF ja cadastrado.");
      }
      throw error;
    }
  }

  findById(id: number): Promise<Patient | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { cpf } });
  }

  async findPage(query: PatientPageQuery): Promise<{ items: Patient[]; total: number }> {
    const builder = this.repository
      .createQueryBuilder("patient")
      .orderBy("patient.id", "ASC")
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    if (query.name) {
      builder.where("patient.name ILIKE :name", { name: `%${escapeLike(query.name)}%` });
    }
    const [items, total] = await builder.getManyAndCount();
    return { items, total };
  }

  async updateName(id: number, name: string): Promise<Patient> {
    await this.repository.update({ id }, { name });
    return (await this.findById(id)) as Patient;
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
