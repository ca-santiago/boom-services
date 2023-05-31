import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateFlujoDTO } from '../services/dto';
import { FlujoService } from '../services/flujo';
import { Request, Response } from 'express';
import { StepsService } from '../services/steps';


@Controller('flujos')
export class FlujoController {
  constructor(
    private flujoService: FlujoService,
    private stepsService: StepsService,
    ) { }

  @Get('/ping')
  ping() {
    return 'pong';
  }

  @Post()
  async create(
    @Body() dto: CreateFlujoDTO,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const servicePayload = await this.flujoService.createFlujo(dto);
    res.status(201).json(servicePayload).end();
  }

  @Get()
  async GetAll(@Query('page') page) {
    const _page = page > 0 ? page : 0;
    const result = await this.flujoService.findAll(_page as number);
    return result;
  }

  @Get(':id')
  async getById(@Param('id') id) {
    const result = await this.flujoService.findById(id);
    if (result == null) {
      throw new NotFoundException();
    }
    return result;
  }

  @Get(':id/steps/contactInfo')
  async getContactInfo(
    @Param('id') id: string
  ) {
    const res = await this.stepsService.getContactInfoByFlujoId(id);
    return {
      data: res
    }
  }
}
