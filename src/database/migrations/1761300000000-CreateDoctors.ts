import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDoctors1761300000000 implements MigrationInterface {
  name = "CreateDoctors1761300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctors" (
        "id" SERIAL NOT NULL,
        "crm" character varying(30) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        CONSTRAINT "UQ_doctors_crm" UNIQUE ("crm"),
        CONSTRAINT "REL_653c27d1b10652eb0c7bbbc442" UNIQUE ("user_id"),
        CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "doctors" ADD CONSTRAINT "FK_doctors_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_doctors_user_id"`);
    await queryRunner.query(`DROP TABLE "doctors"`);
  }
}
