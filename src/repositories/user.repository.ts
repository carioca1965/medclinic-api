import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";

export interface NewUser {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
}

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(data: NewUser): Promise<User>;
}
