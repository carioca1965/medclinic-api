import { Request, Response } from "express";
import { calendarQuerySchema } from "../dtos/appointment.dto";
import { idParamSchema } from "../dtos/common.dto";
import { CalendarService } from "../services/calendar.service";

export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const query = calendarQuerySchema.parse(req.query);
    res.status(200).json(await this.calendarService.get(id, query));
  };
}
