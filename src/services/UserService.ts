import { UserRepository } from "../repositories/UserRepository";
import { UserResponseDTO } from "../utils/dtos/UserResponseDTO";
import { AppError } from "../utils/AppError";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getMe(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 400);
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      dataCriacao: user.dataCriacao,
    };
  }
}
