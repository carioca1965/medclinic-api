import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Doctor } from "./doctor.entity";
import { Patient } from "./patient.entity";

@Entity("medical_records")
@Index("IDX_medical_records_patient_id", ["patientId"])
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "patient_id", type: "int" })
  patientId!: number;

  @ManyToOne(() => Patient, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "patient_id", foreignKeyConstraintName: "FK_medical_records_patient_id" })
  patient?: Patient;

  // O autor e sempre o medico autenticado, nunca um valor vindo do corpo (RF09).
  @Column({ name: "doctor_id", type: "int" })
  doctorId!: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "doctor_id", foreignKeyConstraintName: "FK_medical_records_doctor_id" })
  doctor?: Doctor;

  @Column({ type: "text" })
  text!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
