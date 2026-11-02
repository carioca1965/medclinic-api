import { Request, Response } from "express";
import {
  createAppointmentSchema,
  listAppointmentsSchema,
  updateStatusSchema,
} from "../dtos/appointment.dto";
import { idParamSchema } from "../dtos/common.dto";
import { AppointmentService } from "../services/appointment.service";

export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createAppointmentSchema.parse(req.body ?? {});
    res.status(201).json(await this.appointmentService.create(input));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const input = listAppointmentsSchema.parse(req.query);
    const actor = { userId: req.user!.id, roles: req.user!.roles };
    res.status(200).json(await this.appointmentService.list(input, actor));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const actor = { userId: req.user!.id, roles: req.user!.roles };
    res.status(200).json(await this.appointmentService.getById(id, actor));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const { status } = updateStatusSchema.parse(req.body ?? {});
    const actor = { userId: req.user!.id, roles: req.user!.roles };
    res.status(200).json(await this.appointmentService.updateStatus(id, status, actor));
  };
}
