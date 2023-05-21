import { IFaceId } from '../interfaces/faceid';

export class FaceId implements IFaceId {
  constructor(
    public id: string,
    public uriIdentifier: string,
    public createdAt: number,
    public flujoId: string,
  ) {}
}
