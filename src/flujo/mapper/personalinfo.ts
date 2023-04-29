import { Injectable } from '@nestjs/common';
import { PersonalInfo } from '../domain/personalinfo';
import { IPersonalinfoPublicDTO } from '../interfaces/personalinfo.dto';
import { IPersonalinfoRepoDTO } from '../interfaces/personalinfo.repo';

@Injectable()
export class PersonalInfoMapper {
  constructor() {}

  toDomain(raw: IPersonalinfoRepoDTO): PersonalInfo {
    return new PersonalInfo(
      raw._id,
      raw.fullName,
      raw.birthDate,
      raw.bornPlace,
      raw.phoneNumber,
      raw.emial,
      raw.flujoId,
      raw.createdAt,
    );
  }

  toRepo(domain: PersonalInfo): IPersonalinfoRepoDTO {
    const out: IPersonalinfoRepoDTO = {
      _id: domain.id,
      ...domain,
    };
    return out;
  }

  toPublicDTO(domain: PersonalInfo): IPersonalinfoPublicDTO {
    const out: IPersonalinfoPublicDTO = {
      ...domain,
    };
    return out;
  }
}
