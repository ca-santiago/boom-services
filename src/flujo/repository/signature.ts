import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Signature } from '../domain/signature';
import { SignatureMapper } from '../mapper/signature';
import { SignatureDocument } from './signature.schema';

@Injectable()
export class SignatureRepo {
  constructor(
    @InjectModel('Signature') private model: Model<SignatureDocument>,
    private mapper: SignatureMapper,
  ) {}

  async save(domain: Signature): Promise<void> {
    const mapped = this.mapper.toRepo(domain);
    await this.model
      .findByIdAndUpdate(domain.id, mapped, { upsert: true })
      .exec();
    return;
  }

  async exist(id: string): Promise<boolean> {
    return this.model.exists({ _id: id });
  }

  async findById(id: string): Promise<Signature | null> {
    const result = await this.model.findById(id).exec();
    return result ? this.mapper.toDomain(result) : null;
  }

  async findByFlujoId(id: string): Promise<Signature | null> {
    const result = await this.model.findOne({ flujoId: id }).exec();
    return result ? this.mapper.toDomain(result) : null;
  }
}
