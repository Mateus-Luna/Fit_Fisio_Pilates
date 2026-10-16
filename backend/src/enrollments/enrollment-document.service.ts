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
    throw new NotFoundException('Matrícula não encontrada.');
  }

  try {
    // Localiza o modelo original do recibo.
    const templatePath = this.resolveTemplatePath();

    // Prepara a pasta de destino.
    const uploadDir = this.resolveUploadDir();

    const fileName = `recibo-servico-${enrollment.id}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // Copia o modelo original sem preencher ou alterar o PDF.
    await fs.promises.copyFile(templatePath, filePath);

    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, '/');

    // Mantém o recibo vinculado à matrícula.
    const receipt = await this.prisma.serviceReceipt.upsert({
      where: {
        enrollmentId: enrollment.id,
      },
      create: {
        enrollmentId: enrollment.id,
        documentPath: relativePath,
        status: 'PENDING',
        filledAt: new Date(),
        observation: options?.observation ?? null,
      },
      update: {
        documentPath: relativePath,
        status: 'PENDING',
        filledAt: new Date(),
        observation: options?.observation ?? null,
      },
    });

    return {
      receipt,
      filePath,
      relativePath,
      fileName,
      clientData: this.resolveClientData(enrollment.student),
      documentServiceName: this.mapModalityToDocumentName(
        enrollment.modality.name,
      ),
      finalPrice: enrollment.finalPrice,
    };
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }

    this.logger.error(
      `Erro ao gerar recibo da matrícula ${enrollmentId}`,
      error instanceof Error ? error.stack : String(error),
    );

    throw new InternalServerErrorException(
      'Não foi possível gerar o recibo de serviço.',
    );
  }
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
        'Recibo de serviço não encontrado para esta matrícula.',
      );
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

  /**
   * Atualiza exclusivamente a assinatura do recibo.
   *
   * isSigned = true:
   *   - marca o documento como assinado;
   *   - registra a data/hora da assinatura.
   *
   * isSigned = false:
   *   - remove a marca de assinatura;
   *   - limpa a data da assinatura.
   */
  async updateReceiptSignature(
    enrollmentId: string,
    isSigned: boolean,
  ) {
    const receipt = await this.prisma.serviceReceipt.findUnique({
      where: { enrollmentId },
    });

    if (!receipt) {
      throw new NotFoundException(
        'Recibo de serviço não encontrado para esta matrícula.',
      );
    }

    return this.prisma.serviceReceipt.update({
      where: { enrollmentId },
      data: {
        isSigned,
        signedAt: isSigned ? new Date() : null,
      },
    });
  }
}

