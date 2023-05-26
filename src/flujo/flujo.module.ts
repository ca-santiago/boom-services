import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceidController } from './controllers/faceid';
import { FlujoController } from './controllers/flujo';
import { FaceidMapper } from './mapper/faceid';
import { FlujoMapper } from './mapper/flujo';
import { ContactInfoMapper } from './mapper/contactInfo';
import { SignatureMapper } from './mapper/signature';
import { FaceidRepo } from './repository/faceid';
import { FaceidSchema } from './repository/faceid.schema';
import { FlujoRepo } from './repository/flujo';
import { FlujoSchema } from './repository/flujo.schema';
import { ContactInfoRepo } from './repository/contactInfo';
import { ContactInfoSchema } from './repository/contactInfo.schema';
import { SignatureRepo } from './repository/signature';
import { SignatureSchema } from './repository/signature.schema';
import { FaceIdService } from './services/faceId';
import { FlujoService } from './services/flujo';
import { ObjectStorageService } from 'src/shared/services/objectStorage';
import { S3Service } from 'src/shared/services/aws';
import { CompletionController } from './controllers/completion';
import { CompletionService } from './services/completion';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Flujo', schema: FlujoSchema },
      { name: 'Faceid', schema: FaceidSchema },
      { name: 'Signature', schema: SignatureSchema },
      { name: 'ContactInfo', schema: ContactInfoSchema },
    ]),
    JwtModule.register({
      secret: 'flujo-token-secret-key',
      signOptions: { expiresIn: '5m' },
    }),
  ],
  controllers: [FlujoController, FaceidController, CompletionController],
  providers: [
    // SERVICES
    FaceIdService,
    FlujoService,
    CompletionService,
    // REPOS
    FlujoRepo,
    FaceidRepo,
    SignatureRepo,
    ContactInfoRepo,
    // MAPPERS
    FlujoMapper,
    FaceidMapper,
    SignatureMapper,
    ContactInfoMapper,
    // Storage
    {
      provide: ObjectStorageService,
      useFactory: async () => {
        const client = S3Service.register({
          config: {
            credentials: {
              accessKeyId: process.env.AWS_S3_ACCESSKEY,
              secretAccessKey: process.env.AWS_S3_SECRETKEY,
            },
            region: process.env.AWS_S3_REGION,
          },
          domain: process.env.AWS_S3_BUCKET
        });
        return new ObjectStorageService(client);
      }
    }
  ],
  exports: [],
})
export class FlujoModule { }
