import { Paginated } from "../dtos/common.dto";
import {
  CreateMedicalRecordInput,
  MedicalRecordResponse,
  toMedicalRecordResponse,
} from "../dtos/medical-record.dto";
import { Doctor } from "../entities/doctor.entity";
import { UserRole } from "../entities/user-role.enum";
import { DomainError } from "../errors/domain-error";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import { PatientRepository } from "../repositories/patient.repository";
import { Actor } from "../security/actor";

export class MedicalRecordService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly patients: PatientRepository,
    private readonly appointments: AppointmentRepository,
    private readonly records: MedicalRecordRepository,
  ) {}

  // RN14: escrever e ato medico, e exige vinculo com o paciente.
  async create(patientId: number, input: CreateMedicalRecordInput, actor: Actor): Promise<MedicalRecordResponse> {
    const doctor = await this.requireDoctor(actor);
    await this.ensurePatientExists(patientId);
    await this.ensureCareLink(doctor, patientId);
    const record = await this.records.create({ patientId, doctorId: doctor.id, text: input.text });
    return toMedicalRecordResponse(record);
  }

  // RN14: le o medico com vinculo, ou a administracao (auditoria). Secretaria nao le.
  async list(
    patientId: number,
    page: { page: number; pageSize: number },
    actor: Actor,
  ): Promise<Paginated<MedicalRecordResponse>> {
    const isAdmin = actor.roles.includes(UserRole.ADMIN);
    const doctor = isAdmin ? null : await this.requireDoctor(actor);
    await this.ensurePatientExists(patientId);
    if (doctor) {
      await this.ensureCareLink(doctor, patientId);
    }
    const { items, total } = await this.records.findPage({ patientId, ...page });
    return {
      data: items.map(toMedicalRecordResponse),
      meta: { total, page: page.page, pageSize: page.pageSize, totalPages: Math.ceil(total / page.pageSize) },
    };
  }

  private async requireDoctor(actor: Actor): Promise<Doctor> {
    const doctor = actor.roles.includes(UserRole.DOCTOR) ? await this.doctors.findByUserId(actor.userId) : null;
    if (!doctor) {
      throw new DomainError("ACESSO_NEGADO", "Somente medicos acessam o prontuario.");
    }
    return doctor;
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    if (!(await this.patients.findById(patientId))) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Paciente nao encontrado.");
    }
  }

  private async ensureCareLink(doctor: Doctor, patientId: number): Promise<void> {
    if (!(await this.appointments.hasCareLink(doctor.id, patientId))) {
      throw new DomainError("ACESSO_NEGADO", "O medico nao tem vinculo com este paciente.");
    }
  }
}
