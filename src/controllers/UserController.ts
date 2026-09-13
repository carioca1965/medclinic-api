import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { AppError } from "../utils/AppError";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado.", 401);
      }
      const user = await this.userService.getMe(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
}
