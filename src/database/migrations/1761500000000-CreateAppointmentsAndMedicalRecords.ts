import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentsAndMedicalRecords1761500000000 implements MigrationInterface {
  name = "CreateAppointmentsAndMedicalRecords1761500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" SERIAL NOT NULL,
        "doctor_id" integer NOT NULL,
        "patient_id" integer NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'scheduled',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_patient_starts_at" ON "appointments" ("patient_id", "starts_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_doctor_starts_at" ON "appointments" ("doctor_id", "starts_at")`);
    await queryRunner.query(`
      CREATE TABLE "medical_records" (
        "id" SERIAL NOT NULL,
        "patient_id" integer NOT NULL,
        "doctor_id" integer NOT NULL,
        "text" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_c200c0b76638124b7ed51424823" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_medical_records_patient_id" ON "medical_records" ("patient_id")`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_medical_records_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_medical_records_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_medical_records_doctor_id"`);
    await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_medical_records_patient_id"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_patient_id"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_doctor_id"`);
    await queryRunner.query(`DROP INDEX "IDX_medical_records_patient_id"`);
    await queryRunner.query(`DROP TABLE "medical_records"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_doctor_starts_at"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_patient_starts_at"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
  }
}
