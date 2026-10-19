import { Request, Response } from "express";
import { loginSchema } from "../dtos/user.dto";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const input = loginSchema.parse(req.body ?? {});
    res.status(200).json(await this.authService.login(input));
  };
}
