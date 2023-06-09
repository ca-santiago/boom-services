import { Inject, Injectable } from '@nestjs/common';
import { S3Service } from '../aws';

@Injectable()
export class ObjectStorageService {
  constructor(@Inject('S3Service') private s3Client: S3Service) { }

  async putObjectWithSignedUrl(name: string) {
    return this.s3Client.putObjectWithSignedUrl(name);
  }

  async uploadFile(rawData: Buffer, name: string, mimetype: string) {
    return await this.s3Client.upload({ name, rawData, type: mimetype });
  }

  async getObjectUrl(id: string) {
    return this.s3Client.getObjectWithSignedUrl(id);
  }

  async removeObject(id: string) {
    return this.s3Client.deleteObject(id);
  }
}
