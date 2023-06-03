import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FaceId } from '../domain/faceid';
import { IFaceId } from '../interfaces/faceid';
import { FaceidRepoDTO } from '../interfaces/faceid.repo';
import { FaceidMapper } from '../mapper/faceid';
import { FaceidDocument } from './faceid.schema';

@Injectable()
export class FaceidRepo {
  constructor(
    @InjectModel('Faceid') private faceidModel: Model<FaceidDocument>,
    private faceidMapper: FaceidMapper,
  ) {}

  async exist(id: string): Promise<boolean> {
    return this.faceidModel.exists({ _id: id });
  }

  async findByFlujoId(id: string): Promise<FaceId | null> {
    const exist = await this.faceidModel.findOne({ flujoId: id }).lean().exec();
    return exist ? this.faceidMapper.toDomain(exist as FaceidRepoDTO) : null;
  }

  async save(f: FaceId): Promise<void> {
    const mapped = this.faceidMapper.toRepo(f);
    this.faceidModel.findByIdAndUpdate(f.id, mapped, { upsert: true }).exec();
  }

  async deleteByFlujoid(flujoId: string) {
    await this.faceidModel.findOneAndDelete({ flujoId }).exec();
  }
}
