import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentDocumentService } from './enrollment-document.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly documentService: EnrollmentDocumentService,
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

  @Post(':id/document/generate')
  generateDocument(
    @Param('id') id: string,
    @Body()
    body?: {
      paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO';
      observation?: string;
    },
  ) {
    return this.documentService.generateReceipt(id, body);
  }

  @Get(':id/document')
  getDocument(@Param('id') id: string) {
    return this.documentService.getReceiptMetadata(id);
  }

  @Get(':id/document/pdf')
  async getDocumentPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } =
      await this.documentService.getReceiptPdfBuffer(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    return res.end(buffer);
  }

  @Patch(':id/document/status')
  updateDocumentStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      observation?: string;
    },
  ) {
    return this.documentService.updateReceiptStatus(
      id,
      body.status,
      body.observation,
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