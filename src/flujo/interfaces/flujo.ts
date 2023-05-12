export interface IFlujo {
  id: string;
  types: string[];
  createdAt: string;
  status: string;
  title: string;
  completionTime: string;
  description?: string;
}

export enum FlujoStatus {
  'CREATED' = 'CREATED',
  'STARTED' = 'STARTED',
  'FINISHED' = 'FINISHED',
  'UNCOMPLETED' = 'UNCOMPLETED',

  'ACTIVE' = 'ACTIVE',
}

export enum FlujoType {
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