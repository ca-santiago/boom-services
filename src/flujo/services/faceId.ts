import { Injectable } from '@nestjs/common';
import { CreateFaceidDTO } from './dto';

@Injectable()
export class FaceIdService {
  constructor() {}

  async create(dto: CreateFaceidDTO) {
    return;
  }
}
