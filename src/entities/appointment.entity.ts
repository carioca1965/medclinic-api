import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AppointmentStatus } from "./appointment-status.enum";
import { Doctor } from "./doctor.entity";
import { Patient } from "./patient.entity";

// O fim (ends_at) e gravado no agendamento: mudar a escala depois nao altera
// consultas ja marcadas (RN15).
@Entity("appointments")
@Index("IDX_appointments_doctor_starts_at", ["doctorId", "startsAt"])
@Index("IDX_appointments_patient_starts_at", ["patientId", "startsAt"])
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "doctor_id", type: "int" })
  doctorId!: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "doctor_id", foreignKeyConstraintName: "FK_appointments_doctor_id" })
  doctor?: Doctor;

  @Column({ name: "patient_id", type: "int" })
  patientId!: number;

  @ManyToOne(() => Patient, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "patient_id", foreignKeyConstraintName: "FK_appointments_patient_id" })
  patient?: Patient;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ name: "ends_at", type: "timestamptz" })
  endsAt!: Date;

  @Column({ type: "varchar", length: 20, default: AppointmentStatus.SCHEDULED })
  status!: AppointmentStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
