import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { FlujoRepo } from "../repository/flujo";
import { FaceidRepo } from "../repository/faceid";
import { ObjectStorageService } from "src/shared/services/objectStorage";
import { FaceId } from "../domain/faceid";
import { Flujo } from "../domain/flujo";
import { JwtService } from "@nestjs/jwt";
import { StepAccessTokenPayload } from "../interfaces/step.token";
import { PutContactInfoDTO, PutFaceidDTO, PutSignatureDTO } from "./dto";
import { FlujoPublicDTO, FlujoStatus, StepType } from "../interfaces/flujo";
import { v4 } from 'uuid';
import { StepFileStatus } from "../interfaces/common";
import { ContactInfoRepo } from "../repository/contactInfo";
import { ContactInfoMapper } from "../mapper/contactInfo";
import { ContactInfo } from "../domain/contactInfo";
import { SignatureRepo } from "../repository/signature";
import { SignatureMapper } from "../mapper/signature";
import { Signature } from "../domain/signature";
import { FinishFlujoProps, FinishFlujoResult, FinishFlujoResultType } from "./completion.types";
import { FlujoHelpersService } from "./flujoHelpers";
import { FlujoMapper } from "../mapper/flujo";

@Injectable()
export class CompletionService {
    constructor(
        private flujoRepo: FlujoRepo,
        private flujoMapper: FlujoMapper,
        private faceidRepo: FaceidRepo,
        private jwtService: JwtService,
        private signatureRepo: SignatureRepo,
        private signatureMapper: SignatureMapper,
        private contactInfoRepo: ContactInfoRepo,
        private contactInfoMapper: ContactInfoMapper,
        private fileStorageService: ObjectStorageService,
        private flujoHelpers: FlujoHelpersService
    ) { }

    //  HELPERS

    private async findFlujoAndVerifyType(id: string, type: string): Promise<Flujo> {
        const flujoOrNull = await this.flujoRepo.findById(id);

        if (flujoOrNull === null) throw new NotFoundException();

        if (flujoOrNull.types.includes(type) === false)
            throw new ConflictException();

        return flujoOrNull;
    }

    // ACTIONS

    async getFlujo(id: string): Promise<FlujoPublicDTO> {
        const flujo = await this.flujoRepo.findById(id);
        if (!flujo) throw new NotFoundException();
        return this.flujoMapper.toPublicDTO(flujo);
    }

    async startFlujo(id: string, passcode?: string) {
        const flujo = await this.flujoRepo.findById(id);
        if (!flujo) throw new NotFoundException();
        const { status, completionTime, startTime } = flujo;

        if (flujo.passcode && flujo.passcode !== passcode) {
            throw new UnauthorizedException();
        }

        // Verify againt started status
        const isStarted = status === FlujoStatus.STARTED;
        const _startTime = startTime || Date.now();
        const deadline = this.flujoHelpers.sumCompletionTime(_startTime, completionTime);
        const secondsLeft = this.flujoHelpers.calculateSecondsLeftFromDateToDate(Date.now(), deadline);

        if (isStarted && secondsLeft < 1) {
            // Save locked and return
            const updated: Flujo = {
                ...flujo,
                status: FlujoStatus.LOCKED,
            }
            await this.flujoRepo.save(updated);
            throw new ConflictException();
        }

        if (isStarted) {
            const payload: StepAccessTokenPayload = { id: flujo.id };
            const token: string = this.jwtService.sign(payload, { expiresIn: secondsLeft });
            // Return
            return {
                token,
                secondsLeft,
                flujo: this.flujoMapper.toPublicDTO(flujo),
            };
        }

        // If is just created, lets start it
        if (status === FlujoStatus.CREATED) {
            // Generate token
            const payload: StepAccessTokenPayload = { id: flujo.id };
            const updatedSecondsLeft = this.flujoHelpers.calculateSecondsLeftFromDateToDate(_startTime, deadline);
            const token: string = this.jwtService.sign(payload, { expiresIn: updatedSecondsLeft });

            // Update and save
            const updated: Flujo = {
                ...flujo,
                status: FlujoStatus.STARTED,
                startTime: Date.now(),
            }
            await this.flujoRepo.save(updated);

            // Return
            return {
                token,
                secondsLeft: updatedSecondsLeft,
                flujo: this.flujoMapper.toPublicDTO(updated),
            };
        }

        if (status === FlujoStatus.LOCKED || status === FlujoStatus.FINISHED) {
            throw new ConflictException();
        }

        throw new UnauthorizedException('Invalid status');
    }

