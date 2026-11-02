import { RequestHandler, Router } from "express";
import { UserRole } from "../entities/user-role.enum";
import { authorize } from "../middlewares/authorize.middleware";
import { AuthController } from "../controllers/auth.controller";
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

  return router;
}
