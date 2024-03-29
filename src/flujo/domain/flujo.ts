import { IFlujo } from '../interfaces/flujo';

export class Flujo implements IFlujo {
  constructor(
    public id: string,
    public types: string[],
    public createdAt: number,
    public status: string,
    public completionTime: string,
    public title: string,
    public completedSteps: string[],
    public description?: string, 
    public startTime?: number,
    public passcode?: string,
  ) {}
}
