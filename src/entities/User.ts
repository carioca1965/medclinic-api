import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { UserRole } from "./UserRole";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150, nullable: false })
  nome!: string;

  @Column({ type: "varchar", length: 150, unique: true, nullable: false })
  email!: string;

  @Column({ type: "varchar", nullable: false })
  senha!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.ATENDENTE,
  })
  role!: UserRole;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;
}
