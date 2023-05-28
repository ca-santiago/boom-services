import { FlujoPublicDTO } from "../interfaces/flujo";

export interface FinishFlujoProps {
    flujoId: string;
    token: string;
}

export enum FinishFlujoResultType {
    'ERROR' = 'ERROR',
    'NOT_STARTED' = "NOT_STARTED",
    'OK' = 'OK',
    'ALREADY_CLOSED' = 'ALREADY_CLOSED',
    'CANT_FINISH' = 'CANT_FINISH'
}

export interface FinishFlujoResult {
    resultType: FinishFlujoResultType,
    flujo: FlujoPublicDTO | null,
}