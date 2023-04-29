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

  // REMOVE: Old approach
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     limits: { fieldSize: 5, files: 1 },
  //     fileFilter: function (req, file, callback) {
  //       let ext = path.extname(file.originalname);
  //       if (ext !== '.mp4')
  //         return callback(
  //           new BadRequestException('Only mp4 files are allowed'),
  //           false,
  //         );

  //       callback(null, true);
  //     },
  //   }),
  // )
  @Post('faceids')
  async create(@UploadedFile() file: Express.Multer.File, @Query() q) {
    throw new NotImplementedException();
  }
}
