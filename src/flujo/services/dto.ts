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

export class UpdateFlujoDTO {
  @IsString()
  title: string;

  @IsString()
  description: string;

  // @IsString()
  // @Matches(/^\d+[hm]$/)
  // completionTime: string;
}

export class PutFaceidDTO {
  @IsString()
  token: string;

  flujoId: string;
}

export class PutContactInfoDTO {
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

  flujoId: string;

  file: Express.Multer.File;
}
