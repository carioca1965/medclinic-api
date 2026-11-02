import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkShifts1761400000000 implements MigrationInterface {
  name = "CreateWorkShifts1761400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_shifts" (
        "id" SERIAL NOT NULL,
        "doctor_id" integer NOT NULL,
        "week_day" smallint NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "slot_duration_minutes" integer NOT NULL,
        CONSTRAINT "PK_30826a4f3460a48369193453043" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_work_shifts_doctor_id" ON "work_shifts" ("doctor_id")`);
    await queryRunner.query(`
      ALTER TABLE "work_shifts" ADD CONSTRAINT "FK_work_shifts_doctor_id"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_shifts" DROP CONSTRAINT "FK_work_shifts_doctor_id"`);
    await queryRunner.query(`DROP INDEX "IDX_work_shifts_doctor_id"`);
    await queryRunner.query(`DROP TABLE "work_shifts"`);
  }
}
