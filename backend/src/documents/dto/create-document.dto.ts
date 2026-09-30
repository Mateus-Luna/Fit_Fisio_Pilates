import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  observation?: string;
}