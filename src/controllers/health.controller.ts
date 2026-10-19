import { Request, Response } from "express";

export class HealthController {
  check = (_req: Request, res: Response): void => {
    res.status(200).json({ status: "ok" });
  };
}
