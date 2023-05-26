import { StepFile } from "./common";

export interface FaceidPublicDTO {
  id: string;
  createdAt: number;
  flujoId: string;
  file: StepFile
}
