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
    private jwtService: JwtService,
    private faceidRepo: FaceidRepo,
    private faceidMapper: FaceidMapper,
    private signatureRepo: SignatureRepo,
    private signatureMapper: SignatureMapper,
    private personalInfoRepo: ContactInfoRepo,
    private personalInfoMapper: ContactInfoMapper,
    private fileStorageService: ObjectStorageService,
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


  /**
   * Helper method
   */
  async findFlujoAndVerifyType(id: string, type: string): Promise<Flujo> {
    const flujoOrNull = await this.flujoRepo.findById(id);

    if (flujoOrNull === null) throw new NotFoundException();

    if (flujoOrNull.types.includes(type) === false)
      throw new ConflictException();

    return flujoOrNull;
  }

  /**
   * Helper method
   * @param dto
   * @returns
   */
  private verifyStepAccesToken(token: string): null | StepAccessTokenPayload {
    try {
      const res = this.jwtService.verify(token);
      if (res === null) return null;

      return res;
    } catch (err) {
      return null;
    }
  }

  private maskStepAsCompleted(f: Flujo, step: StepType): Flujo {
    const cleanedSteps = new Set([...f.completedSteps, step]);
    const updated: Flujo = {
      ...f,
      completedSteps: Array.from(cleanedSteps)
    }
    return updated;
  }

  async putFaceId(dto: PutFaceidDTO) {
    const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
    if (tokenPayload === null) throw new UnauthorizedException();

    // Trying to edit a different resource.
    if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

    // Verify if given flujo exist and step type is available
    const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.FACE);

    // Let's save the file
    // const fileURI = await this.storageService.saveFile(
    //   dto.file,
    //   dto.ext,
    //   dto.flujoId + '-faceid',
    // );

    // Search for an already created faceid for using its id
    const faceidOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

    const id = faceidOrNull ? faceidOrNull : v4();

    // Save file using s3
    await this.fileStorageService.uploadFile(dto.file.buffer, id, dto.file.mimetype);

    // Let's create the faceid step instance
    // if already exist one for the current flujo, use it's id.
    const faceidInstance: FaceId = {
      id,
      file: {
        fileId: '',
        id: '',
        status: StepFileStatus.WAITING
      },
      createdAt: Date.now(),
      flujoId: dto.flujoId,
    }

    await this.faceidRepo.save(faceidInstance);
    await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.FACE));

    return this.faceidMapper.toPublicDTO(faceidInstance);
  }

  /**
   * @Return
   */
  async putPersonalData(dto: PutPersonalDataDTO) {
    const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
    if (tokenPayload === null) throw new UnauthorizedException();

    // Trying to edit a different resource.
    if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

    const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.PERSONAL_DATA);

    const pInfoOrNull = await this.personalInfoRepo.findByFlujoId(dto.flujoId);

    const pInfoInstance = new ContactInfo(
      pInfoOrNull ? pInfoOrNull.id : v4(),
      dto.fullName,
      dto.birthDate,
      dto.bornPlace,
      dto.phone,
      dto.email,
      dto.flujoId,
      Date.now(),
    );

    await this.personalInfoRepo.save(pInfoInstance);
    await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.PERSONAL_DATA));
    return this.personalInfoMapper.toPublicDTO(pInfoInstance);
  } // PutPersonalData

  /**
   * Put a signature instance on the given flujo;
   * @Return Signature public DTO
   */
  async putSignature(dto: PutSignatureDTO) {
    const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
    if (tokenPayload === null) throw new UnauthorizedException();

    // Trying to edit a different resource.
    if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

    const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.SIGNATURE);

    // Let's save the file
    // const fileURI = await this.storageService.saveFile(
    //   dto.file,
    //   dto.extension,
    //   dto.flujoId + '-signature',
    // );

    // Search for an already created faceid for using its id
    const signatureOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

    const id = signatureOrNull ? signatureOrNull : v4();

    await this.fileStorageService.uploadFile(dto.file.buffer, id, dto.file.mimetype);

    // Let's create the faceid step instance
    // if already exist one for the current flujo, use it's id.
    const signatureInstance = new Signature(
      id,
      id,
      Date.now(),
      dto.flujoId,
    );

    await this.signatureRepo.save(signatureInstance);
    await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.SIGNATURE));

    return this.signatureMapper.toPublicDTO(signatureInstance);
  }
}
