import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { User } from "../entities/user.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  // Temporario: as migrations entram no proximo PR e o synchronize sai.
  synchronize: true,
  entities: [User],
});
