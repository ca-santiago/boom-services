export interface IFlujo {
  id: string;
  types: string[];
  createdAt: number;
  status: string;
  title: string;
  completionTime: string;
  description?: string;
  startTime?: number;
  completedSteps: string[];
}

export enum FlujoStatus {
  'CREATED' = 'CREATED',
  'STARTED' = 'STARTED',
  'FINISHED' = 'FINISHED',
  // If times end and steps are uncompleted
  'LOCKED' = 'LOCKED',
}

export enum StepType {
  'FACE' = 'FACE',
  'PERSONAL_DATA' = 'PERSONAL_DATA',
  'SIGNATURE' = 'SIGNATURE',
}

/**
 * The instance data that will be stored
 */
export interface FlujoRepoDTO extends Exclude<IFlujo, 'id'> {
  _id: string;
}

/**
 * Public data of an entity, define which information should be returned on requets
 */
export interface FlujoPublicDTO extends IFlujo {}