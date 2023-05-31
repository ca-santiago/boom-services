import { Injectable, NotFoundException } from "@nestjs/common";
import { ContactInfo } from "../domain/contactInfo";
import { ContactInfoRepo } from "../repository/contactInfo";
import { ContactInfoMapper } from "../mapper/contactInfo";

@Injectable()
export class StepsService {
    constructor(
        private ContactInfoRepo: ContactInfoRepo,
        private ContactInfoMapper: ContactInfoMapper,
    ) { }

    async getContactInfoByFlujoId(id: string): Promise<ContactInfo> {
        const res = await this.ContactInfoRepo.findByFlujoId(id);
        if(!res) {
            throw new NotFoundException();
        }

        return this.ContactInfoMapper.toPublicDTO(res);
    }
}
