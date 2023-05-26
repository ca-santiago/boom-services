import { Injectable } from '@nestjs/common';
import { ContactInfo } from '../domain/contactInfo';
import { IContactInfoPublicDTO } from '../interfaces/personalinfo.dto';
import { IContactInfoRepoDTO } from '../interfaces/personalinfo.repo';

@Injectable()
export class ContactInfoMapper {
  constructor() { }

  toDomain(raw: IContactInfoRepoDTO): ContactInfo {
    const { _id, ...rest } = raw;
    return {
      ...rest,
      id: _id,
    };
  }

  toRepo(domain: ContactInfo): IContactInfoRepoDTO {
    const out: IContactInfoRepoDTO = {
      _id: domain.id,
      ...domain,
    };
    return out;
  }

  toPublicDTO(domain: ContactInfo): IContactInfoPublicDTO {
    const out: IContactInfoPublicDTO = {
      ...domain,
    };
    return out;
  }
}
