import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  isDate,
  IsDate,
  IsDateString,
  IsEmail,
  IsIn,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { FlujoType } from '../interfaces/flujo';

export class CreateFlujoDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(Object.values(FlujoType), { each: true })
  @ArrayMaxSize(Object.entries(FlujoType).length)
  types: string[];
}

export class CreateFaceidDTO {
  flujoId: string;
  file: Buffer;
}

export class PutFaceidDTO {
  @IsString()
  accessToken: string;

  flujoId: string;

  file: Buffer;

  ext: string;
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
  accessToken: string;
  flujoId: string;
  file: Buffer;
  extension: string;
}
