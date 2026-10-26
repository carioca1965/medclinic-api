import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

// CPF unico entre pacientes ativos: a remocao e logica (deleted_at), e o CPF
// de um paciente removido pode ser cadastrado de novo.
@Entity("patients")
@Index("UQ_patients_cpf_active", ["cpf"], { unique: true, where: '"deleted_at" IS NULL' })
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 11 })
  cpf!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
  deletedAt?: Date | null;
}
