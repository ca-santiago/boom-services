import { IContactInfo } from '../interfaces/personalinfo';

export class ContactInfo implements IContactInfo {
  constructor(
    public id: string,
    public fullName: string,
    public birthDate: string,
    public bornPlace: string,
    public phoneNumber: string,
    public email: string,
    public flujoId: string,
    public createdAt: number,
  ) {}
}
