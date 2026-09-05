import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}