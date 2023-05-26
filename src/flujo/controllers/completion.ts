import { Body, Controller, InternalServerErrorException, Param, Post, Put } from "@nestjs/common";
import { FlujoService } from "../services/flujo";
import { CompletionService } from "../services/completion";
import { PutFaceidDTOV2, PutPersonalDataDTO, PutContactInfoDTO } from "../services/dto";

@Controller('completion')
export class CompletionController {
    constructor(
        private flujoService: FlujoService,
        private completionService: CompletionService
    ) { }

    @Post('start/:id')
    async start(
        @Param('id') id: string
    ) {
        try {
            const res = this.completionService.startFlujo(id);
            return res;
        } catch (err) {
            throw new InternalServerErrorException('Failed starting flujo', id);
        }
    }

    @Put(':id/faceid')
    async putFaceId(
        @Param('id') flujoId: string,
        @Body() dto: PutFaceidDTOV2
    ) {
        try {
            return this.completionService.putFaceId({
                ...dto,
                flujoId
            });
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException();
        }
    }

    @Put(':id/contactInfo')
    async putContactInfo(@Body() dto: PutContactInfoDTO, @Param('id') id) {
        try {
            return await this.completionService.putContactInfo({ ...dto, flujoId: id });
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException();
        }
    }
}