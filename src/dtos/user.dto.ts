import { z } from "zod";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.enum";

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  roles: z.array(z.nativeEnum(UserRole)).min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

export function toUserResponse(user: User): UserResponse {
  return { id: user.id, name: user.name, email: user.email, roles: user.roles };
}
