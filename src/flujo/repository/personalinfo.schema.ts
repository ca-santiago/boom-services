import { Schema, Document } from 'mongoose';
import { IPersonalinfoRepoDTO } from '../interfaces/personalinfo.repo';

export type PersonalInfoDocument = Document & IPersonalinfoRepoDTO;

export const PersonalinfoSchema = new Schema({
  _id: String,
  fullName: String,
  birthDate: String,
  bornPlace: String,
  phoneNumber: String,
  emial: String,
  flujoId: String,
  createdAt: Number,
});
