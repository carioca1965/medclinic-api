import { Appointment } from "../entities/appointment.entity";
import { AppointmentStatus } from "../entities/appointment-status.enum";

export interface NewAppointment {
  doctorId: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentFilters {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  from?: Date; // inclusivo
  to?: Date; // exclusivo
  page: number;
  pageSize: number;
}

// Operacoes executadas dentro da transacao com bloqueio (RN10).
export interface AppointmentTransaction {
  // Consultas ativas (nao canceladas) do medico/paciente cujo periodo toca a janela.
  listActiveByDoctor(doctorId: number, from: Date, to: Date): Promise<Appointment[]>;
  listActiveByPatient(patientId: number, from: Date, to: Date): Promise<Appointment[]>;
  insert(data: NewAppointment): Promise<Appointment>;
}

// Porta de repositorio: o service depende desta interface, nao do TypeORM.
export interface AppointmentRepository {
  // Abre a transacao, trava as linhas do medico e do paciente (FOR UPDATE) e
  // executa o trabalho. Quem chega depois espera o commit e ve o horario ocupado.
  withLocks<T>(
    doctorId: number,
    patientId: number,
    work: (tx: AppointmentTransaction) => Promise<T>,
  ): Promise<T>;
  findById(id: number): Promise<Appointment | null>;
  findPage(filters: AppointmentFilters): Promise<{ items: Appointment[]; total: number }>;
  findActiveStartingBetween(doctorId: number, from: Date, to: Date): Promise<Appointment[]>;
  updateStatus(id: number, status: AppointmentStatus): Promise<Appointment>;
  // Existe consulta em andamento ou concluida entre o medico e o paciente? (RN14)
  hasCareLink(doctorId: number, patientId: number): Promise<boolean>;
}
