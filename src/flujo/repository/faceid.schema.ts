import { Schema, Document } from 'mongoose';
import { FaceidRepoDTO } from '../interfaces/faceid.repo';

export type FaceidDocument = Document & FaceidRepoDTO;

export const FaceidSchema = new Schema({
  _id: String,
  uri: String,
  createdAt: Number,
  flujoId: String,
});
