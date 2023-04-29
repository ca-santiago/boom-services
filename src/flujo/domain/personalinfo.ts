import { IPersonalinfo } from '../interfaces/personalinfo';

export class PersonalInfo implements IPersonalinfo {
  constructor(
    public id: string,
    public fullName: string,
    public birthDate: string,
    public bornPlace: string,
    public phoneNumber: string,
    public emial: string,
    public flujoId: string,
    public createdAt: string,
  ) {}
}
