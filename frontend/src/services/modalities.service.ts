import {api} from './api';

export interface Modality {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | string;
  requiresClass: boolean;
  capacity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModalityData {
  name: string;
  description?: string;
  monthlyPrice: number;
  requiresClass: boolean;
  capacity?: number;
  active?: boolean;
}

export interface UpdateModalityData {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  requiresClass?: boolean;
  capacity?: number;
  active?: boolean;
}

export const modalitiesService = {
  async findAll(): Promise<Modality[]> {
    const response = await api.get<Modality[]>('/modalities');
    return response.data;
  },

  async findOne(id: string): Promise<Modality> {
    const response = await api.get<Modality>(`/modalities/${id}`);
    return response.data;
  },

  async create(data: CreateModalityData): Promise<Modality> {
    const response = await api.post<Modality>('/modalities', data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateModalityData,
  ): Promise<Modality> {
    const response = await api.patch<Modality>(
      `/modalities/${id}`,
      data,
    );

    return response.data;
  },

  async activate(id: string): Promise<Modality> {
    const response = await api.patch<Modality>(
      `/modalities/${id}/activate`,
    );

    return response.data;
  },

  async deactivate(id: string): Promise<Modality> {
    const response = await api.patch<Modality>(
      `/modalities/${id}/deactivate`,
    );

    return response.data;
  },
};