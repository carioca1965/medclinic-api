import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 5432),
    username: required("DB_USERNAME"),
    password: required("DB_PASSWORD"),
    database: required("DB_DATABASE"),
    ssl: process.env.DB_SSL === "true",
  },
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
};
