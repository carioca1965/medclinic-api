import { CreateUserInput, UserResponse, toUserResponse } from "../dtos/user.dto";
import { DomainError } from "../errors/domain-error";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async create(input: CreateUserInput): Promise<UserResponse> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new DomainError("EMAIL_JA_CADASTRADO", "E-mail ja cadastrado.");
    }
    const password = await this.hasher.hash(input.password);
    const user = await this.users.create({ ...input, password });
    return toUserResponse(user);
  }

  async getMe(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new DomainError("NAO_AUTENTICADO", "Usuario do token nao existe mais.");
    }
    return toUserResponse(user);
  }
}
