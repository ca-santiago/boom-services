import { StepFile } from '../interfaces/common';
import { IFaceId } from '../interfaces/faceid';

export class FaceId implements IFaceId {
  constructor(
    public id: string,
    public createdAt: number,
    public flujoId: string,
    public file: StepFile
  ) { }
}
