import { UserRole } from "../entities/user-role.enum";

export interface TokenPayload {
  userId: number;
  roles: UserRole[];
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
