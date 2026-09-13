import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { adminRoutes } from "./adminRoutes";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/admin", adminRoutes);

export { routes };
