import { LoginInput } from "../dtos/user.dto";
import { DomainError } from "../errors/domain-error";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";
import { TokenService } from "../security/token-service";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async login(input: LoginInput): Promise<{ accessToken: string }> {
    const user = await this.users.findByEmail(input.email);
    // Mesma resposta para e-mail inexistente e senha errada.
    const invalid = new DomainError("CREDENCIAIS_INVALIDAS", "E-mail ou senha incorretos.");
    if (!user) {
      throw invalid;
    }
    const matches = await this.hasher.compare(input.password, user.password);
    if (!matches) {
      throw invalid;
    }
    return { accessToken: this.tokens.sign({ userId: user.id, roles: user.roles }) };
  }
}
