import { Request, Response } from "express";
import { paginationSchema, idParamSchema } from "../dtos/common.dto";
import { createMedicalRecordSchema } from "../dtos/medical-record.dto";
import { MedicalRecordService } from "../services/medical-record.service";

export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const input = createMedicalRecordSchema.parse(req.body ?? {});
    const actor = { userId: req.user!.id, roles: req.user!.roles };
    res.status(201).json(await this.medicalRecordService.create(id, input, actor));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const page = paginationSchema.parse(req.query);
    const actor = { userId: req.user!.id, roles: req.user!.roles };
    res.status(200).json(await this.medicalRecordService.list(id, page, actor));
  };
}
