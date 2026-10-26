import { RequestHandler, Router } from "express";
import { UserRole } from "../entities/user-role.enum";
import { authorize } from "../middlewares/authorize.middleware";
import { AuthController } from "../controllers/auth.controller";
import { HealthController } from "../controllers/health.controller";
import { PatientController } from "../controllers/patient.controller";
import { UserController } from "../controllers/user.controller";

export interface RouterDeps {
  health: HealthController;
  auth: AuthController;
  user: UserController;
  patient: PatientController;
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

  return router;
}
