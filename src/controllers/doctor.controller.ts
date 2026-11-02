import { Request, Response } from "express";
import { idParamSchema } from "../dtos/common.dto";
import { createDoctorSchema, listDoctorsSchema } from "../dtos/doctor.dto";
import { DoctorService } from "../services/doctor.service";

export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createDoctorSchema.parse(req.body ?? {});
    res.status(201).json(await this.doctorService.create(input));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const input = listDoctorsSchema.parse(req.query);
    res.status(200).json(await this.doctorService.list(input));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json(await this.doctorService.getById(id));
  };
}
