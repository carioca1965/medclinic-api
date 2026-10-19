import { DataSource, QueryFailedError, Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { DomainError } from "../errors/domain-error";
import { NewUser, UserRepository } from "./user.repository";

const UNIQUE_VIOLATION = "23505";

export class TypeOrmUserRepository implements UserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: NewUser): Promise<User> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new DomainError("EMAIL_JA_CADASTRADO", "E-mail ja cadastrado.");
      }
      throw error;
    }
  }
}
