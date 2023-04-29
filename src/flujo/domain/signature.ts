import { ISignature } from '../interfaces/signature';

export class Signature implements ISignature {
  constructor(
    public id: string,
    public uri: string,
    public createdAt: string,
    public flujoId: string,
  ) {}
}
