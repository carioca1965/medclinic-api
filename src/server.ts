import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AuthController } from "./controllers/auth.controller";
import { HealthController } from "./controllers/health.controller";
import { PatientController } from "./controllers/patient.controller";
import { UserController } from "./controllers/user.controller";
import { AppDataSource } from "./database/data-source";
import { authenticate } from "./middlewares/authenticate.middleware";
import { TypeOrmPatientRepository } from "./repositories/typeorm-patient.repository";
import { TypeOrmUserRepository } from "./repositories/typeorm-user.repository";
import { BcryptPasswordHasher } from "./security/bcrypt-password-hasher";
import { JwtTokenService } from "./security/jwt-token-service";
import { AuthService } from "./services/auth.service";
import { PatientService } from "./services/patient.service";
import { UserService } from "./services/user.service";

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  console.log("Conexao com o PostgreSQL estabelecida.");

  // Raiz de composicao: unico lugar que monta as dependencias.
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(env.jwt.secret, env.jwt.expiresIn);
  const userRepository = new TypeOrmUserRepository(AppDataSource);

  const app = createApp({
    health: new HealthController(),
    auth: new AuthController(new AuthService(userRepository, hasher, tokens)),
    user: new UserController(new UserService(userRepository, hasher)),
    patient: new PatientController(new PatientService(new TypeOrmPatientRepository(AppDataSource))),
    authenticate: authenticate(tokens),
  });

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`MedClinic API ouvindo na porta ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar a aplicacao:", error);
  process.exit(1);
});
