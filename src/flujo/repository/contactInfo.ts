import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactInfo } from '../domain/contactInfo';
import { ContactInfoMapper } from '../mapper/contactInfo';
import { ContactInfoDocument } from './contactInfo.schema';

@Injectable()
export class ContactInfoRepo {
  constructor(
    @InjectModel('ContactInfo') private model: Model<ContactInfoDocument>,
    private pInfoMapper: ContactInfoMapper,
  ) {}

  async save(domain: ContactInfo): Promise<void> {
    const mapped = this.pInfoMapper.toRepo(domain);
    await this.model
      .findByIdAndUpdate(domain.id, mapped, { upsert: true })
      .exec();
    return;
  }

  async exist(id: string): Promise<boolean> {
    return this.model.exists({ _id: id });
  }

  async findById(id: string): Promise<ContactInfo | null> {
    const result = await this.model.findById(id).lean().exec();
    return result ? this.pInfoMapper.toDomain(result) : null;
  }

  async findByFlujoId(id: string): Promise<ContactInfo | null> {
    const result = await this.model.findOne({ flujoId: id }).lean().exec();
    return result ? this.pInfoMapper.toDomain(result) : null;
  }

  async deleteByFlujoId(flujoId: string) {
    return await this.model.findOneAndDelete({ flujoId }).exec();
  }
}
