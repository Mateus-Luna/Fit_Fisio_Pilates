import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto) {
    if (createDocumentDto.type !== 'CERTIFICATE') {
      throw new BadRequestException(
        'Currently only CERTIFICATE is supported via this endpoint',
      );
    }

    const {
      studentId,
      enrollmentId,
      title,
      content,
      issueDate,
      expirationDate,
      observation,
      status,
    } = createDocumentDto;

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

    if (status && !validStatuses.includes(status as (typeof validStatuses)[number])) {
      throw new BadRequestException('Status de documento inválido.');
    }

    return this.prisma.medicalCertificate
      .create({
        data: {
          studentId,
          enrollmentId: enrollmentId || null,
          title,
          content,
          issueDate: issueDate ? new Date(issueDate) : undefined,
          expirationDate: expirationDate
            ? new Date(expirationDate)
            : undefined,
          observation,
          status: (status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED',
        },
        include: {
          student: true,
          enrollment: true,
        },
      })
      .then(this.mapToAppDocument);
  }

  async findAll(studentId?: string, enrollmentId?: string, type?: string) {
    if (type && type !== 'CERTIFICATE') {
      return [];
    }

    const certificates = await this.prisma.medicalCertificate.findMany({
      where: {
        studentId,
        enrollmentId,
      },
      include: {
        student: true,
        enrollment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return certificates.map(this.mapToAppDocument);
  }

  async findOne(id: string) {
    const cert = await this.prisma.medicalCertificate.findUnique({
      where: { id },
      include: {
        student: true,
        enrollment: true,
      }
    });

    if (!cert) throw new NotFoundException('Documento não encontrado.');

    return this.mapToAppDocument(cert);
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    const cert = await this.prisma.medicalCertificate.findUnique({
      where: { id },
    });

    if (!cert) {
      throw new NotFoundException('Documento não encontrado.');
    }

    if (updateDocumentDto.status) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

      if (!validStatuses.includes(updateDocumentDto.status)) {
        throw new BadRequestException('Status de documento inválido.');
      }
    }

    return this.prisma.medicalCertificate
      .update({
        where: { id },
        data: {
          title: updateDocumentDto.title,
          content: updateDocumentDto.content,

          issueDate:
            updateDocumentDto.issueDate !== undefined
              ? new Date(updateDocumentDto.issueDate)
              : undefined,

          expirationDate:
            updateDocumentDto.expirationDate !== undefined
              ? updateDocumentDto.expirationDate
                ? new Date(updateDocumentDto.expirationDate)
                : null
              : undefined,

          observation: updateDocumentDto.observation,

          status: updateDocumentDto.status as
            | 'PENDING'
            | 'APPROVED'
            | 'REJECTED'
            | undefined,
        },
        include: {
          student: true,
          enrollment: true,
        },
      })
      .then(this.mapToAppDocument);
  }

  async remove(id: string) {
    const cert = await this.prisma.medicalCertificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Documento não encontrado.');
    await this.prisma.medicalCertificate.delete({ where: { id } });
  }

  private mapToAppDocument(cert: any) {
    return {
      ...cert,
      type: 'CERTIFICATE',
    };
  }
}
