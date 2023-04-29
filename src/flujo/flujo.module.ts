import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceidController } from './controllers/faceid';
import { FlujoController } from './controllers/flujo';
import { FaceidMapper } from './mapper/faceid';
import { FlujoMapper } from './mapper/flujo';
import { PersonalInfoMapper } from './mapper/personalinfo';
import { SignatureMapper } from './mapper/signature';
import { FaceidRepo } from './repository/faceid';
import { FaceidSchema } from './repository/faceid.schema';
import { FlujoRepo } from './repository/flujo';
import { FlujoSchema } from './repository/flujo.schema';
import { PersonalinfoRepo } from './repository/personalinfo';
import { PersonalinfoSchema } from './repository/personalinfo.schema';
import { SignatureRepo } from './repository/signature';
import { SignatureSchema } from './repository/signature.schema';
import { FaceIdService } from './services/faceId';
import { FlujoService } from './services/flujo';
import { StorageService } from './services/storage';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Flujo', schema: FlujoSchema },
      { name: 'Faceid', schema: FaceidSchema },
      { name: 'Signature', schema: SignatureSchema },
      { name: 'Personalinfo', schema: PersonalinfoSchema },
    ]),
    JwtModule.register({
      secret: 'flujo-token-secret-key',
      signOptions: { expiresIn: '5m' },
    }),
  ],
  controllers: [FlujoController, FaceidController],
  providers: [
    // SERVICES
    FaceIdService,
    FlujoService,
    StorageService,
    // REPOS
    FlujoRepo,
    FaceidRepo,
    SignatureRepo,
    PersonalinfoRepo,
    // MAPPERS
    FlujoMapper,
    FaceidMapper,
    SignatureMapper,
    PersonalInfoMapper,
  ],
  exports: [],
})
export class FlujoModule {}
