import { UserRepository } from "../repositories/UserRepository";
import { RegisterUserDTO } from "../utils/dtos/RegisterUserDTO";
import { LoginUserDTO } from "../utils/dtos/LoginUserDTO";
import { UserResponseDTO } from "../utils/dtos/UserResponseDTO";
import { PasswordUtil } from "../utils/PasswordUtil";
import { JwtUtil } from "../utils/JwtUtil";
import { AppError } from "../utils/AppError";
import { UserRole } from "../entities/UserRole";
import { User } from "../entities/User";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private toResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      dataCriacao: user.dataCriacao,
    };
  }

  async register(data: RegisterUserDTO): Promise<UserResponseDTO> {
    const { nome, email, senha } = data;

    if (!nome || !email || !senha) {
      throw new AppError("Nome, e-mail e senha são obrigatórios.", 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Formato de e-mail inválido.", 400);
    }

    if (senha.length < 6) {
      throw new AppError("A senha deve ter no mínimo 6 caracteres.", 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Este e-mail já está cadastrado.", 409);
    }

    const hashedPassword = await PasswordUtil.hash(senha);

    const newUser = await this.userRepository.create({
      nome,
      email,
      senha: hashedPassword,
      role: UserRole.ATENDENTE,
    });

    return this.toResponseDTO(newUser);
  }

  async login(data: LoginUserDTO): Promise<{ token: string }> {
    const { email, senha } = data;

    if (!email || !senha) {
      throw new AppError("E-mail e senha são obrigatórios.", 400);
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const isPasswordValid = await PasswordUtil.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const token = JwtUtil.generateToken({ id: user.id, role: user.role });

    return { token };
  }
}