    async finishFlujo(dto: FinishFlujoProps): Promise<FinishFlujoResult> {
        const existOrNull = await this.flujoRepo.findById(dto.flujoId);
        if (!existOrNull) throw new UnauthorizedException();

        const tokenPayload = this.flujoHelpers.verifyStepAccesToken(dto.token);
        if (tokenPayload === null) throw new UnauthorizedException();

        const { status, completionTime, startTime, types, completedSteps } = existOrNull;

        // Not started
        if (status === FlujoStatus.CREATED) {
            return {
                resultType: FinishFlujoResultType.NOT_STARTED,
                flujo: null,
            }
        }

        // Already closed
        if (status === FlujoStatus.FINISHED || status === FlujoStatus.LOCKED) {
            return {
                flujo: null,
                resultType: FinishFlujoResultType.ALREADY_CLOSED
            };
        }

        // Not marked as close yet, but no time left.
        const deadline = this.flujoHelpers.sumCompletionTime(startTime, completionTime);
        const secondsLeft = this.flujoHelpers.calculateSecondsLeftFromDateToDate(Date.now(), deadline);
        if (secondsLeft <= 0) {
            return {
                resultType: FinishFlujoResultType.ERROR,
                flujo: null
            }
        }

        // Validate completion status
        const allStepCompleted = types.every(step => completedSteps.includes(step));

        // CANT_FINISH
        if (!allStepCompleted) {
            return {
                resultType: FinishFlujoResultType.CANT_FINISH,
                flujo: null,
            }
        }

        const updated: Flujo = {
            ...existOrNull,
            status: FlujoStatus.FINISHED,
        }
        await this.flujoRepo.save(updated);

        return { flujo: this.flujoMapper.toPublicDTO(updated), resultType: FinishFlujoResultType.OK };
    }

    async putFaceId(dto: PutFaceidDTO) {
        const tokenPayload = this.flujoHelpers.verifyStepAccesToken(dto.token);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        // Verify if given flujo exist and step type is available
        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.FACE);

        // Search for an already created faceid for using its id
        const faceidOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

        const id = faceidOrNull ? faceidOrNull.id : v4();

        // Get a signed url for the given file
        const signedUrl = await this.fileStorageService.putObjectWithSignedUrl(id);

        // Let's create the faceid step instance
        // if already exist one for the current flujo, use it's id.
        const faceidInstance: FaceId = {
            id,
            file: {
                fileId: id,
                id: v4(),
                status: StepFileStatus.WAITING,
            },
            createdAt: Date.now(),
            flujoId: dto.flujoId,
        };

        await this.faceidRepo.save(faceidInstance);
        // No longer marking this step as completed, since we need to validate a file was actually uploaded
        // TODO: Do not set as completed once new flujo step domain entity is ready
        await this.flujoRepo.save(this.flujoHelpers.maskStepAsCompleted(flujo, StepType.FACE));

        return {
            flujoId: dto.flujoId,
            signedUrl
        };
    }

    async putContactInfo(dto: PutContactInfoDTO) {
        const tokenPayload = this.flujoHelpers.verifyStepAccesToken(dto.accessToken);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.CONTACT_INFO);

        const existOrNull = await this.contactInfoRepo.findByFlujoId(dto.flujoId);

        const { accessToken, ...rest } = dto;
        const instance: ContactInfo = {
            ...rest,
            phoneNumber: dto.phone,
            createdAt: Date.now(),
            id: existOrNull ? existOrNull.id : v4(),
        };

        await this.contactInfoRepo.save(instance);
        await this.flujoRepo.save(this.flujoHelpers.maskStepAsCompleted(flujo, StepType.CONTACT_INFO));
        return this.contactInfoMapper.toPublicDTO(instance);
    }

    async putSignature(dto: PutSignatureDTO) {
        const tokenPayload = this.flujoHelpers.verifyStepAccesToken(dto.accessToken);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.SIGNATURE);

        // Search for an already created faceid for using its id
        const signatureOrNull = await this.signatureRepo.findByFlujoId(dto.flujoId);

        const id = signatureOrNull ? signatureOrNull.id : v4();

        await this.fileStorageService.uploadFile(dto.file.buffer, id, dto.file.mimetype);

        // Let's create the faceid step instance
        // if already exist one for the current flujo, use it's id.
        const signatureInstance: Signature = {
            id,
            createdAt: Date.now(),
            flujoId: dto.flujoId,
            uri: id,
        };

        await this.signatureRepo.save(signatureInstance);
        await this.flujoRepo.save(this.flujoHelpers.maskStepAsCompleted(flujo, StepType.SIGNATURE));

        return this.signatureMapper.toPublicDTO(signatureInstance);
    }
}
