import { Paginated } from "../dtos/common.dto";
import {
  CreateDoctorInput,
  DoctorResponse,
  ListDoctorsInput,
  toDoctorResponse,
} from "../dtos/doctor.dto";
import { DomainError } from "../errors/domain-error";
import { DoctorRepository } from "../repositories/doctor.repository";
import { UserRepository } from "../repositories/user.repository";
import { PasswordHasher } from "../security/password-hasher";

export class DoctorService {
  constructor(
    private readonly users: UserRepository,
    private readonly doctors: DoctorRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async create(input: CreateDoctorInput): Promise<DoctorResponse> {
    if (await this.users.findByEmail(input.email)) {
      throw new DomainError("EMAIL_JA_CADASTRADO", "E-mail ja cadastrado.");
    }
    if (await this.doctors.findByCrm(input.crm)) {
      throw new DomainError("CRM_JA_CADASTRADO", "CRM ja cadastrado.");
    }
    const password = await this.hasher.hash(input.password);
    return toDoctorResponse(await this.doctors.createWithUser({ ...input, password }));
  }

  async getById(id: number): Promise<DoctorResponse> {
    const doctor = await this.doctors.findById(id);
    if (!doctor) {
      throw new DomainError("RECURSO_NAO_ENCONTRADO", "Medico nao encontrado.");
    }
    return toDoctorResponse(doctor);
  }

  async list(input: ListDoctorsInput): Promise<Paginated<DoctorResponse>> {
    const { items, total } = await this.doctors.findPage(input);
    return {
      data: items.map(toDoctorResponse),
      meta: {
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  }
}
