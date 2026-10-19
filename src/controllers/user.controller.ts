import { Request, Response } from "express";
import { createUserSchema } from "../dtos/user.dto";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createUserSchema.parse(req.body ?? {});
    res.status(201).json(await this.userService.create(input));
  };

  me = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.userService.getMe(req.user!.id));
  };
}
