import { FileInterceptor } from '@nestjs/platform-express';
import { FaceIdService } from '../services/faceId';
import * as path from 'path';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
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
