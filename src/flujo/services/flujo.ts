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
import { PersonalInfo } from '../domain/personalinfo';
import { Signature } from '../domain/signature';
import { FlujoStatus, IFlujo, FlujoType as StepType } from '../interfaces/flujo';
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
import { ObjectStorageService } from 'src/shared/services/objectStorage';
import * as moment from 'moment';
import { start } from 'repl';

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
    private personalInfoRepo: PersonalinfoRepo,
    private personalInfoMapper: PersonalInfoMapper,
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
    }

    // Save instance
    await this.flujoRepo.save(newFlujo);
    return { data: newFlujo };
  }

  private sumCompletionTime(dateInMillis: number, timeString: string) {
    const value = parseInt(timeString);
    const unit = timeString.slice(-1);

    const date = new Date(dateInMillis);

    if (unit === 'h') {
      date.setHours(date.getHours() + value);
    } else if (unit === 'm') {
      date.setMinutes(date.getMinutes() + value);
    }

    return date.getTime();
  }

  private calculateSecondsLeft(currentTime: number, deadline: number) {
    // Calculate the difference between the deadline and current time in milliseconds
    const timeDiff = deadline - currentTime;

    // Check if the deadline has already passed
    if (timeDiff <= 0) {
      return 0; // Return 0 seconds if the deadline has passed
    }

    // Convert milliseconds to seconds
    const secondsLeft = Math.floor(timeDiff / 1000);

    return secondsLeft;
  }

  async startFlujo(id: string) {
    const existOrNull = await this.flujoRepo.findById(id);
    if (!existOrNull) throw new UnauthorizedException();
    const { status, completionTime, startTime } = existOrNull;

    // Verify againt started status
    const isStarted = status === FlujoStatus.STARTED;
    const deadline = this.sumCompletionTime(startTime || Date.now(), completionTime);
    const secondsLeft = this.calculateSecondsLeft(Date.now(), deadline);

    if (isStarted && secondsLeft < 1) {
      // Save locked and return
      const updated: Flujo = {
        ...existOrNull,
        status: FlujoStatus.LOCKED,
      }
      await this.flujoRepo.save(updated);
      throw new UnauthorizedException();
    }

    if (isStarted) {
      const payload: StepAccessTokenPayload = { id: existOrNull.id };
      const token: string = this.jwtService.sign(payload, { expiresIn: this.calculateSecondsLeft(startTime, deadline) });
      // Return
      return {
        token,
        flujo: existOrNull,
      };
    }

    // If is just created, lets start it
    if (status === FlujoStatus.CREATED) {
      // Generate token
      const payload: StepAccessTokenPayload = { id: existOrNull.id };
      const token: string = this.jwtService.sign(payload, { expiresIn: this.calculateSecondsLeft(startTime, deadline) });

      // Update and save
      const updated: Flujo = {
        ...existOrNull,
        status: FlujoStatus.STARTED,
        startTime: Date.now(),
      }
      await this.flujoRepo.save(updated);

      // Return
      return {
        token,
        flujo: updated,
      };
    }

    if (status === FlujoStatus.LOCKED || status === FlujoStatus.FINISHED) {
      throw new UnauthorizedException();
    }

    throw new UnauthorizedException('Invalid status');
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
    const faceidInstance = new FaceId(
      id,
      id,
      Date.now(),
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
      Date.now(),
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

    return this.signatureMapper.toPublicDTO(signatureInstance);
  }
}
