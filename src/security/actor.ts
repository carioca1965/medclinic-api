import { UserRole } from "../entities/user-role.enum";

// Quem esta chamando a API (vem do token).
export interface Actor {
  userId: number;
  roles: UserRole[];
}
