import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class PasswordUtil {
  static async hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, SALT_ROUNDS);
  }

  static async compare(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
