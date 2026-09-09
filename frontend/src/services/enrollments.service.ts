import { api } from './api';
import type { Student } from './students.service';
import type { Modality } from './modalities.service';
import type { Class } from './classes.service';
import type { AppDocument } from './documents.service';

export type EnrollmentStatus =
  | 'PENDING_DOCUMENTATION'
  | 'AWAITING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Enrollment {
  id: string;
  studentId: string;
  modalityId: string;
  classId?: string | null;
  status: EnrollmentStatus;
  startDate: string;
  endDate?: string | null;
  approvedAt?: string | null;
  contractedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  observation?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student | null;
  modality?: Modality | null;
  class?: Class | null;
  documents?: AppDocument[];
}

export interface CreateEnrollmentData {
  studentId: string;
  modalityId: string;
  classId?: string | null;
  startDate?: string;
  endDate?: string | null;
  discountPercentage?: number;
  observation?: string | null;
}

export interface UpdateEnrollmentData {
  modalityId?: string;
  classId?: string | null;
  startDate?: string;
  endDate?: string | null;
  discountPercentage?: number;
  observation?: string | null;
}

export const enrollmentsService = {
  async findAll(params?: {
    studentId?: string;
    modalityId?: string;
    status?: string;
  }): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>('/enrollments', { params });
    return response.data;
  },

  async findOne(id: string): Promise<Enrollment> {
    const response = await api.get<Enrollment>(`/enrollments/${id}`);
    return response.data;
  },

  async create(data: CreateEnrollmentData): Promise<Enrollment> {
    const response = await api.post<Enrollment>('/enrollments', data);
    return response.data;
  },

  async update(id: string, data: UpdateEnrollmentData): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}`, data);
    return response.data;
  },

  async requestApproval(id: string): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}/request-approval`);
    return response.data;
  },

  async approve(id: string): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}/approve`);
    return response.data;
  },

  async suspend(id: string): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}/suspend`);
    return response.data;
  },

  async reactivate(id: string): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}/reactivate`);
    return response.data;
  },

  async cancel(id: string): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`/enrollments/${id}/cancel`);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/enrollments/${id}`);
  },
};
