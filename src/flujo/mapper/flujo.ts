import { Injectable } from '@nestjs/common';
import { Flujo } from '../domain/flujo';
import { FlujoPublicDTO } from '../interfaces/flujo.dto';
import { FlujoRepoDTO } from '../interfaces/flujo.repo';

@Injectable()
export class FlujoMapper {
  constructor() {}

  toDomain(raw: FlujoRepoDTO): Flujo {
    const instance = new Flujo(raw._id, raw.types, raw.createdAt, raw.status);
    return instance;
  }

  toRepo(domain: Flujo): FlujoRepoDTO {
    const out: FlujoRepoDTO = {
      _id: domain.id,
      ...domain,
    };
    return out;
  }

  toPublicDTO(domain: Flujo): FlujoPublicDTO {
    const out: FlujoPublicDTO = {
      ...domain,
    };
    return out;
  }

  fromRepoToPublicDTO(raw: FlujoRepoDTO): FlujoPublicDTO {
    // TODO: Refactor this in order to reduce the operation speed?
    return this.toPublicDTO(this.toDomain(raw));
  }
}
