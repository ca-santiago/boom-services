import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { FaceId } from '../domain/faceid';
import { Flujo } from '../domain/flujo';
import { ContactInfo } from '../domain/contactInfo';
import { Signature } from '../domain/signature';
import { FlujoStatus, IFlujo, StepType as StepType } from '../interfaces/flujo';
import { StepAccessTokenPayload } from '../interfaces/step.token';
import { FaceidMapper } from '../mapper/faceid';
import { ContactInfoMapper } from '../mapper/contactInfo';
import { SignatureMapper } from '../mapper/signature';
import { FaceidRepo } from '../repository/faceid';
import { FlujoRepo } from '../repository/flujo';
import { ContactInfoRepo } from '../repository/contactInfo';
import { SignatureRepo } from '../repository/signature';

// DTOs
import {
  CreateFlujoDTO,
  PutFaceidDTO,
  PutPersonalDataDTO,
  PutSignatureDTO,
} from './dto';
import { ObjectStorageService } from 'src/shared/services/objectStorage';
import { StepFileStatus } from '../interfaces/common';

interface CreateFlujoResponse {
  data: Flujo;
}

@Injectable()
export class FlujoService {
  constructor(
    private flujoRepo: FlujoRepo,
  ) { }

  async createFlujo(
    dto: CreateFlujoDTO,
  ): Promise<CreateFlujoResponse> {
    const newId = v4();

    // Create instance
    const newFlujo: IFlujo = {
      id: newId,
      types: dto.types,
      createdAt: Date.now(),
      status: FlujoStatus.CREATED,
      completionTime: dto.completionTime,
      title: dto.title,
      description: dto.description,
      completedSteps: []
    }

    // Save instance
    await this.flujoRepo.save(newFlujo);
    return { data: newFlujo };
  }

  async findById(id: string): Promise<Flujo | null> {
    return this.flujoRepo.findById(id);
  }

  async findAll(page = 0) {
    const results = await this.flujoRepo.findAll(page);
    return {
      page,
      amount: 20,
      results,
    }
  }
}
