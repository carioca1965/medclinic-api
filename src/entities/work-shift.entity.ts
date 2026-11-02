import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Doctor } from "./doctor.entity";

// Um turno da escala: dia da semana (0 = domingo) e horario local da clinica
// (America/Sao_Paulo), sem data e sem fuso (RN06).
@Entity("work_shifts")
@Index("IDX_work_shifts_doctor_id", ["doctorId"])
export class WorkShift {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "doctor_id", type: "int" })
  doctorId!: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "doctor_id", foreignKeyConstraintName: "FK_work_shifts_doctor_id" })
  doctor?: Doctor;

  @Column({ name: "week_day", type: "smallint" })
  weekDay!: number;

  @Column({ name: "start_time", type: "time" })
  startTime!: string;

  @Column({ name: "end_time", type: "time" })
  endTime!: string;

  @Column({ name: "slot_duration_minutes", type: "int" })
  slotDurationMinutes!: number;
}
