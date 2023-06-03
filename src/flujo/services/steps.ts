import { Injectable, NotFoundException } from "@nestjs/common";
import { ContactInfo } from "../domain/contactInfo";
import { ContactInfoRepo } from "../repository/contactInfo";
import { ContactInfoMapper } from "../mapper/contactInfo";
import { ObjectStorageService } from "src/shared/services/objectStorage";
import { SignatureRepo } from "../repository/signature";
import { SignatureMapper } from "../mapper/signature";
import { FaceidRepo } from "../repository/faceid";
import { FaceidMapper } from "../mapper/faceid";

@Injectable()
export class StepsService {
    constructor(
        private ContactInfoRepo: ContactInfoRepo,
        private ContactInfoMapper: ContactInfoMapper,
        private SignatureRepo: SignatureRepo,
        private SignatureMapper: SignatureMapper,
        private FaceIdRepo: FaceidRepo,
        private FaceIdMapper: FaceidMapper,
        private ObjectStorageService: ObjectStorageService
    ) { }

    async getContactInfoByFlujoId(id: string): Promise<ContactInfo> {
        const res = await this.ContactInfoRepo.findByFlujoId(id);
        if (!res) {
            throw new NotFoundException();
        }

        return this.ContactInfoMapper.toPublicDTO(res);
    }

    async deleteContactInfoByFlujoId(flujoId: string) {
        const res = await this.ContactInfoRepo.findByFlujoId(flujoId);

        if (!res) return;

        await this.ContactInfoRepo.deleteByFlujoId(flujoId);
        await this.ObjectStorageService.removeObject(res.id);
        return;
    }

    async getSignatureByFlujoId(id: string) {
        const res = await this.SignatureRepo.findByFlujoId(id);
        if (!res) throw new NotFoundException();

        const url = await this.ObjectStorageService.getObjectUrl(res.id);
        return {
            url,
            data: this.SignatureMapper.toPublicDTO(res)
        }
    }

    async deleteSignatureByFlujoId(flujoId: string) {
        const res = await this.SignatureRepo.findByFlujoId(flujoId);
        if (!res) return;

        await this.ObjectStorageService.removeObject(res.id);
        await this.SignatureRepo.deleteByFlujoId(flujoId);
        return;
    }

    async getFaceIdByFlujoId(id: string) {
        const res = await this.FaceIdRepo.findByFlujoId(id);
        if (!res) throw new NotFoundException();

        const url = await this.ObjectStorageService.getObjectUrl(res.id);
        return {
            url,
            data: this.FaceIdMapper.toPublicDTO(res)
        }
    }

    async deleteFaceIdByFlujoId(flujoId: string) {
        const res = await this.FaceIdRepo.findByFlujoId(flujoId);
        if (!res) return;

        await this.FaceIdRepo.deleteByFlujoid(flujoId);
        await this.ObjectStorageService.removeObject(res.id);
        return
    }
}
