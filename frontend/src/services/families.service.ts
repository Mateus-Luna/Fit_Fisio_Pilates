import { api } from "./api";

export interface FamilyStudent {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  type: 'ADULT' | 'CHILD';
  active: boolean;
  familyId: string | null;
}

export interface Family {
  id: string;
  name: string;
  observation: string | null;
  createdAt: string;
  updatedAt: string;
  students: FamilyStudent[];
}

export interface CreateFamilyData {
  name: string;
  observation?: string;
}

export interface UpdateFamilyData {
  name?: string;
  observation?: string;
}

export const familiesService = {
  async findAll(): Promise<Family[]> {
    const response = await api.get<Family[]>('/families');
    return response.data;
  },

  async findOne(id: string): Promise<Family> {
    const response = await api.get<Family>(`/families/${id}`);
    return response.data;
  },

  async create(data: CreateFamilyData): Promise<Family> {
    const response = await api.post<Family>('/families', data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateFamilyData,
  ): Promise<Family> {
    const response = await api.patch<Family>(
      `/families/${id}`,
      data,
    );

    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/families/${id}`);
  },
};