import "reflect-metadata";
import { join } from "path";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { Patient } from "../entities/patient.entity";
import { User } from "../entities/user.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [User, Patient],
  // .ts em desenvolvimento (src) e .js no build (dist).
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  // As migrations rodam sozinhas ao iniciar a aplicacao (tambem em producao).
  migrationsRun: true,
});
