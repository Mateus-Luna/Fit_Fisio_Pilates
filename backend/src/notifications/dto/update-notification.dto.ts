import { IsEnum, IsOptional } from 'class-validator';
import {
  NotificationStatus,
} from 'generated/prisma/enums';

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}