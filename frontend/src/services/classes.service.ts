import { api } from './api';
import type { Modality } from './modalities.service';

export interface ClassSchedule {
  dayOfWeek: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  startTime: string; // "08:00"
  endTime: string;   // "08:50"
}

export interface Class {
  id: string;
  name: string;
  modalityId: string;
  capacity: number;
  schedules: ClassSchedule[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  modality?: Modality | null;
  enrolledCount?: number;
}

export const classesService = {
  async findAll(modalityId?: string): Promise<Class[]> {
    const response = await api.get<Class[]>('/classes', {
      params: modalityId ? { modalityId } : undefined,
    });
    return response.data;
  },

  async findOne(id: string): Promise<Class> {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },

  async create(data: {
    name: string;
    modalityId: string;
    capacity?: number | null;
    schedules: ClassSchedule[];
    active?: boolean;
  }): Promise<Class> {
    const response = await api.post<Class>('/classes', data);
    return response.data;
  },

  async update(
    id: string,
    data: {
      name?: string;
      modalityId?: string;
      capacity?: number | null;
      schedules?: ClassSchedule[];
      active?: boolean;
    },
  ): Promise<Class> {
    const response = await api.patch<Class>(`/classes/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/classes/${id}`);
    return response.data;
  },
};
