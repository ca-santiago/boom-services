import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { v4 } from 'uuid';
import { FaceId } from '../domain/faceid';
import { Flujo } from '../domain/flujo';
import { PersonalInfo } from '../domain/personalinfo';
import { Signature } from '../domain/signature';
import { FlujoStatus, FlujoType as StepType } from '../interfaces/flujo';
import { StepAccessTokenPayload } from '../interfaces/step.token';
import { FaceidMapper } from '../mapper/faceid';
import { PersonalInfoMapper } from '../mapper/personalinfo';
import { SignatureMapper } from '../mapper/signature';
import { FaceidRepo } from '../repository/faceid';
import { FlujoRepo } from '../repository/flujo';
import { PersonalinfoRepo } from '../repository/personalinfo';
import { SignatureRepo } from '../repository/signature';
// DTOs
import {
  CreateFlujoDTO,
  PutFaceidDTO,
  PutPersonalDataDTO,
  PutSignatureDTO,
} from './dto';
import { StorageService } from './storage';

@Injectable()
export class FlujoService {
  constructor(
    private storageService: StorageService,
    private flujoRepo: FlujoRepo,
    private jwtService: JwtService,
    private faceidRepo: FaceidRepo,
    private faceidMapper: FaceidMapper,
    private signatureRepo: SignatureRepo,
    private signatureMapper: SignatureMapper,
    private personalInfoRepo: PersonalinfoRepo,
    private personalInfoMapper: PersonalInfoMapper,
  ) { }

  async createFlujo(
    dto: CreateFlujoDTO,
  ): Promise<{ token: string; id: string }> {
    const newId = v4();
    const instance = new Flujo(
      newId,
      dto.types,
      moment().format(),
      FlujoStatus.ACTIVE,
    );
    await this.flujoRepo.save(instance);
    const payload: StepAccessTokenPayload = {
      id: newId,
    };
    const token: string = this.jwtService.sign(payload);
    return {
      token,
      id: instance.id,
    };
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

  async putFaceId(dto: PutFaceidDTO) {
    const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
    if (tokenPayload === null) throw new UnauthorizedException();

    // Trying to edit a different resource.
    if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

    // Verify if given flujo exist and step type is available
    await this.findFlujoAndVerifyType(dto.flujoId, StepType.FACE);

    // Let's save the file
    const fileURI = await this.storageService.saveFile(
      dto.file,
      dto.ext,
      dto.flujoId + '-faceid',
    );

    // Search for an already created faceid for using its id
    const faceidOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

    // Let's create the faceid step instance
    // if already exist one for the current flujo, use it's id.
    const faceidInstance = new FaceId(
      faceidOrNull ? faceidOrNull : v4(),
      fileURI,
      moment().format(),
      dto.flujoId,
    );

    await this.faceidRepo.save(faceidInstance);

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

    await this.findFlujoAndVerifyType(dto.flujoId, StepType.PERSONAL_DATA);

    const pInfoOrNull = await this.personalInfoRepo.findByFlujoId(dto.flujoId);

    const pInfoInstance = new PersonalInfo(
      pInfoOrNull ? pInfoOrNull.id : v4(),
      dto.fullName,
      dto.birthDate,
      dto.bornPlace,
      dto.phone,
      dto.email,
      dto.flujoId,
      moment().format(),
    );

    await this.personalInfoRepo.save(pInfoInstance);
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

    await this.findFlujoAndVerifyType(dto.flujoId, StepType.SIGNATURE);

    // Let's save the file
    const fileURI = await this.storageService.saveFile(
      dto.file,
      dto.extension,
      dto.flujoId + '-signature',
    );

    // Search for an already created faceid for using its id
    const signatureOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

    // Let's create the faceid step instance
    // if already exist one for the current flujo, use it's id.
    const signatureInstance = new Signature(
      signatureOrNull ? signatureOrNull : v4(),
      fileURI,
      moment().format(),
      dto.flujoId,
    );

    await this.signatureRepo.save(signatureInstance);

    return this.signatureMapper.toPublicDTO(signatureInstance);
  }
}
