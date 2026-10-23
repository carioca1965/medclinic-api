import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1761100000000 implements MigrationInterface {
  name = "CreateUsers1761100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password" character varying NOT NULL,
        "roles" text array NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
