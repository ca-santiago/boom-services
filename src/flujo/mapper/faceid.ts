import { Injectable } from '@nestjs/common';
import { FaceId } from '../domain/faceid';
import { FaceidPublicDTO } from '../interfaces/faceid.dto';
import { FaceidRepoDTO } from '../interfaces/faceid.repo';

@Injectable()
export class FaceidMapper {
  constructor() { }

  toDomain(raw: FaceidRepoDTO): FaceId {
    const { _id, ...rest } = raw;
    return {
      ...rest,
      id: raw._id
    };
  }

  toRepo(domain: FaceId): FaceidRepoDTO {
    const out: FaceidRepoDTO = {
      _id: domain.id,
      ...domain,
    };
    return out;
  }

  toPublicDTO(domain: FaceId): FaceidPublicDTO {
    const out: FaceidPublicDTO = {
      ...domain,
    };
    return out;
  }
}
