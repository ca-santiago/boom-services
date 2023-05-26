import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches
} from 'class-validator';
import { StepType } from '../interfaces/flujo';

export class CreateFlujoDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(Object.values(StepType), { each: true })
  @ArrayMaxSize(Object.entries(StepType).length)
  types: string[];

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Matches(/^\d+[hm]$/)
  completionTime: string;
}

export class CreateFaceidDTO {
  flujoId: string;
  file: Buffer;
}

export class PutFaceidDTO {
  @IsString()
  accessToken: string;

  flujoId: string;

  file: Express.Multer.File;

  ext: string;
}

export class PutFaceidDTOV2 {
  @IsString()
  token: string;

  flujoId: string;
}

export class PutPersonalDataDTO {
  @IsString()
  accessToken: string;

  flujoId: string;

  @IsString()
  fullName: string;

  @IsDateString()
  birthDate: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  bornPlace: string;
}

export class PutSignatureDTO {

  @IsString()
  accessToken: string;

  @IsString()
  flujoId: string;

  file: Express.Multer.File;

  @IsString()
  extension: string;
}
