import {api} from './api';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingData {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateSettingData {
  value?: string;
  description?: string;
}

export const settingsService = {
  async findAll(): Promise<SystemSetting[]> {
    const response = await api.get<SystemSetting[]>('/settings');
    return response.data;
  },

  async findOne(key: string): Promise<SystemSetting> {
    const response = await api.get<SystemSetting>(`/settings/${key}`);
    return response.data;
  },

  async create(data: CreateSettingData): Promise<SystemSetting> {
    const response = await api.post<SystemSetting>('/settings', data);
    return response.data;
  },

  async update(
    key: string,
    data: UpdateSettingData,
  ): Promise<SystemSetting> {
    const response = await api.patch<SystemSetting>(
      `/settings/${key}`,
      data,
    );

    return response.data;
  },

  async remove(key: string): Promise<void> {
    await api.delete(`/settings/${key}`);
  },
};