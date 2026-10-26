import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatients1761200000000 implements MigrationInterface {
  name = "CreatePatients1761200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "cpf" character varying(11) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_patients_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_patients_cpf_active" ON "patients" ("cpf") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_patients_cpf_active"`);
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
