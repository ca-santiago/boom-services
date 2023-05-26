
export enum StepFileStatus {
    "WAITING" = "WAITING",
}

export interface StepFile {
    id: string;
    status: StepFileStatus;
    fileId: string;
}