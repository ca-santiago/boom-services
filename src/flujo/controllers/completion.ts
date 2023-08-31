import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CompletionService } from "../services/completion";
import { PutFaceidDTO, PutContactInfoDTO, PutSignatureDTO, StartFlujoParams } from "../services/dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { FinishFlujoProps } from "../services/completion.types";
import { deprecate } from "util";

@Controller('completion')
export class CompletionController {
    constructor(
        private completionService: CompletionService
    ) { }

    // Public endpoints for flujos data
    @Get(':id')
    async getFlujoData(
        @Param('id') id: string
    ) {
        return this.completionService.getFlujo(id);
    }

    @Post(':id/start')
    async startV2(
        @Param('id') id: string,
        @Body() params: StartFlujoParams
    ) {
        return this.completionService.startFlujo(id, params.passcode);
    }

    @Post(':id/finish')
    async finish(
        @Param('id') id: string,
        @Body() dto: FinishFlujoProps
    ) {
        try {
            return this.completionService.finishFlujo({
                flujoId: id,
                token: dto.token
            });
        } catch (err) {
            throw err;
        }
    }

    @Put(':id/faceid')
    async putFaceId(
        @Param('id') flujoId: string,
        @Body() dto: PutFaceidDTO
    ) {
        try {
            return this.completionService.putFaceId({
                ...dto,
                flujoId
            });
        } catch (err) {
            throw new InternalServerErrorException();
        }
    }

    @Put(':id/contactInfo')
    async putContactInfo(@Body() dto: PutContactInfoDTO, @Param('id') id) {
        try {
            return await this.completionService.putContactInfo({ ...dto, flujoId: id });
        } catch (err) {
            throw new InternalServerErrorException();
        }
    }

    @Put(':id/signature')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { files: 1 },
            fileFilter: function (req, file, callback) {
                let ext = file.mimetype.split('/')[1];
                if (ext !== 'jpg' && ext !== 'png' && ext !== 'jpeg')
                    return callback(
                        new BadRequestException('Only next files types allowed: jpg, jpeg, png'),
                        false,
                    );

                callback(null, true);
            },
        }),
    )
    async putSignature(
        @UploadedFile() file: Express.Multer.File,
        @Param('id') id,
        @Body() dto: PutSignatureDTO,
    ) {
        if (!file) throw new BadRequestException('Should provide file');

        await this.completionService.putSignature({
            ...dto,
            file,
            flujoId: id,
        });
        return;
    }
}