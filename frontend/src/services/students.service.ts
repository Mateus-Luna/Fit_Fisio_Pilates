import {api} from './api';

export type StudentType = 'ADULT' | 'CHILD';

export interface StudentFamily {
  id: string;
  name: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  modalityId: string;
  status: string;
  startDate?: string;
  endDate?: string | null;
  contractedPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalPrice?: number;
  observation?: string | null;
  modality?: {
    id: string;
    name: string;
  };
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  address: string | null;
  observation: string | null;
  type: StudentType;
  rg: string | null;
  cpf: string | null;
  active: boolean;
  familyId: string | null;
  family: StudentFamily | null;
  enrollments?: StudentEnrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  name: string;
  birthDate: string;
  type: StudentType;
  phone: string;
  address?: string;
  observation?: string;
  rg?: string;
  cpf?: string;
  familyId?: string | null;
}

export interface UpdateStudentData {
  name?: string;
  birthDate?: string;
  type?: StudentType;
  phone?: string;
  address?: string;
  observation?: string;
  rg?: string;
  cpf?: string;
  familyId?: string | null;
}

export const studentsService = {
  async findAll(): Promise<Student[]> {
    const response = await api.get<Student[]>('/students');
    return response.data;
  },

  async findOne(id: string): Promise<Student> {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  async create(data: CreateStudentData): Promise<Student> {
    const response = await api.post<Student>('/students', data);
    return response.data;
  },

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  async activate(id: string): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}/activate`);
    return response.data;
  },

  async deactivate(id: string): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}/deactivate`);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },
};