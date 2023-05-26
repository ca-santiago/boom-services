import { Schema, Document } from 'mongoose';
import { IContactInfoRepoDTO } from '../interfaces/personalinfo.repo';

export type ContactInfoDocument = Document & IContactInfoRepoDTO;

export const ContactInfoSchema = new Schema({
  _id: String,
  fullName: String,
  birthDate: String,
  bornPlace: String,
  phoneNumber: String,
  email: String,
  flujoId: String,
  createdAt: Number,
});
