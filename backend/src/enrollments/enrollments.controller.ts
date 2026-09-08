import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(
      id,
      updateEnrollmentDto,
    );
  }

  @Patch(':id/request-approval')
  requestApproval(@Param('id') id: string) {
    return this.enrollmentsService.requestApproval(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.enrollmentsService.approve(id);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.enrollmentsService.suspend(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.enrollmentsService.reactivate(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.enrollmentsService.cancel(id);
  }

  @Delete(':id')
  cancelEnrollment(@Param('id') id: string) {
    return this.enrollmentsService.cancel(id);
  }
}