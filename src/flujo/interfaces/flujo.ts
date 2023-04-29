export interface IFlujo {
  id: string;
  types: string[];
  createdAt: string;
  status: string;
}

export enum FlujoStatus {
  'ACTIVE' = 'ACTIVE',
  'FINISHED' = 'FINISHED',
  'LOCKED' = 'LOCKED',
}

export enum FlujoType {
  'FACE' = 'FACE',
  'PERSONAL_DATA' = 'PERSONAL_DATA',
  'SIGNATURE' = 'SIGNATURE',
}
