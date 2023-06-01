import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { Flujo } from '../domain/flujo';
import { FlujoStatus, IFlujo } from '../interfaces/flujo';
import { FlujoRepo } from '../repository/flujo';

// DTOs
import { CreateFlujoDTO } from './dto';
import { FlujoHelpersService } from './flujoHelpers';

interface CreateFlujoResponse {
  data: Flujo;
}

@Injectable()
export class FlujoService {
  constructor(
    private flujoRepo: FlujoRepo,
    private flujoHelpers: FlujoHelpersService,
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
      completedSteps: []
    }

    // Save instance
    await this.flujoRepo.save(newFlujo);
    return { data: newFlujo };
  }

  async delete(id: string) {
    return await this.flujoRepo.delete(id);
  }

  async findById(id: string): Promise<Flujo | null> {
    const existsOrNull = await this.flujoRepo.findById(id);
    if (existsOrNull?.status === FlujoStatus.STARTED) {
      const deadline = this.flujoHelpers.sumCompletionTime(existsOrNull.startTime, existsOrNull.completionTime);
      const timeLeft = this.flujoHelpers.calculateSecondsLeftFromDateToDate(Date.now(), deadline)

      if (timeLeft <= 0) {
        const updated: Flujo = {
          ...existsOrNull,
          status: FlujoStatus.LOCKED,
        }
        await this.flujoRepo.save(updated);
        return { ...updated }
      }
    }

    return existsOrNull;
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
