import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  create(
    @Body()
    createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(
      createNotificationDto,
    );
  }

  @Get()
  findAll(
    @Query('userId')
    userId?: string,
  ) {
    return this.notificationsService.findAll(userId);
  }

  @Get('unread/:userId')
  findUnread(
    @Param('userId')
    userId: string,
  ) {
    return this.notificationsService.findUnread(userId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id')
    id: string,
  ) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all/:userId')
  markAllAsRead(
    @Param('userId')
    userId: string,
  ) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,
    @Body()
    updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(
      id,
      updateNotificationDto,
    );
  }
}