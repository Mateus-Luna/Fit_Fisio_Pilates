import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface GenerateReceiptOptions {
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO';
  observation?: string;
}

@Injectable()
export class EnrollmentDocumentService {
  private readonly logger = new Logger(EnrollmentDocumentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converte o nome original da modalidade do sistema para o nome simplificado
   * impresso no documento oficial RECIBO SERVICO.pdf.
   * Regra estrita: esta conversão ocorre APENAS para apresentação no documento.
   */
  mapModalityToDocumentName(originalModalityName: string): string {
    const normalized = originalModalityName.trim().toLowerCase();

    if (normalized === 'academia') return 'Pilates';
    if (normalized === 'fisioterapia') return 'Fisioterapia';
    if (normalized === 'hidroginástica' || normalized === 'hidroginastica') return 'Hidroginástica';
    if (normalized === 'hidroterapia') return 'Hidroginástica';
    if (normalized.includes('natação') || normalized.includes('natacao')) return 'Natação';
    if (normalized === 'pilates') return 'Pilates';

    return originalModalityName;
  }

  /**
   * Determina a coordenada Y da linha correspondente na tabela do PDF.
   * A tabela impressa contém 4 linhas fixas:
   * - Pilates: y ~ 497.5
   * - Fisioterapia: y ~ 478.5
   * - Natação: y ~ 459.5
   * - Hidroginástica: y ~ 440.5
   */
  getTableRowYCoordinate(documentServiceName: string): number {
    switch (documentServiceName) {
      case 'Pilates':
        return 497.5;
      case 'Fisioterapia':
        return 478.5;
      case 'Natação':
        return 459.5;
      case 'Hidroginástica':
        return 440.5;
      default:
        return 497.5; // Linha padrão
    }
  }

  /**
   * Resolve os caminhos do template original e da pasta de uploads de forma resiliente.
   */
  private resolveTemplatePath(): string {
    const candidates = [
      path.resolve(process.cwd(), 'backend/assets/documents/RECIBO SERVICO.pdf'),
      path.resolve(process.cwd(), 'assets/documents/RECIBO SERVICO.pdf'),
      path.resolve(__dirname, '../../assets/documents/RECIBO SERVICO.pdf'),
      path.resolve(__dirname, '../../../backend/assets/documents/RECIBO SERVICO.pdf'),
      path.resolve(__dirname, '../../../../backend/assets/documents/RECIBO SERVICO.pdf'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new InternalServerErrorException(
      'Template original RECIBO SERVICO.pdf não encontrado.',
    );
  }

  private resolveUploadDir(): string {
    const cwd = process.cwd();
    const baseDir = cwd.endsWith('backend') ? cwd : path.resolve(cwd, 'backend');
    const uploadDir = path.resolve(baseDir, 'uploads/documents/receipts');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return uploadDir;
  }

  /**
   * Carrega as configurações de dados da empresa/prestador via SystemSettings.
   * Aplica valores padrão elegantes caso alguma chave não esteja cadastrada.
   */
  private async getProviderSettings(): Promise<{
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    cityState: string;
  }> {
    try {
      const allSettings = await this.prisma.systemSettings.findMany();
      const settingsMap = new Map<string, string>();
      for (const s of allSettings) {
        settingsMap.set(s.key, s.value);
      }

      return {
        name:
          settingsMap.get('studio_name') ||
          settingsMap.get('company_name') ||
          'FIT FISIO PILATES',
        cnpj:
          settingsMap.get('cnpj') ||
          settingsMap.get('company_cnpj') ||
          settingsMap.get('studio_cnpj') ||
          '34.567.890/0001-12',
        address:
          settingsMap.get('studio_address') ||
          settingsMap.get('company_address') ||
          settingsMap.get('address') ||
          'Rua Desembargador Trindade, 120 - Centro',
        phone:
          settingsMap.get('contact_phone') ||
          settingsMap.get('company_phone') ||
          settingsMap.get('phone') ||
          '(83) 98765-4321',
        cityState:
          settingsMap.get('city_state') ||
          settingsMap.get('company_city') ||
          'Campina Grande - PB',
      };
    } catch (err) {
      this.logger.warn('Não foi possível ler SystemSettings, usando padrões:', err);
      return {
        name: 'FIT FISIO PILATES',
        cnpj: '34.567.890/0001-12',
        address: 'Rua Desembargador Trindade, 120 - Centro',
        phone: '(83) 98765-4321',
        cityState: 'Campina Grande - PB',
      };
    }
  }

  /**
   * Resolve os dados do cliente:
   * - Adulto: dados do próprio Student (Nome, CPF, Telefone, Endereço).
   * - Criança: dados do Responsável (obtidos via Family -> membros adultos).
   */
  private resolveClientData(student: any): {
    name: string;
    cpf: string;
    phone: string;
    address: string;
  } {
    const isAdult = student.type === 'ADULT';

    if (isAdult) {
      return {
        name: student.name || 'Aluno',
        cpf: student.cpf || '-',
        phone: student.phone || '-',
        address: student.address || '-',
      };
    }

    // Aluno Criança: buscar adulto responsável na família
    const familyMembers: any[] = student.family?.students || [];
    const adultResponsible = familyMembers.find(
      (m: any) => m.type === 'ADULT' && m.id !== student.id,
    );

    if (adultResponsible) {
      return {
        name: `${adultResponsible.name} (Resp. p/ ${student.name})`,
        cpf: adultResponsible.cpf || '-',
        phone: adultResponsible.phone || student.phone || '-',
        address: adultResponsible.address || student.address || '-',
      };
    }

    // Caso a criança não tenha adulto cadastrado na família, utilizar dados disponíveis do aluno
    return {
      name: `${student.name} (Menor de idade)`,
      cpf: '-',
      phone: student.phone || '-',
      address: student.address || '-',
    };
  }

  /**
   * Formata data para o padrão pt-BR (DD/MM/AAAA)
   */
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formata valor numérico para moeda brasileira (R$ 0,00)
   */
  private formatCurrency(value: number | string | any): string {
    const num = Number(value) || 0;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Quebra texto em linhas cabíveis no espaço do PDF
   */
  private wrapText(text: string, maxCharsPerLine = 85): string[] {
    if (!text) return [];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Gera ou preenche uma cópia do documento RECIBO SERVICO.pdf para a matrícula informada.
   * O template original nunca é alterado. O documento resultante é salvo em uploads
   * e registrado na tabela ServiceReceipt vinculado ao Enrollment.
   */
  async generateReceipt(
    enrollmentId: string,
    options?: GenerateReceiptOptions,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            family: {
              include: {
                students: true,
              },
            },
          },
        },
        modality: true,
        class: true,
        serviceReceipt: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada.`);
    }

    const templatePath = this.resolveTemplatePath();
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.getPage(0);
    const textColor = rgb(0.1, 0.1, 0.1);

    // 1. Dados do Prestador
    const provider = await this.getProviderSettings();
    const generationDateStr = this.formatDate(new Date());

    page.drawText(provider.cnpj, {
      x: 412,
      y: 662,
      size: 9,
      font: boldFont,
      color: textColor,
    });

    page.drawText(provider.address, {
      x: 135,
      y: 638,
      size: 8.5,
      font: regularFont,
      color: textColor,
    });

    page.drawText(provider.phone, {
      x: 420,
      y: 638,
      size: 9,
      font: regularFont,
      color: textColor,
    });

    page.drawText(provider.cityState, {
      x: 155,
      y: 620,
      size: 8.5,
      font: regularFont,
      color: textColor,
    });

    page.drawText(generationDateStr, {
      x: 408,
      y: 620,
      size: 9,
      font: boldFont,
      color: textColor,
    });

    // 2. Dados do Cliente (Adulto ou Responsável se Criança)
    const clientData = this.resolveClientData(enrollment.student);

    page.drawText(clientData.name, {
      x: 175,
      y: 584,
      size: 9,
      font: boldFont,
      color: textColor,
    });

    page.drawText(clientData.cpf, {
      x: 138,
      y: 566,
      size: 9,
      font: regularFont,
      color: textColor,
    });

    page.drawText(clientData.phone, {
      x: 330,
      y: 566,
      size: 9,
      font: regularFont,
      color: textColor,
    });

    page.drawText(clientData.address, {
      x: 135,
      y: 551,
      size: 8.5,
      font: regularFont,
      color: textColor,
    });

    // 3. Tabela de Serviços Prestados
    const originalModalityName = enrollment.modality?.name || 'Pilates';
    const documentServiceName = this.mapModalityToDocumentName(originalModalityName);
    const rowY = this.getTableRowYCoordinate(documentServiceName);

    // Descrição / período
    const startDateFormatted = this.formatDate(enrollment.startDate);
    const classInfo = enrollment.class?.name ? ` • Turma: ${enrollment.class.name}` : '';
    const descriptionText = `Início: ${startDateFormatted}${classInfo}`;

    page.drawText(descriptionText, {
      x: 175,
      y: rowY,
      size: 8.5,
      font: regularFont,
      color: textColor,
    });

    // Valor da linha (Enrollment.finalPrice)
    const formattedPrice = this.formatCurrency(enrollment.finalPrice);
    page.drawText(formattedPrice, {
      x: 438,
      y: rowY,
      size: 9,
      font: boldFont,
      color: textColor,
    });

    // 4. Forma de Pagamento
    const method = (options?.paymentMethod || 'PIX').toUpperCase();
    const checkboxMap: Record<string, number> = {
      PIX: 188.5,
      DINHEIRO: 212.5,
      CARTAO: 252.0,
      TRANSFERENCIA: 286.5,
      OUTRO: 345.0,
    };

    const checkX = checkboxMap[method] || 188.5;
    page.drawText('X', {
      x: checkX,
      y: 373.5,
      size: 8.5,
      font: boldFont,
      color: textColor,
    });

    // 5. Total (Enrollment.finalPrice)
    page.drawText(formattedPrice, {
      x: 445,
      y: 373.5,
      size: 9.5,
      font: boldFont,
      color: textColor,
    });

    // 6. Observações
    const observationText =
      options?.observation ||
      enrollment.observation ||
      (enrollment.discountPercentage && Number(enrollment.discountPercentage) > 0
        ? `Desconto aplicado: ${Number(enrollment.discountPercentage).toFixed(0)}% sobre o valor da mensalidade.`
        : '');

    if (observationText) {
      const obsLines = this.wrapText(observationText, 80);
      let currentObsY = 325;
      for (const line of obsLines.slice(0, 4)) {
        page.drawText(line, {
          x: 88,
          y: currentObsY,
          size: 8,
          font: regularFont,
          color: textColor,
        });
        currentObsY -= 15;
      }
    }

    // Salvar o arquivo gerado
    const uploadDir = this.resolveUploadDir();
    const fileName = `recibo-servico-${enrollment.id}.pdf`;
    const targetFilePath = path.join(uploadDir, fileName);

    const generatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(targetFilePath, generatedPdfBytes);

    const relativePath = path.join('uploads/documents/receipts', fileName);

    // 7. Registrar / Atualizar ServiceReceipt no Banco de Dados
    const receiptRecord = await this.prisma.serviceReceipt.upsert({
      where: { enrollmentId },
      update: {
        documentPath: relativePath,
        status: enrollment.serviceReceipt?.status || 'PENDING',
        filledAt: new Date(),
        observation: observationText || null,
      },
      create: {
        enrollmentId,
        documentPath: relativePath,
        status: 'PENDING',
        filledAt: new Date(),
        observation: observationText || null,
      },
    });

    return {
      receipt: receiptRecord,
      filePath: targetFilePath,
      relativePath,
      fileName,
      clientData,
      documentServiceName,
      finalPrice: Number(enrollment.finalPrice),
    };
  }

  /**
   * Obtém os metadados do documento gerado para uma matrícula.
   * Se ainda não foi gerado, prepara automaticamente.
   */
  async getReceiptMetadata(enrollmentId: string) {
    const receipt = await this.prisma.serviceReceipt.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            student: true,
            modality: true,
            class: true,
          },
        },
      },
    });

    if (!receipt || !receipt.documentPath) {
      // Auto-gerar documento se ainda não existe
      return this.generateReceipt(enrollmentId);
    }

    const uploadDir = this.resolveUploadDir();
    const absolutePath = path.isAbsolute(receipt.documentPath)
      ? receipt.documentPath
      : path.resolve(process.cwd(), receipt.documentPath.startsWith('backend') ? '' : 'backend', receipt.documentPath);

    const fileExists = fs.existsSync(absolutePath);

    if (!fileExists) {
      // Arquivo foi removido ou não foi salvo no disco, regerar
      return this.generateReceipt(enrollmentId);
    }

    return {
      receipt,
      filePath: absolutePath,
      relativePath: receipt.documentPath,
      fileName: path.basename(absolutePath),
      documentServiceName: this.mapModalityToDocumentName(
        receipt.enrollment?.modality?.name || '',
      ),
      finalPrice: Number(receipt.enrollment?.finalPrice || 0),
    };
  }

  /**
   * Retorna o buffer do PDF gerado para visualização/download.
   */
  async getReceiptPdfBuffer(enrollmentId: string): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const meta = await this.getReceiptMetadata(enrollmentId);
    if (!fs.existsSync(meta.filePath)) {
      await this.generateReceipt(enrollmentId);
    }

    const buffer = fs.readFileSync(meta.filePath);
    return {
      buffer,
      fileName: meta.fileName,
    };
  }

  /**
   * Atualiza o status do documento (PENDING, APPROVED, REJECTED)
   */
  async updateReceiptStatus(
    enrollmentId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    observation?: string,
  ) {
    const receipt = await this.prisma.serviceReceipt.findUnique({
      where: { enrollmentId },
    });

    if (!receipt) {
      throw new NotFoundException(
        `Documento de recibo para matrícula ${enrollmentId} não encontrado.`,
      );
    }

    if (status === 'APPROVED') {
      await this.prisma.enrollment.updateMany({
        where: {
          id: enrollmentId,
          status: {
            in: [
              'PENDING_DOCUMENTATION',
              'AWAITING_APPROVAL',
            ] as any,
          },
        },
        data: {
          status: 'ACTIVE' as any,
          approvedAt: new Date(),
        },
      });
    }

    return this.prisma.serviceReceipt.update({
      where: { enrollmentId },
      data: {
        status: status as any,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        ...(observation !== undefined && { observation }),
      },
    });
  }
}
