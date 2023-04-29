import { Injectable } from '@nestjs/common';
import { FaceId } from '../domain/faceid';
import { IFaceId } from '../interfaces/faceid';
import { FaceidPublicDTO } from '../interfaces/faceid.dto';
import { FaceidRepoDTO } from '../interfaces/faceid.repo';

@Injectable()
export class FaceidMapper {
  constructor() {}

  toDomain(raw: FaceidRepoDTO): FaceId {
    return new FaceId(raw._id, raw.uri, raw.createdAt, raw.flujoId);
  }

  toRepo(domain: FaceId): FaceidRepoDTO {
    const out: FaceidRepoDTO = {
      _id: domain.id,
      uri: domain.uriIdentifier,
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
