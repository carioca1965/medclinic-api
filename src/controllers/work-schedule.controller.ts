import { Request, Response } from "express";
import { idParamSchema } from "../dtos/common.dto";
import { replaceWorkScheduleSchema } from "../dtos/work-schedule.dto";
import { WorkScheduleService } from "../services/work-schedule.service";

export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  replace = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceWorkScheduleSchema.parse(req.body ?? {});
    res.status(200).json(await this.workScheduleService.replace(id, input));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json(await this.workScheduleService.get(id));
  };
}
