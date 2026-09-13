import { Request, Response } from "express";

export class AdminController {
  ping = (req: Request, res: Response): void => {
    res.status(200).json({
      message: "Pong! Acesso de Administrador confirmado.",
    });
  };
}
