import { DataSource, QueryFailedError, Repository } from "typeorm";
import { Doctor } from "../entities/doctor.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";
import { DomainError } from "../errors/domain-error";
import { DoctorPageQuery, DoctorRepository, NewDoctor } from "./doctor.repository";

const UNIQUE_VIOLATION = "23505";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export class TypeOrmDoctorRepository implements DoctorRepository {
  private readonly repository: Repository<Doctor>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Doctor);
  }

  async createWithUser(data: NewDoctor): Promise<Doctor> {
    try {
      // Uma transacao: se qualquer gravacao falhar, nenhuma das duas fica.
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            name: data.name,
            email: data.email,
            password: data.password,
            roles: [UserRole.DOCTOR],
          }),
        );
        return manager.save(manager.create(Doctor, { crm: data.crm, user }));
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driver = error.driverError as { code?: string; constraint?: string };
        if (driver.code === UNIQUE_VIOLATION) {
          if (driver.constraint === "UQ_doctors_crm") {
            throw new DomainError("CRM_JA_CADASTRADO", "CRM ja cadastrado.");
          }
          throw new DomainError("EMAIL_JA_CADASTRADO", "E-mail ja cadastrado.");
        }
      }
      throw error;
    }
  }

  findById(id: number): Promise<Doctor | null> {
    return this.repository.findOne({ where: { id }, relations: { user: true } });
  }

  findByCrm(crm: string): Promise<Doctor | null> {
    return this.repository.findOne({ where: { crm }, relations: { user: true } });
  }

  async findPage(query: DoctorPageQuery): Promise<{ items: Doctor[]; total: number }> {
    const builder = this.repository
      .createQueryBuilder("doctor")
      .innerJoinAndSelect("doctor.user", "user")
      .orderBy("doctor.id", "ASC")
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    if (query.name) {
      builder.where("user.name ILIKE :name", { name: `%${escapeLike(query.name)}%` });
    }
    const [items, total] = await builder.getManyAndCount();
    return { items, total };
  }
}
