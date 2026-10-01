import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
} from 'generated/prisma/enums';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}