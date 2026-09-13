import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { RegisterUserDTO } from "../utils/dtos/RegisterUserDTO";
import { LoginUserDTO } from "../utils/dtos/LoginUserDTO";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: RegisterUserDTO = req.body;
      const user = await this.authService.register(data);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: LoginUserDTO = req.body;
      const result = await this.authService.login(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
