import { FaceIdService } from '../services/faceId';
import {
  Controller,
  Post,
  UploadedFile,
  Query,
  NotImplementedException,
} from '@nestjs/common';

@Controller('steps')
export class FaceidController {
  constructor(private service: FaceIdService) {}

  @Post('faceids')
  async create(@UploadedFile() file: Express.Multer.File, @Query() q) {
    throw new NotImplementedException();
  }
}
