import { Injectable } from '@nestjs/common';
import { Signature } from '../domain/signature';
import { ISignaturePublicDTO } from '../interfaces/signature.dto';
import { ISignatureRepoDTO } from '../interfaces/signature.repo';

@Injectable()
export class SignatureMapper {
  constructor() {}

  toDomain(raw: ISignatureRepoDTO): Signature {
    return new Signature(raw._id, raw.uri, raw.createdAt, raw.flujoId);
  }

  toRepo(domain: Signature): ISignatureRepoDTO {
    const out: ISignatureRepoDTO = {
      _id: domain.id,
      ...domain,
    };

    return out;
  }

  toPublicDTO(domain: Signature): ISignaturePublicDTO {
    const out: ISignaturePublicDTO = {
      ...domain,
    };
    return out;
  }
}
