import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';
import { Flujo } from '../domain/flujo';
import { FlujoStatus, IFlujo } from '../interfaces/flujo';
import { FlujoRepo } from '../repository/flujo';

// DTOs
import { CreateFlujoDTO, UpdateFlujoDTO } from './dto';
import { FlujoHelpersService } from './flujoHelpers';
import { FlujoMapper } from '../mapper/flujo';
import { StepsService } from './steps';

interface CreateFlujoResponse {
  data: Flujo;
}

@Injectable()
export class FlujoService {
  constructor(
    private flujoRepo: FlujoRepo,
    private flujoMapper: FlujoMapper,
    private flujoHelpers: FlujoHelpersService,
    private stepsService: StepsService,
  ) { }

  async createFlujo(
    dto: CreateFlujoDTO,
  ): Promise<CreateFlujoResponse> {
    const newId = v4();

    // Create instance
    const newFlujo: IFlujo = {
      id: newId,
      types: dto.types,
      createdAt: Date.now(),
      status: FlujoStatus.CREATED,
      completionTime: dto.completionTime,
      title: dto.title,
      description: dto.description,
      completedSteps: [],
      passcode: dto.passcode ?? undefined,
    }

    // Save instance
    await this.flujoRepo.save(newFlujo);
    return { data: newFlujo };
  }

  async updateFlujo(dto: UpdateFlujoDTO, id: string) {
    const flujoOrNull = await this.flujoRepo.findById(id);

    if (!flujoOrNull) throw new NotFoundException();
    const newDesc = dto.description === "" ? undefined : dto.description;
    const updated: Flujo = {
      ...flujoOrNull,
      title: dto.title,
      description: newDesc,
    };
    await this.flujoRepo.save(updated);

    return this.flujoMapper.toPublicDTO(updated);
  }

  async delete(id: string) {
    const flujo = await this.flujoRepo.findById(id);
    if (!flujo) return;

    await Promise.all([
      this.stepsService.deleteSignatureByFlujoId(flujo.id),
      this.stepsService.deleteFaceIdByFlujoId(flujo.id),
      this.stepsService.deleteContactInfoByFlujoId(flujo.id)
    ]);

    await this.flujoRepo.delete(id);
    return;
  }

  async findById(id: string): Promise<Flujo | null> {
    const existsOrNull = await this.flujoRepo.findById(id);
    if (!existsOrNull) throw new NotFoundException();

    if (existsOrNull?.status === FlujoStatus.STARTED) {
      const deadline = this.flujoHelpers.sumCompletionTime(existsOrNull.startTime, existsOrNull.completionTime);
      const timeLeft = this.flujoHelpers.calculateSecondsLeftFromDateToDate(Date.now(), deadline)

      if (timeLeft <= 0) {
        const updated: Flujo = {
          ...existsOrNull,
          status: FlujoStatus.LOCKED,
        }
        await this.flujoRepo.save(updated);
        return { ...this.flujoMapper.toPublicDTO(updated) }
      }
    }

    return this.flujoMapper.toPublicDTO(existsOrNull);
  }

  async findAll(page = 0) {
    const results = await this.flujoRepo.findAll(page);
    return {
      page,
      amount: 20,
      results,
    }
  }
}
