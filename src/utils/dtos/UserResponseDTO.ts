import { UserRole } from "../../entities/UserRole";

export interface UserResponseDTO {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  dataCriacao: Date;
}
