import { Request, Response } from "express";
import { idParamSchema } from "../dtos/common.dto";
import { createPatientSchema, listPatientsSchema, updatePatientSchema } from "../dtos/patient.dto";
import { PatientService } from "../services/patient.service";

export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createPatientSchema.parse(req.body ?? {});
    res.status(201).json(await this.patientService.create(input));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const input = listPatientsSchema.parse(req.query);
    res.status(200).json(await this.patientService.list(input));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json(await this.patientService.getById(id));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const input = updatePatientSchema.parse(req.body ?? {});
    res.status(200).json(await this.patientService.update(id, input));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    await this.patientService.remove(id);
    res.status(204).send();
  };
}
