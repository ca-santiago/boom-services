import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonalInfo } from '../domain/personalinfo';
import { PersonalInfoMapper } from '../mapper/personalinfo';
import { PersonalInfoDocument } from './personalinfo.schema';

@Injectable()
export class PersonalinfoRepo {
  constructor(
    @InjectModel('Personalinfo') private model: Model<PersonalInfoDocument>,
    private pInfoMapper: PersonalInfoMapper,
  ) {}

  async save(domain: PersonalInfo): Promise<void> {
    const mapped = this.pInfoMapper.toRepo(domain);
    await this.model
      .findByIdAndUpdate(domain.id, mapped, { upsert: true })
      .exec();
    return;
  }

  async exist(id: string): Promise<boolean> {
    return this.model.exists({ _id: id });
  }

  async findById(id: string): Promise<PersonalInfo | null> {
    const result = await this.model.findById(id).exec();
    return result ? this.pInfoMapper.toDomain(result) : null;
  }

  async findByFlujoId(id: string): Promise<PersonalInfo | null> {
    const result = await this.model.findOne({ flujoId: id }).exec();
    return result ? this.pInfoMapper.toDomain(result) : null;
  }
}
