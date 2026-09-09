import { api } from './api';
import type { Student } from './students.service';
import type { Enrollment } from './enrollments.service';

export type DocumentType = 'RECEIPT' | 'CERTIFICATE';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AppDocument {
  id: string;
  studentId: string;
  enrollmentId?: string | null;
  type: DocumentType;
  title: string;
  content: string;
  status: DocumentStatus;
  issueDate?: string | null;
  expirationDate?: string | null;
  observation?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student | null;
  enrollment?: Enrollment | null;
}

export interface CreateDocumentData {
  studentId: string;
  enrollmentId?: string | null;
  type: DocumentType;
  title: string;
  content: string;
  status?: DocumentStatus;
  issueDate?: string;
  expirationDate?: string | null;
  observation?: string | null;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  issueDate?: string;
  expirationDate?: string | null;
  observation?: string | null;
}

export const documentsService = {
  async findAll(params?: {
    studentId?: string;
    enrollmentId?: string;
    type?: DocumentType;
  }): Promise<AppDocument[]> {
    const response = await api.get<AppDocument[]>('/documents', { params });
    return response.data;
  },

  async findOne(id: string): Promise<AppDocument> {
    const response = await api.get<AppDocument>(`/documents/${id}`);
    return response.data;
  },

  async create(data: CreateDocumentData): Promise<AppDocument> {
    const response = await api.post<AppDocument>('/documents', data);
    return response.data;
  },

  async update(id: string, data: UpdateDocumentData): Promise<AppDocument> {
    const response = await api.patch<AppDocument>(`/documents/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
