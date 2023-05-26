import { StepFile } from "./common";

export interface FaceidRepoDTO {
  _id: string;
  createdAt: number;
  flujoId: string;
  file: StepFile;
}
