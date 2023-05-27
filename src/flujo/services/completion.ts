import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { FlujoRepo } from "../repository/flujo";
import { FaceidRepo } from "../repository/faceid";
import { ObjectStorageService } from "src/shared/services/objectStorage";
import { FaceId } from "../domain/faceid";
import { Flujo } from "../domain/flujo";
import { JwtService } from "@nestjs/jwt";
import { StepAccessTokenPayload } from "../interfaces/step.token";
import { PutContactInfoDTO, PutFaceidDTOV2, PutSignatureDTO } from "./dto";
import { FlujoStatus, StepType } from "../interfaces/flujo";
import { v4 } from 'uuid';
import { StepFileStatus } from "../interfaces/common";
import { ContactInfoRepo } from "../repository/contactInfo";
import { ContactInfoMapper } from "../mapper/contactInfo";
import { ContactInfo } from "../domain/contactInfo";
import { SignatureRepo } from "../repository/signature";
import { SignatureMapper } from "../mapper/signature";
import { Signature } from "../domain/signature";

@Injectable()
export class CompletionService {
    constructor(
        private flujoRepo: FlujoRepo,
        private faceidRepo: FaceidRepo,
        private jwtService: JwtService,
        private signatureRepo: SignatureRepo,
        private signatureMapper: SignatureMapper,
        private contactInfoRepo: ContactInfoRepo,
        private contactInfoMapper: ContactInfoMapper,
        private fileStorageService: ObjectStorageService,
    ) { }

    //  HELPERS // TODO: Move to helper provider

    private async findFlujoAndVerifyType(id: string, type: string): Promise<Flujo> {
        const flujoOrNull = await this.flujoRepo.findById(id);

        if (flujoOrNull === null) throw new NotFoundException();

        if (flujoOrNull.types.includes(type) === false)
            throw new ConflictException();

        return flujoOrNull;
    }

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

    // ACTIONS

    async startFlujo(id: string) {
        const existOrNull = await this.flujoRepo.findById(id);
        if (!existOrNull) throw new UnauthorizedException();
        const { status, completionTime, startTime } = existOrNull;

        // Verify againt started status
        const isStarted = status === FlujoStatus.STARTED;
        const _startTime = startTime || Date.now();
        const deadline = this.sumCompletionTime(_startTime, completionTime);
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
            const token: string = this.jwtService.sign(payload, { expiresIn: secondsLeft });
            // Return
            return {
                token,
                secondsLeft,
                flujo: existOrNull,
            };
        }

        // If is just created, lets start it
        if (status === FlujoStatus.CREATED) {
            // Generate token
            const payload: StepAccessTokenPayload = { id: existOrNull.id };
            const updatedSecondsLeft = this.calculateSecondsLeft(_startTime, deadline);
            const token: string = this.jwtService.sign(payload, { expiresIn: updatedSecondsLeft });

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
                secondsLeft: updatedSecondsLeft,
                flujo: updated,
            };
        }

        if (status === FlujoStatus.LOCKED || status === FlujoStatus.FINISHED) {
            throw new UnauthorizedException();
        }

        throw new UnauthorizedException('Invalid status');
    }

    async putFaceId(dto: PutFaceidDTOV2) {
        const tokenPayload = this.verifyStepAccesToken(dto.token);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        // Verify if given flujo exist and step type is available
        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.FACE);

        // Search for an already created faceid for using its id
        const faceidOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

        const id = faceidOrNull ? faceidOrNull : v4();

        // Get a signed url for the given file
        const signedUrl = await this.fileStorageService.getSignedUrl(id);

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
        await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.FACE));

        return {
            flujoId: dto.flujoId,
            signedUrl
        };
    }

    async putContactInfo(dto: PutContactInfoDTO) {
        const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.PERSONAL_DATA);

        const existOrNull = await this.contactInfoRepo.findByFlujoId(dto.flujoId);

        const { accessToken, ...rest } = dto;
        const instance: ContactInfo = {
            ...rest,
            phoneNumber: dto.phone,
            createdAt: Date.now(),
            id: existOrNull ? existOrNull.id : v4(),
        };

        await this.contactInfoRepo.save(instance);
        await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.PERSONAL_DATA));
        return this.contactInfoMapper.toPublicDTO(instance);
    }

    async putSignature(dto: PutSignatureDTO) {
        const tokenPayload = this.verifyStepAccesToken(dto.accessToken);
        if (tokenPayload === null) throw new UnauthorizedException();

        // Trying to edit a different resource.
        if (tokenPayload.id !== dto.flujoId) throw new UnauthorizedException();

        const flujo = await this.findFlujoAndVerifyType(dto.flujoId, StepType.SIGNATURE);

        // Search for an already created faceid for using its id
        const signatureOrNull = await this.faceidRepo.findByFlujoId(dto.flujoId);

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
        await this.flujoRepo.save(this.maskStepAsCompleted(flujo, StepType.SIGNATURE));

        return this.signatureMapper.toPublicDTO(signatureInstance);
    }
}
