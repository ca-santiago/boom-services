import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  Query,
  Delete,
} from '@nestjs/common';
import { CreateFlujoDTO, UpdateFlujoDTO } from '../services/dto';
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

  @Delete(':id')
  async deleteFlujo(
    @Param('id') id: string,
  ) {
    await this.flujoService.delete(id);
    return;
  }

  @Put(':id')
  async updateFlujo(
    @Param('id') id: string,
    @Body() dto: UpdateFlujoDTO,
  ) {
    return await this.flujoService.updateFlujo(dto, id);
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

  @Get(':id/steps/signature')
  async getSignature(
    @Param('id') id: string
  ) {
    const res = await this.stepsService.getSignatureByFlujoId(id);
    return res;
  }

  @Get(':id/steps/faceid')
  async getFaceId(
    @Param('id') id: string
  ) {
    const res = await this.stepsService.getFaceIdByFlujoId(id);
    return res;
  }
}
