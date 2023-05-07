import { Inject, Injectable } from '@nestjs/common';
import { S3Service } from '../aws';

@Injectable()
export class ObjectStorageService {
  constructor(@Inject('S3Service') private s3Client: S3Service) { }

  async getSignedUrl(name: string, fileMd5: string): Promise<string> {
    return this.s3Client.getSignedUrl(name);
  }

  async uploadFile(rawData: Buffer, name: string, mimetype: string) {
    return await this.s3Client.upload({ name, rawData, type: mimetype });
  }
}