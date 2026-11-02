import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AuthController } from "./controllers/auth.controller";
import { AppointmentController } from "./controllers/appointment.controller";
import { CalendarController } from "./controllers/calendar.controller";
import { MedicalRecordController } from "./controllers/medical-record.controller";
import { DoctorController } from "./controllers/doctor.controller";
import { HealthController } from "./controllers/health.controller";
import { WorkScheduleController } from "./controllers/work-schedule.controller";
import { PatientController } from "./controllers/patient.controller";
import { UserController } from "./controllers/user.controller";
import { AppDataSource } from "./database/data-source";
import { authenticate } from "./middlewares/authenticate.middleware";
import { TypeOrmAppointmentRepository } from "./repositories/typeorm-appointment.repository";
import { TypeOrmMedicalRecordRepository } from "./repositories/typeorm-medical-record.repository";
import { TypeOrmDoctorRepository } from "./repositories/typeorm-doctor.repository";
import { TypeOrmWorkShiftRepository } from "./repositories/typeorm-work-shift.repository";
import { TypeOrmPatientRepository } from "./repositories/typeorm-patient.repository";
import { TypeOrmUserRepository } from "./repositories/typeorm-user.repository";
import { BcryptPasswordHasher } from "./security/bcrypt-password-hasher";
import { JwtTokenService } from "./security/jwt-token-service";
import { AuthService } from "./services/auth.service";
import { AppointmentService } from "./services/appointment.service";
import { CalendarService } from "./services/calendar.service";
import { MedicalRecordService } from "./services/medical-record.service";
import { DoctorService } from "./services/doctor.service";
import { WorkScheduleService } from "./services/work-schedule.service";
import { PatientService } from "./services/patient.service";
import { UserService } from "./services/user.service";

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  console.log("Conexao com o PostgreSQL estabelecida.");

  // Raiz de composicao: unico lugar que monta as dependencias.
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(env.jwt.secret, env.jwt.expiresIn);
  const userRepository = new TypeOrmUserRepository(AppDataSource);
  const doctorRepository = new TypeOrmDoctorRepository(AppDataSource);
  const patientRepository = new TypeOrmPatientRepository(AppDataSource);
  const workShiftRepository = new TypeOrmWorkShiftRepository(AppDataSource);
  const appointmentRepository = new TypeOrmAppointmentRepository(AppDataSource);
  const medicalRecordRepository = new TypeOrmMedicalRecordRepository(AppDataSource);

  const app = createApp({
    health: new HealthController(),
    auth: new AuthController(new AuthService(userRepository, hasher, tokens)),
    user: new UserController(new UserService(userRepository, hasher)),
    patient: new PatientController(new PatientService(patientRepository)),
    doctor: new DoctorController(new DoctorService(userRepository, doctorRepository, hasher)),
    workSchedule: new WorkScheduleController(
      new WorkScheduleService(doctorRepository, workShiftRepository),
    ),
    calendar: new CalendarController(new CalendarService(doctorRepository, workShiftRepository, appointmentRepository)),
    appointment: new AppointmentController(
      new AppointmentService(doctorRepository, patientRepository, workShiftRepository, appointmentRepository),
    ),
    medicalRecord: new MedicalRecordController(
      new MedicalRecordService(doctorRepository, patientRepository, appointmentRepository, medicalRecordRepository),
    ),
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
