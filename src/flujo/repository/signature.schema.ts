import { Schema, Document } from 'mongoose';
import { ISignatureRepoDTO } from '../interfaces/signature.repo';

export type SignatureDocument = Document & ISignatureRepoDTO;

export const SignatureSchema = new Schema({
  _id: String,
  uri: String,
  createdAt: Number,
  flujoId: String,
});
