import { BadRequestException, Body, Controller, InternalServerErrorException, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FlujoService } from "../services/flujo";
import { CompletionService } from "../services/completion";
import { PutFaceidDTOV2, PutContactInfoDTO, PutSignatureDTO } from "../services/dto";
import { FileInterceptor } from "@nestjs/platform-express";

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

    @Put(':id/signature')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { files: 1 },
            fileFilter: function (req, file, callback) {
                let ext = file.mimetype.split('/')[1];
                if (ext !== 'jpg' && ext !== 'png')
                    return callback(
                        new BadRequestException('Only jpg and png files are allowed'),
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