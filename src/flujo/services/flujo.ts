import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { Flujo } from '../domain/flujo';
import { FlujoStatus, IFlujo } from '../interfaces/flujo';
import { FlujoRepo } from '../repository/flujo';

// DTOs
import { CreateFlujoDTO } from './dto';

interface CreateFlujoResponse {
  data: Flujo;
}

@Injectable()
export class FlujoService {
  constructor(
    private flujoRepo: FlujoRepo,
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

  async findById(id: string): Promise<Flujo | null> {
    return this.flujoRepo.findById(id);
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
