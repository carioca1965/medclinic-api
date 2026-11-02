import { RequestHandler, Router } from "express";
import { UserRole } from "../entities/user-role.enum";
import { authorize } from "../middlewares/authorize.middleware";
import { AuthController } from "../controllers/auth.controller";
import { AppointmentController } from "../controllers/appointment.controller";
import { CalendarController } from "../controllers/calendar.controller";
import { MedicalRecordController } from "../controllers/medical-record.controller";
import { DoctorController } from "../controllers/doctor.controller";
import { HealthController } from "../controllers/health.controller";
import { WorkScheduleController } from "../controllers/work-schedule.controller";
import { PatientController } from "../controllers/patient.controller";
import { UserController } from "../controllers/user.controller";

export interface RouterDeps {
  health: HealthController;
  auth: AuthController;
  user: UserController;
  patient: PatientController;
  doctor: DoctorController;
  workSchedule: WorkScheduleController;
  calendar: CalendarController;
  appointment: AppointmentController;
  medicalRecord: MedicalRecordController;
  authenticate: RequestHandler;
}

export function buildRouter(deps: RouterDeps): Router {
  const router = Router();

  router.get("/health", deps.health.check);
  router.post("/auth/login", deps.auth.login);

  router.get("/users/me", deps.authenticate, deps.user.me);
  router.post("/users", deps.authenticate, authorize(UserRole.ADMIN), deps.user.create);

  router.post("/patients", deps.authenticate, authorize(UserRole.ADMIN, UserRole.SECRETARY), deps.patient.create);
  router.get("/patients", deps.authenticate, deps.patient.list);
  router.get("/patients/:id", deps.authenticate, deps.patient.get);
  router.patch("/patients/:id", deps.authenticate, authorize(UserRole.ADMIN, UserRole.SECRETARY), deps.patient.update);
  router.delete("/patients/:id", deps.authenticate, authorize(UserRole.ADMIN), deps.patient.remove);

  router.post("/doctors", deps.authenticate, authorize(UserRole.ADMIN), deps.doctor.create);
  router.get("/doctors", deps.authenticate, deps.doctor.list);
  router.get("/doctors/:id", deps.authenticate, deps.doctor.get);

  router.put("/doctors/:id/work-schedule", deps.authenticate, authorize(UserRole.ADMIN), deps.workSchedule.replace);
  router.get("/doctors/:id/work-schedule", deps.authenticate, deps.workSchedule.get);

  router.get("/doctors/:id/calendar", deps.authenticate, deps.calendar.get);

  router.post("/appointments", deps.authenticate, authorize(UserRole.ADMIN, UserRole.SECRETARY), deps.appointment.create);
  router.get("/appointments", deps.authenticate, deps.appointment.list);
  router.get("/appointments/:id", deps.authenticate, deps.appointment.get);
  router.patch("/appointments/:id/status", deps.authenticate, deps.appointment.updateStatus);

  router.post("/patients/:id/medical-records", deps.authenticate, authorize(UserRole.DOCTOR), deps.medicalRecord.create);
  router.get("/patients/:id/medical-records", deps.authenticate, authorize(UserRole.DOCTOR, UserRole.ADMIN), deps.medicalRecord.list);

  return router;
}
