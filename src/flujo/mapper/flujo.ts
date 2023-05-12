import { Injectable } from '@nestjs/common';
import { Flujo } from '../domain/flujo';
import { IFlujo, FlujoPublicDTO, FlujoRepoDTO } from '../interfaces/flujo';

@Injectable()
export class FlujoMapper {
  constructor() { }

  toDomain(raw: FlujoRepoDTO): Flujo {
    const { _id, ...rest } = raw;
    const instance: IFlujo = {
      id: raw._id,
      ...rest,
    }
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
