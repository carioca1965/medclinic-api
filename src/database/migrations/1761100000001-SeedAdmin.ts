import { MigrationInterface, QueryRunner } from "typeorm";
import { BcryptPasswordHasher } from "../../security/bcrypt-password-hasher";

// Cria o primeiro administrador a partir de variaveis de ambiente (RP07).
export class SeedAdmin1761100000001 implements MigrationInterface {
  name = "SeedAdmin1761100000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME ?? "Administrador";
    if (!email || !password) {
      throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.");
    }
    const hash = await new BcryptPasswordHasher().hash(password);
    await queryRunner.query(
      `INSERT INTO "users" ("name", "email", "password", "roles")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("email") DO NOTHING`,
      [name, email, hash, ["admin"]],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [process.env.ADMIN_EMAIL]);
  }
}
