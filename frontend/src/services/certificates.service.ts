import { api } from './api';

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED';

export interface ServiceReceipt {
  id: string;
  enrollmentId: string;
  documentPath: string;
  status: CertificateStatus;
  filledAt?: string;
  approvedAt?: string | null;
  observation?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateMetadataResponse {
  receipt: ServiceReceipt;
  filePath?: string;
  relativePath?: string;
  fileName?: string;
  documentServiceName?: string;
  finalPrice?: number;
  clientData?: {
    name: string;
    cpf: string;
    phone: string;
    address: string;
  };
}

export interface GenerateCertificateOptions {
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO';
  observation?: string;
}

export const certificatesService = {
  /**
   * Gera ou regenera o documento oficial Certificate (Recibo de Serviço)
   * baseado no template oficial do sistema (RECIBO SERVICO.pdf)
   */
  async generate(
    enrollmentId: string,
    options?: GenerateCertificateOptions,
  ): Promise<CertificateMetadataResponse> {
    const response = await api.post<CertificateMetadataResponse>(
      `/enrollments/${enrollmentId}/document/generate`,
      options || {},
    );
    return response.data;
  },

  /**
   * Obtém os metadados do Certificate (status, data, caminho, observação)
   */
  async getMetadata(enrollmentId: string): Promise<CertificateMetadataResponse> {
    const response = await api.get<CertificateMetadataResponse>(
      `/enrollments/${enrollmentId}/document`,
    );
    return response.data;
  },

  /**
   * Obtém o stream do PDF como Blob com autenticação
   */
  async getPdfBlob(enrollmentId: string): Promise<Blob> {
    const response = await api.get(`/enrollments/${enrollmentId}/document/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Atualiza o status do documento: PENDING, APPROVED, REJECTED
   */
  async updateStatus(
    enrollmentId: string,
    status: CertificateStatus,
    observation?: string,
  ): Promise<ServiceReceipt> {
    const response = await api.patch<ServiceReceipt>(
      `/enrollments/${enrollmentId}/document/status`,
      {
        status,
        observation,
      },
    );
    return response.data;
  },

  /**
   * Marca o documento oficial como assinado fisicamente ou pendente
   */
  async markAsSigned(
    enrollmentId: string,
    signed: boolean = true,
  ): Promise<ServiceReceipt> {
    const response = await api.patch<ServiceReceipt>(
      `/enrollments/${enrollmentId}/document/status`,
      {
        status: signed ? 'APPROVED' : 'PENDING',
        signed,
      },
    );
    return response.data;
  },

  /**
   * Retorna a URL direta do endpoint de PDF
   */
  getPdfUrl(enrollmentId: string): string {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/enrollments/${enrollmentId}/document/pdf`;
  },
};
