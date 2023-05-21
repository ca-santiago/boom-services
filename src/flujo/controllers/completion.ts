import { Controller, InternalServerErrorException, Param, Post } from "@nestjs/common";
import { FlujoService } from "../services/flujo";


@Controller('completion')
export class CompletionController {
    constructor(private flujoService: FlujoService) { }

    @Post('start/:id')
    async start(
        @Param('id') id: string
    ) {
        try {
            const res = this.flujoService.startFlujo(id);
            return res;
        } catch (err) {
            throw new InternalServerErrorException('Failed starting flujo', id);
        }
    }
}