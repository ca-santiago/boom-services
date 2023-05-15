import { Schema, Document } from 'mongoose';
import { IFlujo } from '../interfaces/flujo';

export type FlujoDocument = IFlujo & Document;

export const FlujoSchema = new Schema({
  _id: String,
  createdAt: String,
  status: String,
  types: [String],
  title: String,
  description: String,
  completionTime: String
});
