import { api } from './api';
import type { Student } from './students.service';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'PIX' | 'CARD' | 'CASH';

export interface PaymentEnrollment {
  id: string;
  studentId?: string;
  modalityId?: string;
  classId?: string | null;
  status?: string;
  contractedPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalPrice?: number;
  modality?: {
    id: string;
    name: string;
    monthlyPrice?: number;
  };
  class?: {
    id: string;
    name: string;
    weekday?: string;
    time?: string;
  } | null;
}

export interface Payment {
  id: string;
  studentId: string;
  enrollmentId: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  amount: number | string;
  discountAmount: number | string;
  finalAmount: number | string;
  method?: PaymentMethod | null;
  status: PaymentStatus;
  paidAt?: string | null;
  transactionId?: string | null;
  receiptGenerated?: boolean;
  observation?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  enrollment?: PaymentEnrollment;
}

export interface StudentMonthlySummary {
  studentId: string;
  referenceMonth: number;
  referenceYear: number;
  payments: Payment[];
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface CreateMonthlyResult {
  studentId: string;
  studentName: string;
  referenceMonth: number;
  referenceYear: number;
  payments: Payment[];
  totalAmount: number;
}

export interface PaymentFilters {
  studentId?: string;
  enrollmentId?: string;
  status?: PaymentStatus;
  referenceMonth?: number;
  referenceYear?: number;
}

export const paymentsService = {
  async findAll(filters?: PaymentFilters): Promise<Payment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.enrollmentId) params.append('enrollmentId', filters.enrollmentId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.referenceMonth !== undefined) params.append('referenceMonth', String(filters.referenceMonth));
      if (filters?.referenceYear !== undefined) params.append('referenceYear', String(filters.referenceYear));

      const response = await api.get<Payment[]>(`/payments?${params.toString()}`);
      if (Array.isArray(response.data)) return response.data;
      if (response.data && typeof response.data === 'object') {
        const anyData = response.data as any;
        if (Array.isArray(anyData.payments)) return anyData.payments;
        if (Array.isArray(anyData.data)) return anyData.data;
      }
      return [];
    } catch (err) {
      console.warn('Erro ao carregar pagamentos:', err);
      return [];
    }
  },

  async findOverdue(): Promise<Payment[]> {
    try {
      const response = await api.get<Payment[]>('/payments/overdue');
      if (Array.isArray(response.data)) return response.data;
      if (response.data && typeof response.data === 'object') {
        const anyData = response.data as any;
        if (Array.isArray(anyData.payments)) return anyData.payments;
        if (Array.isArray(anyData.data)) return anyData.data;
      }
      return [];
    } catch (err) {
      console.warn('Erro ao carregar inadimplentes:', err);
      return [];
    }
  },

  async findOne(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async getStudentMonthlySummary(
    studentId: string,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<StudentMonthlySummary> {
    const response = await api.get<StudentMonthlySummary>(
      `/payments/student/${studentId}/monthly-summary?referenceMonth=${referenceMonth}&referenceYear=${referenceYear}`,
    );
    return response.data;
  },

  async createMonthlyPaymentsForStudent(
    studentId: string,
    data: {
      referenceMonth: number;
      referenceYear: number;
      dueDate: string;
    },
  ): Promise<CreateMonthlyResult> {
    const response = await api.post<CreateMonthlyResult>(
      `/payments/student/${studentId}/monthly`,
      data,
    );
    return response.data;
  },

  async create(data: {
    studentId: string;
    enrollmentId: string;
    referenceMonth: number;
    referenceYear: number;
    dueDate: string;
    observation?: string;
  }): Promise<Payment> {
    const response = await api.post<Payment>('/payments', data);
    return response.data;
  },

  async markAsPaid(
    id: string,
    method: PaymentMethod,
    transactionId?: string,
  ): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/pay`, {
      method,
      transactionId: transactionId || undefined,
    });
    return response.data;
  },

  async confirmOnlinePayment(
    id: string,
    method: PaymentMethod,
    transactionId: string,
  ): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/confirm-online`, {
      method,
      transactionId,
    });
    return response.data;
  },

  async cancel(id: string): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/cancel`);
    return response.data;
  },

  async updateOverduePayments(): Promise<{ updated: number }> {
    const response = await api.patch<{ updated: number }>('/payments/overdue/update');
    return response.data;
  },

  async checkOverdue(): Promise<{ updatedPayments: number; notificationsCreated: number }> {
    const response = await api.post<{ updatedPayments: number; notificationsCreated: number }>(
      '/payments/check-overdue',
    );
    return response.data;
  },
};
