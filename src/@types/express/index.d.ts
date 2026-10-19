import { UserRole } from "../../entities/user-role.enum";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        roles: UserRole[];
      };
    }
  }
}

export {};
