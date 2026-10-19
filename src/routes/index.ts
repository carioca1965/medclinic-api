import { RequestHandler, Router } from "express";
import { UserRole } from "../entities/user-role.enum";
import { authorize } from "../middlewares/authorize.middleware";
import { AuthController } from "../controllers/auth.controller";
import { HealthController } from "../controllers/health.controller";
import { UserController } from "../controllers/user.controller";

export interface RouterDeps {
  health: HealthController;
  auth: AuthController;
  user: UserController;
  authenticate: RequestHandler;
}

export function buildRouter(deps: RouterDeps): Router {
  const router = Router();

  router.get("/health", deps.health.check);
  router.post("/auth/login", deps.auth.login);

  router.get("/users/me", deps.authenticate, deps.user.me);
  router.post("/users", deps.authenticate, authorize(UserRole.ADMIN), deps.user.create);

  return router;
}
