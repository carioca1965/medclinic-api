import { Paginated } from "../dtos/common.dto";
import {
  CreatePatientInput,
  ListPatientsInput,
  PatientResponse,
  UpdatePatientInput,
  toPatientResponse,
} from "../dtos/patient.dto";
import { Patient } from "../entities/patient.entity";
import { DomainError } from "../errors/domain-error";
import { PatientRepository } from "../repositories/patient.repository";

export class PatientService {
  constructor(private readonly patients: PatientRepository) {}

  async create(input: CreatePatientInput): Promise<PatientResponse> {
    if (await this.patients.findByCpf(input.cpf)) {
      throw new DomainError("CPF_JA_CADASTRADO", "CPF ja cadastrado.");
    }
    return toPatientResponse(await this.patients.create(input));
  }

  async getById(id: number): Promise<PatientResponse> {
    return toPatientResponse(await this.findOrFail(id));
  }

  async list(input: ListPatientsInput): Promise<Paginated<PatientResponse>> {
    const { items, total } = await this.patients.findPage(input);
    return {
      data: items.map(toPatientResponse),
      meta: {
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  }

  async update(id: number, input: UpdatePatientInput): Promise<PatientResponse> {
    await this.findOrFail(id);
    return toPatientResponse(await this.patients.updateName(id, input.name));
  }

  async remove(id: number): Promise<void> {
    await this.findOrFail(id);
    await this.patients.remove(id);
  }

  private async findOrFail(id: number): Promise<Patient> {
    const patient = await this.patients.findById(id);
    if (!patient) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Paciente nao encontrado.");
    }
    return patient;
  }
}
