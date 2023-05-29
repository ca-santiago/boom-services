import { BadRequestException, Body, Controller, InternalServerErrorException, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CompletionService } from "../services/completion";
import { PutFaceidDTO, PutContactInfoDTO, PutSignatureDTO } from "../services/dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { FinishFlujoProps } from "../services/completion.types";

@Controller('completion')
export class CompletionController {
    constructor(
        private completionService: CompletionService
    ) { }

    // TODO: Fix endpoint structure - :id/start
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