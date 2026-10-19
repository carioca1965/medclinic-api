import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "./user-role.enum";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email!: string;

  @Column({ type: "varchar" })
  password!: string;

  @Column({ type: "text", array: true })
  roles!: UserRole[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
