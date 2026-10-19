import express, { Application } from "express";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { buildRouter, RouterDeps } from "./routes";

export function createApp(deps: RouterDeps): Application {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", buildRouter(deps));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
